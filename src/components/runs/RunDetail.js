import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditorStore } from '../../store/editorStore';
import { getStatusColor } from '../../utils/colorHelpers';
import TraceView from './TraceView';
import ConfirmModal from '../modals/ConfirmModal';
import AlertModal from '../modals/AlertModal';
import './RunDetail.css';

const RunDetail = () => {
  const { runId } = useParams();
  const navigate = useNavigate();
  const { selectedRun, trace, loadRun, rerunFlow, cancelRun, startPollingRun, stopPolling } = useEditorStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRerunConfirm, setShowRerunConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', type: 'error' });

  useEffect(() => {
    const initialize = async () => {
      if (!runId) {
        setError('ID de ejecución no proporcionado');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const result = await loadRun(runId);
        
        // Si el run está activo (running o pending), iniciar polling
        if (result.success && result.run) {
          const status = result.run.status;
          if (status === 'running' || status === 'pending') {
            startPollingRun(runId);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initialize();
    
    // Limpiar polling al desmontar el componente
    return () => {
      stopPolling();
    };
  }, [runId, loadRun, startPollingRun, stopPolling]);
  
  // Efecto adicional para iniciar/detener polling según el estado del run
  useEffect(() => {
    if (!selectedRun || !runId) return;
    
    const status = selectedRun.status;
    const isActive = status === 'running' || status === 'pending';
    const isFinal = ['completed', 'error', 'cancelled', 'timeout'].includes(status);
    
    if (isActive && selectedRun.id === runId) {
      // Si el run está activo y coincide con el runId de la URL, iniciar polling
      startPollingRun(runId);
    } else if (isFinal) {
      // Si el run terminó, detener polling
      stopPolling();
    }
  }, [selectedRun, runId, startPollingRun, stopPolling]);

  const handleRerunClick = () => {
    setShowRerunConfirm(true);
  };

  const handleRerunConfirm = async () => {
    setShowRerunConfirm(false);
    if (!runId) return;
    const result = await rerunFlow(runId);
    if (result.success) {
      navigate(`/runs/${result.run.id}`);
    }
  };

  const handleCancelClick = () => {
    setShowCancelConfirm(true);
  };

  const handleCancelConfirm = async () => {
    setShowCancelConfirm(false);
    if (!runId) return;
    const result = await cancelRun(runId);
    if (result.success) {
      // Recargar el run para ver el estado actualizado
      await loadRun(runId);
    } else {
      setAlertModal({ isOpen: true, message: `Error al cancelar: ${result.error}`, type: 'error' });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const isRunTimeout = () => {
    return selectedRun?.error?.code === 'RUN_TIMEOUT' || 
           (typeof selectedRun?.error === 'object' && selectedRun.error?.code === 'RUN_TIMEOUT');
  };

  const getStatusColorLocal = (status) => {
    // Si es timeout del run completo, usar color warning
    if (isRunTimeout()) {
      return getStatusColor(status, 'RUN_TIMEOUT');
    }
    return getStatusColor(status);
  };

  const getStatusLabel = (status) => {
    if (isRunTimeout()) {
      return 'Timeout';
    }
    
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'error':
        return 'Error';
      case 'running':
        return 'Ejecutando';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="run-detail-container">
        <div className="run-detail-loading">Cargando ejecución...</div>
      </div>
    );
  }

  if (error || !selectedRun) {
    return (
      <div className="run-detail-container">
        <div className="run-detail-error">
          <p>Error: {error || 'Ejecución no encontrada'}</p>
          <button onClick={() => navigate('/runs')}>Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div className="run-detail-container">
      <div className="run-detail-header">
        <button
          className="run-detail-back-button"
          onClick={() => navigate('/runs')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M19 12H5M5 12L12 19M5 12L12 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Volver
        </button>
        <div className="run-detail-info">
          <div className="run-detail-status">
            <div
              className="run-detail-status-dot"
              style={{ backgroundColor: getStatusColorLocal(selectedRun.status) }}
            />
            <h1 className="run-detail-title">{getStatusLabel(selectedRun.status)}</h1>
          </div>
          <div className="run-detail-meta">
            <div className="run-detail-date">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {formatDate(selectedRun.created_at || selectedRun.started_at || selectedRun.createdAt)}
            </div>
            {selectedRun && (selectedRun.status === 'running' || selectedRun.status === 'pending') && (
              <button className="run-detail-cancel-button" onClick={handleCancelClick}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M6 18L18 6M6 6L18 18"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Cancelar
              </button>
            )}
            <button className="run-detail-rerun-button" onClick={handleRerunClick}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M1 4V10H7M23 20V14H17M14.5 3.5C16.5711 4.54537 18 6.85884 18 9.5C18 12.1412 16.5711 14.4546 14.5 15.5M9.5 20.5C7.42893 19.4546 6 17.1412 6 14.5C6 11.8588 7.42893 9.54537 9.5 8.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Re-ejecutar
            </button>
          </div>
        </div>
      </div>

      {selectedRun.error && (
        <div className={`run-detail-error-box ${isRunTimeout() ? 'run-detail-error-box-timeout' : ''}`}>
          {isRunTimeout() ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path
                d="M12 6V12L16 14"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
          <div>
            <strong>{isRunTimeout() ? 'Timeout de Ejecución:' : 'Error:'}</strong>
            {isRunTimeout() ? (
              <div className="run-detail-timeout-message">
                <p>
                  La ejecución excedió el tiempo máximo de{' '}
                  <strong>{selectedRun.error?.timeout_seconds || selectedRun.error?.timeoutSeconds || 'N/A'} segundos</strong>.
                </p>
                {selectedRun.error?.elapsed_seconds && (
                  <p className="run-detail-timeout-detail">
                    Tiempo transcurrido: {selectedRun.error.elapsed_seconds.toFixed(1)}s
                  </p>
                )}
                {selectedRun.error?.message && (
                  <p className="run-detail-timeout-detail">{selectedRun.error.message}</p>
                )}
                <p className="run-detail-timeout-suggestion">
                  💡 Sugerencia: Intenta aumentar el timeout o revisa si el flow tiene loops infinitos.
                </p>
              </div>
            ) : (
              <p>{typeof selectedRun.error === 'string' ? selectedRun.error : selectedRun.error?.message || JSON.stringify(selectedRun.error)}</p>
            )}
          </div>
        </div>
      )}

      <div className="run-detail-content">
        <h2 className="run-detail-section-title">Trace de Ejecución</h2>
        <TraceView trace={trace} />
      </div>
      <ConfirmModal
        isOpen={showRerunConfirm}
        onClose={() => setShowRerunConfirm(false)}
        onConfirm={handleRerunConfirm}
        title="Re-ejecutar Flow"
        message="¿Estás seguro de que deseas re-ejecutar este flow? Se creará una nueva ejecución basada en el mismo flow."
        confirmText="Re-ejecutar"
        cancelText="Cancelar"
        type="default"
      />
      <ConfirmModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancelConfirm}
        title="Cancelar Ejecución"
        message="¿Estás seguro de que deseas cancelar esta ejecución? Esta acción no se puede deshacer."
        confirmText="Cancelar ejecución"
        cancelText="No cancelar"
        type="danger"
      />
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ isOpen: false, message: '', type: 'error' })}
        title="Error"
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
};

export default RunDetail;

