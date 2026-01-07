import { useEditorStore } from '../../store/editorStore';
import { Clock, CheckCircle2, XCircle, Loader2, Bot, Zap, Brain, ChevronDown, ChevronRight } from 'lucide-react';
import { getStatusColor } from '../../utils/colorHelpers';
import { useState } from 'react';
import './TraceView.css';

/**
 * Componente para mostrar el confidence como barra visual
 */
const ConfidenceBadge = ({ confidence }) => {
  if (confidence === undefined || confidence === null) return null;
  
  const percentage = Math.round(confidence * 100);
  const getConfidenceColor = () => {
    if (confidence >= 0.8) return 'var(--success-color, #10b981)';
    if (confidence >= 0.5) return 'var(--warning-color, #f59e0b)';
    return 'var(--error-color, #ef4444)';
  };
  
  return (
    <div className="trace-confidence-badge" title={`Confidence: ${percentage}%`}>
      <div className="trace-confidence-bar">
        <div 
          className="trace-confidence-fill" 
          style={{ 
            width: `${percentage}%`,
            backgroundColor: getConfidenceColor()
          }} 
        />
      </div>
      <span className="trace-confidence-value">{percentage}%</span>
    </div>
  );
};

/**
 * Componente para mostrar la acción del AgentCore
 */
const AgentAction = ({ action }) => {
  if (!action) return null;
  
  const getActionIcon = (type) => {
    switch (type) {
      case 'llm': return <Brain size={14} />;
      case 'tool': return <Zap size={14} />;
      case 'memory': return <Bot size={14} />;
      case 'response': return <CheckCircle2 size={14} />;
      case 'end': return <CheckCircle2 size={14} />;
      default: return <Zap size={14} />;
    }
  };
  
  return (
    <div className="trace-agent-action">
      <div className="trace-agent-action-header">
        <span className="trace-agent-action-icon">
          {getActionIcon(action.type)}
        </span>
        <span className="trace-agent-action-type">{action.type}</span>
        <span className="trace-agent-action-arrow">→</span>
        <span className="trace-agent-action-capability">{action.capability_id || action.capabilityId}</span>
        <ConfidenceBadge confidence={action.confidence} />
      </div>
      {action.reasoning && (
        <div className="trace-agent-action-reasoning">
          <span className="trace-agent-action-reasoning-label">Razonamiento:</span>
          <span className="trace-agent-action-reasoning-text">{action.reasoning}</span>
        </div>
      )}
    </div>
  );
};

/**
 * Componente para un grupo de iteraciones del AgentCore
 */
