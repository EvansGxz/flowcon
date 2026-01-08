import { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useNavigate } from 'react-router-dom';
import { getStatusColor } from '../../utils/colorHelpers';
import ConfirmModal from '../modals/ConfirmModal';
import { Bot, Layers, Eye, RefreshCw, AlertCircle } from 'lucide-react';
import type { Run } from '../../types/api';
import './RunCard.css';

interface RunCardProps {
  run: Run;
}

const RunCard = ({ run }: RunCardProps) => {
  const navigate = useNavigate();
  const { loadRun, rerunFlow } = useEditorStore();
  const [showRerunConfirm, setShowRerunConfirm] = useState(false);

  const handleView = async () => {
    const runId = run.id || (run as unknown as { run_id?: string }).run_id;
    if (!runId) {
      console.error('[RunCard] No se puede ver el run: falta id o run_id');
      return;
    }
    const result = await loadRun(runId);
    if (result.success) {
      navigate(`/runs/${runId}`);
    }
  };

  const handleRerunClick = () => {
    setShowRerunConfirm(true);
  };

  const handleRerunConfirm = async () => {
    setShowRerunConfirm(false);
    const runId = run.id || (run as unknown as { run_id?: string }).run_id;
    if (!runId) {
      console.error('[RunCard] No se puede re-ejecutar el run: falta id o run_id');
      return;
    }
    const result = await rerunFlow(runId);
    if (result.success) {
      const newRunId = result.run?.id || (result.run as unknown as { runId?: string }).runId || (result as unknown as { runId?: string }).runId;
      if (newRunId) {
        navigate(`/runs/${newRunId}`);
      }
    }
  };

  const formatDate = (dateString: string | undefined | null): string => {
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

  const getStatusColorLocal = (status: string) => {
    return getStatusColor(status);
  };

  const getStatusLabel = (status: string): string => {
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

  const isActive = run.status === 'running' || run.status === 'pending';
  const executionMode = (run as unknown as { execution_mode?: string }).execution_mode;

  const runDate = (run as unknown as { started_at?: string; created_at?: string; createdAt?: string }).started_at 
    || (run as unknown as { created_at?: string }).created_at 
    || (run as unknown as { createdAt?: string }).createdAt;

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
          <div className="run-card-date">{formatDate(runDate)}</div>
        </div>
        
        {/* Badge de modo de ejecución */}
        {executionMode && (
          <div className={`run-card-mode-badge ${executionMode}`}>
            {executionMode === 'agent' ? (
              <>
                <Bot size={12} />
                <span>Agent</span>
              </>
            ) : (
              <>
                <Layers size={12} />
                <span>Sequential</span>
              </>
            )}
          </div>
        )}
        
      {run.error && (
        <div className="run-card-error">
          <AlertCircle size={16} />
          <span>{typeof run.error === 'string' ? run.error : (run.error as { message?: string })?.message || 'Error en la ejecución'}</span>
        </div>
      )}
      <div className="run-card-actions">
        <button className="run-card-button run-card-button-primary" onClick={handleView}>
          <Eye size={16} />
          Ver Detalle
        </button>
        <button 
          className="run-card-button run-card-button-secondary" 
          onClick={handleRerunClick}
          disabled={isActive}
        >
          <RefreshCw size={16} />
          Re-ejecutar
        </button>
      </div>
    </div>
    </>
  );
};

export default RunCard;
