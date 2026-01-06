import { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useNavigate } from 'react-router-dom';
import { getStatusColor } from '../../utils/colorHelpers';
import ConfirmModal from '../modals/ConfirmModal';
import './RunCard.css';

const RunCard = ({ run }) => {
  const navigate = useNavigate();
  const { loadRun, rerunFlow } = useEditorStore();
  const [showRerunConfirm, setShowRerunConfirm] = useState(false);

  const handleView = async () => {
    const result = await loadRun(run.id);
    if (result.success) {
      navigate(`/runs/${run.id}`);
    }
  };

  const handleRerunClick = () => {
    setShowRerunConfirm(true);
  };

  const handleRerunConfirm = async () => {
    setShowRerunConfirm(false);
    const result = await rerunFlow(run.id);
    if (result.success) {
      navigate(`/runs/${result.run.id}`);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColorLocal = (status) => {
    return getStatusColor(status);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'error':
        return 'Error';
      case 'running':
        return 'Ejecutando';
      case 'pending':
        return 'Pendiente';
      default:
        return status;
    }
  };

  const isActive = run.status === 'running' || run.status === 'pending';

  return (
    <>
      <ConfirmModal
        isOpen={showRerunConfirm}
        onClose={() => setShowRerunConfirm(false)}
        onConfirm={handleRerunConfirm}
        title="Re-ejecutar Flow"
        message="¿Estás seguro de que deseas re-ejecutar este flow? Se creará una nueva ejecución."
        confirmText="Re-ejecutar"
        cancelText="Cancelar"
        type="default"
      />
      <div className={`run-card ${isActive ? 'run-card-active' : ''}`}>
        <div className="run-card-header">
          <div className="run-card-status">
            <div
              className={`run-card-status-dot ${isActive ? 'pulsing' : ''}`}
              style={{ backgroundColor: getStatusColorLocal(run.status) }}
            />
            <span className="run-card-status-label">{getStatusLabel(run.status)}</span>
            {isActive && (
              <span className="run-card-status-badge">Activo</span>
            )}
          </div>
          <div className="run-card-date">{formatDate(run.created_at || run.started_at || run.createdAt)}</div>
        </div>
      {run.error && (
        <div className="run-card-error">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{run.error}</span>
        </div>
      )}
      <div className="run-card-actions">
        <button className="run-card-button run-card-button-primary" onClick={handleView}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="12"
              cy="12"
              r="3"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          Ver Detalle
        </button>
        <button 
          className="run-card-button run-card-button-secondary" 
          onClick={handleRerunClick}
          disabled={isActive}
        >
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
    </>
  );
};

export default RunCard;