const AgentCoreIterationGroup = ({ iterations, getNodeName }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  if (!iterations || iterations.length === 0) return null;
  
  return (
    <div className="trace-agent-group">
      <div 
        className="trace-agent-group-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="trace-agent-group-toggle">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
        <Bot size={18} className="trace-agent-group-icon" />
        <span className="trace-agent-group-title">
          Agent Core - {iterations.length} iteracion{iterations.length !== 1 ? 'es' : ''}
        </span>
      </div>
      
      {isExpanded && (
        <div className="trace-agent-iterations">
          {iterations.map((entry, idx) => {
            const nodeId = entry.node_id || entry.nodeId;
            const iteration = entry.output?.iteration ?? idx + 1;
            const action = entry.output?.action;
            const shouldContinue = entry.output?.should_continue;
            
            return (
              <div key={`${nodeId}-${iteration}`} className="trace-agent-iteration">
                <div className="trace-agent-iteration-header">
                  <span className="trace-agent-iteration-number">
                    Iteración {iteration}
                  </span>
                  <span 
                    className={`trace-agent-iteration-status ${entry.status}`}
                    style={{ color: getStatusColor(entry.status) }}
                  >
                    {entry.status}
                  </span>
                  {shouldContinue === false && (
                    <span className="trace-agent-iteration-final">Final</span>
                  )}
                </div>
                
                {action && <AgentAction action={action} />}
                
                {entry.error && (
                  <div className="trace-agent-iteration-error">
                    <XCircle size={14} />
                    <span>{entry.error?.message || JSON.stringify(entry.error)}</span>
                  </div>
                )}
                
                {(entry.duration_ms || entry.durationMs) && (
                  <div className="trace-agent-iteration-duration">
                    {entry.duration_ms || entry.durationMs}ms
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const TraceView = ({ trace, executionMode }) => {
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

  // Detectar si un entry es de agent.core
  const isAgentCoreEntry = (entry) => {
    const nodeId = entry.node_id || entry.nodeId;
    // Verificar por tipo de nodo o por presencia de output.iteration/action
    return (
      nodeId?.includes('agent') || 
      nodeId?.includes('core') ||
      entry.output?.iteration !== undefined ||
      entry.output?.action !== undefined
    );
  };

  // Si es modo agent, agrupar las iteraciones del AgentCore
  const processedTrace = (() => {
    if (executionMode !== 'agent') {
      // Modo secuencial: mostrar trace normal
      return { type: 'sequential', entries: trace };
    }
    
    // Modo agent: separar iteraciones del AgentCore de otros nodos
    const agentCoreIterations = [];
    const otherEntries = [];
    let agentCoreId = null;
    
    trace.forEach((entry) => {
      const nodeId = entry.node_id || entry.nodeId;
      
      if (isAgentCoreEntry(entry)) {
        agentCoreIterations.push(entry);
        if (!agentCoreId) agentCoreId = nodeId;
      } else {
        // Marcar si fue invocado por el AgentCore
        otherEntries.push({
          ...entry,
          invokedByAgent: agentCoreIterations.length > 0
        });
      }
    });
    
    return {
      type: 'agent',
      agentCoreIterations,
      otherEntries,
      agentCoreId
    };
  })();

  // Renderizar en modo agent
  if (processedTrace.type === 'agent') {
    return (
      <div className="trace-view trace-view-agent-mode">
        {/* Badge de modo de ejecución */}
        <div className="trace-view-mode-badge">
          <Bot size={16} />
          <span>Modo Agent</span>
        </div>
        
        {/* Grupo de iteraciones del AgentCore */}
        {processedTrace.agentCoreIterations.length > 0 && (
          <AgentCoreIterationGroup 
            iterations={processedTrace.agentCoreIterations}
            getNodeName={getNodeName}
          />
        )}
        
        {/* Otros nodos ejecutados */}
        {processedTrace.otherEntries.length > 0 && (
          <div className="trace-view-capabilities">
            <h4 className="trace-view-capabilities-title">Capabilities Ejecutadas</h4>
            {processedTrace.otherEntries.map((entry, index) => {
              const nodeId = entry.node_id || entry.nodeId;
              const errorCode = entry.error?.code;
              const isTimeout = isTimeoutError(entry);
              
              return (
                <div 
                  key={nodeId || index} 
                  className={`trace-view-entry ${isTimeout ? 'trace-view-entry-timeout' : ''} ${entry.invokedByAgent ? 'trace-view-entry-invoked' : ''}`}
                >
                  {entry.invokedByAgent && (
                    <div className="trace-view-entry-invoked-badge">
                      Invocado por Agent
                    </div>
                  )}
                  <div className="trace-view-entry-header">
                    <div
                      className="trace-view-entry-status"
                      style={{ color: getStatusColorLocal(entry.status, errorCode) }}
                    >
                      {getStatusIcon(entry.status, errorCode)}
                      <span className="trace-view-entry-status-label">
                        {isTimeout ? 'timeout' : (entry.status || 'unknown')}
                      </span>
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
                        <XCircle size={18} />
                        <strong>Error:</strong>
                      </div>
                      <pre className="trace-view-entry-data">{typeof entry.error === 'string' ? entry.error : JSON.stringify(entry.error, null, 2)}</pre>
                    </div>
                  )}
                  {(entry.duration_ms || entry.durationMs) && (
                    <div className="trace-view-entry-duration">
                      Duración: {entry.duration_ms || entry.durationMs}ms
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Renderizar en modo secuencial (comportamiento original)
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
