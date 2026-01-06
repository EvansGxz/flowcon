import { useEditorStore } from '../../store/editorStore';
import { Clock, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { getStatusColor } from '../../utils/colorHelpers';
import './TraceView.css';

const TraceView = ({ trace }) => {
  const { nodes } = useEditorStore();

  if (!trace || trace.length === 0) {
    return (
      <div className="trace-view-empty">
        <p>No hay trace disponible</p>
      </div>
    );
  }

  const getNodeName = (nodeId) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (node) {
      return node.data?.label || node.data?.typeId || nodeId;
    }
    // Si no hay nodo en el canvas, usar el nodeId directamente
    return nodeId;
  };

  // Usar helper de colores que usa variables CSS
  const getStatusColorLocal = (status, errorCode) => {
    return getStatusColor(status, errorCode);
  };

  const isTimeoutError = (entry) => {
    return entry.status === 'error' && entry.error?.code === 'NODE_TIMEOUT';
  };

  const getStatusIcon = (status, errorCode) => {
    // Icono especial para timeout
    if (errorCode === 'NODE_TIMEOUT') {
      return <Clock size={16} />;
    }
    
    switch (status) {
      case 'success':
      case 'completed':
        return <CheckCircle2 size={16} />;
      case 'error':
        return <XCircle size={16} />;
      case 'running':
        return <Loader2 size={16} className="animate-spin" />;
      default:
        return null;
    }
  };

  return (
    <div className="trace-view">
      {trace.map((entry, index) => {
        // El backend puede retornar node_id o nodeId
        const nodeId = entry.node_id || entry.nodeId;
        const errorCode = entry.error?.code;
        const isTimeout = isTimeoutError(entry);
        
        return (
          <div 
            key={nodeId || index} 
            className={`trace-view-entry ${isTimeout ? 'trace-view-entry-timeout' : ''}`}
          >
            <div className="trace-view-entry-header">
              <div
                className="trace-view-entry-status"
                style={{ color: getStatusColorLocal(entry.status, errorCode) }}
              >
                {getStatusIcon(entry.status, errorCode)}
                <span className="trace-view-entry-status-label">
                  {isTimeout ? 'timeout' : (entry.status || 'unknown')}
                </span>
                {isTimeout && (
                  <span className="trace-view-entry-timeout-badge" title={`Timeout después de ${entry.error?.timeout_seconds || 'N/A'}s`}>
                    <Clock size={14} />
                  </span>
                )}
              </div>
              <div className="trace-view-entry-node">
                {getNodeName(nodeId)}
              </div>
            </div>
            {entry.input && (
              <div className="trace-view-entry-section">
                <strong>Input:</strong>
                <pre className="trace-view-entry-data">{JSON.stringify(entry.input, null, 2)}</pre>
              </div>
            )}
            {entry.output && (
              <div className="trace-view-entry-section">
                <strong>Output:</strong>
                <pre className="trace-view-entry-data">{JSON.stringify(entry.output, null, 2)}</pre>
              </div>
            )}
            {entry.error && (
              <div className={`trace-view-entry-section trace-view-entry-error ${isTimeout ? 'trace-view-entry-error-timeout' : ''}`}>
                <div className="trace-view-entry-error-header">
                  {isTimeout ? (
                    <>
                      <Clock size={18} />
                      <strong>Timeout en este nodo:</strong>
                    </>
                  ) : (
                    <>
                      <XCircle size={18} />
                      <strong>Error en este nodo:</strong>
                    </>
                  )}
                </div>
                {isTimeout ? (
                  <div className="trace-view-entry-timeout-message">
                    <p>
                      El nodo <strong>{getNodeName(nodeId)}</strong> excedió el tiempo límite de{' '}
                      <strong>{entry.error?.timeout_seconds || 'N/A'} segundos</strong>.
                    </p>
                    {entry.error?.message && (
                      <p className="trace-view-entry-timeout-detail">{entry.error.message}</p>
                    )}
                  </div>
                ) : (
                  <pre className="trace-view-entry-data">{typeof entry.error === 'string' ? entry.error : JSON.stringify(entry.error, null, 2)}</pre>
                )}
              </div>
            )}
            {(entry.duration_ms || entry.duration) && (
              <div className="trace-view-entry-duration">
                Duración: {entry.duration_ms || entry.duration}ms
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default TraceView;

