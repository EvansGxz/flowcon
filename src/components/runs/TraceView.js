import { useEditorStore } from '../../store/editorStore';
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

  const getStatusColor = (status, errorCode) => {
    // Si es un error de timeout, usar color naranja/amarillo
    if (errorCode === 'NODE_TIMEOUT') {
      return '#f59e0b'; // Naranja para timeout
    }
    
    switch (status) {
      case 'success':
      case 'completed':
        return '#10b981';
      case 'error':
        return '#ef4444';
      case 'running':
        return '#f59e0b';
      default:
        return '#6b7280';
    }
  };

  const isTimeoutError = (entry) => {
    return entry.status === 'error' && entry.error?.code === 'NODE_TIMEOUT';
  };

  const getStatusIcon = (status, errorCode) => {
    // Icono especial para timeout
    if (errorCode === 'NODE_TIMEOUT') {
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path
            d="M12 6V12L16 14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    }
    
    switch (status) {
      case 'success':
      case 'completed':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M20 6L9 17L4 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case 'error':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M18 6L6 18M6 6L18 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        );
      case 'running':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="32"
              strokeDashoffset="16"
            />
          </svg>
        );
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
                style={{ color: getStatusColor(entry.status, errorCode) }}
              >
                {getStatusIcon(entry.status, errorCode)}
                <span className="trace-view-entry-status-label">
                  {isTimeout ? 'timeout' : (entry.status || 'unknown')}
                </span>
                {isTimeout && (
                  <span className="trace-view-entry-timeout-badge" title={`Timeout después de ${entry.error?.timeout_seconds || 'N/A'}s`}>
                    ⏱️
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
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                        <path
                          d="M12 6V12L16 14"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <strong>⏱️ Timeout en este nodo:</strong>
                    </>
                  ) : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
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

