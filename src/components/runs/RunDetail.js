import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditorStore } from '../../store/editorStore';
import { getStatusColor } from '../../utils/colorHelpers';
import TraceView from './TraceView';
import ConfirmModal from '../modals/ConfirmModal';
import AlertModal from '../modals/AlertModal';
import { Bot, Layers, Clock, ArrowLeft, X, RefreshCw, Calendar, AlertCircle, ChevronDown, ChevronRight, Brain, Zap } from 'lucide-react';
import './RunDetail.css';

/**
 * Componente para mostrar el historial de acciones del agente
 */
const AgentHistoryPanel = ({ trace, isExpanded, onToggle }) => {
  // Filtrar solo las iteraciones del AgentCore
  const agentIterations = trace.filter(entry => {
    const nodeId = entry.node_id || entry.nodeId;
    return (
      nodeId?.includes('agent') ||
      nodeId?.includes('core') ||
      entry.output?.iteration !== undefined ||
      entry.output?.action !== undefined
    );
  });

  if (agentIterations.length === 0) return null;

  const getActionIcon = (type) => {
    switch (type) {
      case 'llm': return <Brain size={14} />;
      case 'tool': return <Zap size={14} />;
      default: return <Bot size={14} />;
    }
  };

  return (
    <div className="run-detail-agent-history">
      <div 
        className="run-detail-agent-history-header"
        onClick={onToggle}
      >
        <span className="run-detail-agent-history-toggle">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
        <Bot size={18} />
        <span className="run-detail-agent-history-title">
          Historial de Decisiones del Agente
        </span>
        <span className="run-detail-agent-history-count">
          {agentIterations.length} iteracion{agentIterations.length !== 1 ? 'es' : ''}
        </span>
      </div>

      {isExpanded && (
        <div className="run-detail-agent-history-content">
          {agentIterations.map((entry, idx) => {
            const iteration = entry.output?.iteration ?? idx + 1;
            const action = entry.output?.action;
            const confidence = action?.confidence;

            return (
              <div key={idx} className="run-detail-agent-history-item">
                <div className="run-detail-agent-history-item-number">
                  {iteration}
                </div>
                <div className="run-detail-agent-history-item-content">
                  <div className="run-detail-agent-history-item-action">
                    {action ? (
                      <>
                        <span className="run-detail-agent-history-item-icon">
                          {getActionIcon(action.type)}
                        </span>
                        <span className="run-detail-agent-history-item-type">
                          {action.type}
                        </span>
                        <span className="run-detail-agent-history-item-arrow">→</span>
                        <span className="run-detail-agent-history-item-capability">
                          {action.capability_id || action.capabilityId}
                        </span>
                      </>
                    ) : (
                      <span className="run-detail-agent-history-item-no-action">
                        Sin acción registrada
                      </span>
                    )}
                  </div>
                  {confidence !== undefined && (
                    <div className="run-detail-agent-history-item-confidence">
                      <div className="run-detail-agent-history-item-confidence-bar">
                        <div 
                          className="run-detail-agent-history-item-confidence-fill"
                          style={{ 
                            width: `${Math.round(confidence * 100)}%`,
                            backgroundColor: confidence >= 0.8 ? '#10b981' : confidence >= 0.5 ? '#f59e0b' : '#ef4444'
                          }}
                        />
                      </div>
                      <span className="run-detail-agent-history-item-confidence-value">
                        {Math.round(confidence * 100)}%
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/**
 * Componente para mostrar la barra de progreso de iteraciones
 */
const IterationProgress = ({ trace, maxIterations = 50 }) => {
  // Contar iteraciones del AgentCore
  const agentIterations = trace.filter(entry => {
    const nodeId = entry.node_id || entry.nodeId;
    return (
      nodeId?.includes('agent') ||
      nodeId?.includes('core') ||
      entry.output?.iteration !== undefined
    );
  });

  const currentIteration = agentIterations.length;
  const percentage = Math.min((currentIteration / maxIterations) * 100, 100);

  return (
    <div className="run-detail-iteration-progress">
      <div className="run-detail-iteration-progress-header">
        <span className="run-detail-iteration-progress-label">
          Progreso de Iteraciones
        </span>
        <span className="run-detail-iteration-progress-count">
          {currentIteration} / {maxIterations}
        </span>
      </div>
      <div className="run-detail-iteration-progress-bar">
        <div 
          className="run-detail-iteration-progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

const RunDetail = () => {
  const { runId } = useParams();
  const navigate = useNavigate();
  const { selectedRun, trace, loadRun, rerunFlow, cancelRun, startPollingRun, stopPolling } = useEditorStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRerunConfirm, setShowRerunConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', type: 'error' });
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(true);

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
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelado';
      case 'timeout':
        return 'Timeout';
      default:
        return status;
    }
  };

  const isAgentMode = selectedRun?.execution_mode === 'agent';

  if (loading) {
    return (
      <div className="run-detail-container">
        <div className="run-detail-loading">Cargando ejecución...</div>
      </div>
    );
  }

  // Obtener flowId del run para navegar de vuelta
  const flowId = selectedRun?.flow_id || selectedRun?.flowId;
  const handleBackClick = () => {
    if (flowId) {
      navigate(`/runs?flowId=${flowId}`);
    } else {
      navigate('/runs');
    }
  };

  if (error || !selectedRun) {
    return (
      <div className="run-detail-container">
        <div className="run-detail-error">
          <p>Error: {error || 'Ejecución no encontrada'}</p>
          <button onClick={handleBackClick}>Volver</button>
        </div>
      </div>
    );
  }

  return (
    <div className="run-detail-container">
      <div className="run-detail-header">
        <button
          className="run-detail-back-button"
          onClick={handleBackClick}
        >
          <ArrowLeft size={18} />
          Volver
        </button>
        <div className="run-detail-info">
          <div className="run-detail-status-row">
            <div className="run-detail-status">
              <div
                className="run-detail-status-dot"
                style={{ backgroundColor: getStatusColorLocal(selectedRun.status) }}
              />
              <h1 className="run-detail-title">{getStatusLabel(selectedRun.status)}</h1>
            </div>
            
            {/* Badge de modo de ejecución */}
            {selectedRun.execution_mode && (
              <div className={`run-detail-mode-badge ${selectedRun.execution_mode}`}>
                {selectedRun.execution_mode === 'agent' ? (
                  <>
                    <Bot size={14} />
                    <span>Agent Mode</span>
                  </>
                ) : (
                  <>
                    <Layers size={14} />
                    <span>Sequential Mode</span>
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="run-detail-meta">
            <div className="run-detail-date">
              <Calendar size={16} />
              {formatDate(selectedRun.created_at || selectedRun.started_at || selectedRun.createdAt)}
            </div>
            {selectedRun && (selectedRun.status === 'running' || selectedRun.status === 'pending') && (
              <button className="run-detail-cancel-button" onClick={handleCancelClick}>
                <X size={16} />
                Cancelar
              </button>
            )}
            <button className="run-detail-rerun-button" onClick={handleRerunClick}>
              <RefreshCw size={16} />
              Re-ejecutar
            </button>
          </div>
        </div>
      </div>

      {/* Barra de progreso para modo agent */}
      {isAgentMode && (selectedRun.status === 'running' || selectedRun.status === 'pending') && (
        <IterationProgress trace={trace} maxIterations={50} />
      )}

      {selectedRun.error && (
        <div className={`run-detail-error-box ${isRunTimeout() ? 'run-detail-error-box-timeout' : ''}`}>
          {isRunTimeout() ? (
            <Clock size={20} />
          ) : (
            <AlertCircle size={20} />
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
                  Sugerencia: Intenta aumentar el timeout o revisa si el flow tiene loops infinitos.
                </p>
              </div>
            ) : (
              <p>{typeof selectedRun.error === 'string' ? selectedRun.error : selectedRun.error?.message || JSON.stringify(selectedRun.error)}</p>
            )}
          </div>
        </div>
      )}

      {/* Panel de historial de agente (solo en modo agent) */}
      {isAgentMode && trace.length > 0 && (
        <AgentHistoryPanel 
          trace={trace} 
          isExpanded={isHistoryExpanded}
          onToggle={() => setIsHistoryExpanded(!isHistoryExpanded)}
        />
      )}

      <div className="run-detail-content">
        <h2 className="run-detail-section-title">Trace de Ejecución</h2>
        <TraceView trace={trace} executionMode={selectedRun.execution_mode} />
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
