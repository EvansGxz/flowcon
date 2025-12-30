import { Handle, Position } from '@xyflow/react';
import { getNodeDefinition } from '../utils/nodeInstance';
import { NodeStatus } from './definitions/types';
import { useEditorStore } from '../store/editorStore';
import './NodeStyles.css';

const AgentNode = ({ data, selected, id }) => {
  // Obtener definición del nodo
  const definition = getNodeDefinition({ data, id });
  const displayName = data.displayName || definition?.displayName || data.label || 'AI Agent';
  const config = data.config || {};
  const status = data.status || NodeStatus.IDLE;
  const nodeViewMode = useEditorStore((state) => state.nodeViewMode);

  // Obtener valores de configuración
  const model = config.model || definition?.getDefaultValue('model') || 'gpt-4';
  const version = data.version || definition?.version || 1;

  // Clase de estado para el indicador
  const statusClass = `node-status-${status}`;

  // Vista icon: solo icono
  if (nodeViewMode === 'icon') {
    return (
      <div
        className={`node-container agent-node icon-view ${selected ? 'node-selected' : ''} ${statusClass}`}
        style={{ width: '48px', height: '48px', minWidth: '48px' }}
      >
        <div className={`node-indicator node-indicator-purple ${statusClass}`} style={{ width: '100%', height: '100%', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="8" width="12" height="10" rx="2" fill="currentColor" />
            <circle cx="9" cy="12" r="1.5" fill="white" />
            <circle cx="15" cy="12" r="1.5" fill="white" />
            <rect x="9" y="15" width="6" height="2" rx="1" fill="white" />
            <path
              d="M8 6V8M16 6V8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M10 20V22M14 20V22"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          {status === NodeStatus.RUNNING && <span className="node-status-spinner">⟳</span>}
          {status === NodeStatus.SUCCESS && <span className="node-status-check">✓</span>}
          {status === NodeStatus.ERROR && <span className="node-status-error">✕</span>}
        </div>
        <Handle
          id="in"
          type="target"
          position={Position.Left}
          className="node-handle node-handle-purple"
        />
        <Handle
          id="out"
          type="source"
          position={Position.Right}
          className="node-handle node-handle-purple"
        />
      </div>
    );
  }

  // Vista compact: solo header
  if (nodeViewMode === 'compact') {
    return (
      <div
        className={`node-container agent-node compact-view ${selected ? 'node-selected' : ''} ${statusClass}`}
        style={{ minWidth: '200px' }}
      >
        <div className="node-header">
          <div className={`node-indicator node-indicator-purple ${statusClass}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="6" y="8" width="12" height="10" rx="2" fill="currentColor" />
              <circle cx="9" cy="12" r="1.5" fill="white" />
              <circle cx="15" cy="12" r="1.5" fill="white" />
              <rect x="9" y="15" width="6" height="2" rx="1" fill="white" />
              <path
                d="M8 6V8M16 6V8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M10 20V22M14 20V22"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            {status === NodeStatus.RUNNING && <span className="node-status-spinner">⟳</span>}
            {status === NodeStatus.SUCCESS && <span className="node-status-check">✓</span>}
            {status === NodeStatus.ERROR && <span className="node-status-error">✕</span>}
          </div>
          <div className="node-title">{displayName}</div>
          {version > 1 && (
            <div className="node-version">v{version}</div>
          )}
        </div>
        <Handle
          id="in"
          type="target"
          position={Position.Left}
          className="node-handle node-handle-purple"
        />
        <Handle
          id="out"
          type="source"
          position={Position.Right}
          className="node-handle node-handle-purple"
        />
      </div>
    );
  }

  // Vista informative: header + badges + descripción
  return (
    <div
      className={`node-container agent-node informative-view ${selected ? 'node-selected' : ''} ${statusClass}`}
      style={{ minWidth: '200px' }}
    >
      <div className="node-header">
        <div className={`node-indicator node-indicator-purple ${statusClass}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="8" width="12" height="10" rx="2" fill="currentColor" />
            <circle cx="9" cy="12" r="1.5" fill="white" />
            <circle cx="15" cy="12" r="1.5" fill="white" />
            <rect x="9" y="15" width="6" height="2" rx="1" fill="white" />
            <path
              d="M8 6V8M16 6V8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M10 20V22M14 20V22"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          {status === NodeStatus.RUNNING && <span className="node-status-spinner">⟳</span>}
          {status === NodeStatus.SUCCESS && <span className="node-status-check">✓</span>}
          {status === NodeStatus.ERROR && <span className="node-status-error">✕</span>}
        </div>
        <div className="node-title">{displayName}</div>
        {version > 1 && (
          <div className="node-version">v{version}</div>
        )}
      </div>
      {data.description && (
        <div className="node-description">{data.description}</div>
      )}
      {model && (
        <div className="node-badge node-badge-purple">
          Model: {model}
        </div>
      )}
      {config.temperature !== undefined && (
        <div className="node-badge node-badge-info">
          Temp: {config.temperature}
        </div>
      )}
      <Handle
        id="in"
        type="target"
        position={Position.Left}
        className="node-handle node-handle-purple"
      />
      <Handle
        id="out"
        type="source"
        position={Position.Right}
        className="node-handle node-handle-purple"
      />
    </div>
  );
};

export default AgentNode;
