import { Handle, Position } from '@xyflow/react';
import { getNodeDefinition } from '../utils/nodeInstance';
import { NodeStatus } from './definitions/types';
import { useEditorStore } from '../store/editorStore';
import './NodeStyles.css';

const TriggerNode = ({ data, selected, id }) => {
  // Obtener definición del nodo
  const definition = getNodeDefinition({ data, id });
  const displayName = data.displayName || definition?.displayName || data.label || 'Trigger';
  const config = data.config || {};
  const status = data.status || NodeStatus.IDLE;
  const nodeViewMode = useEditorStore((state) => state.nodeViewMode);

  // Obtener valores de configuración
  const method = config.method || 'POST';
  const path = config.path || '/webhook';
  const version = data.version || definition?.version || 1;

  // Clase de estado para el indicador
  const statusClass = `node-status-${status}`;

  // Vista icon: solo icono
  if (nodeViewMode === 'icon') {
    return (
      <div
        className={`node-container trigger-node icon-view ${selected ? 'node-selected' : ''} ${statusClass}`}
        style={{ width: '48px', height: '48px', minWidth: '48px' }}
      >
        <div className={`node-indicator node-indicator-green ${statusClass}`} style={{ width: '100%', height: '100%', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M8 5.14V19.14L19 12.14L8 5.14Z"
              fill="currentColor"
            />
          </svg>
          {status === NodeStatus.RUNNING && <span className="node-status-spinner">⟳</span>}
          {status === NodeStatus.SUCCESS && <span className="node-status-check">✓</span>}
          {status === NodeStatus.ERROR && <span className="node-status-error">✕</span>}
        </div>
        <Handle
          id="out"
          type="source"
          position={Position.Right}
          className="node-handle node-handle-green"
        />
      </div>
    );
  }

  // Vista compact: solo header
  if (nodeViewMode === 'compact') {
    return (
      <div
        className={`node-container trigger-node compact-view ${selected ? 'node-selected' : ''} ${statusClass}`}
        style={{ minWidth: '200px' }}
      >
        <div className="node-header">
          <div className={`node-indicator node-indicator-green ${statusClass}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M8 5.14V19.14L19 12.14L8 5.14Z"
                fill="currentColor"
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
          id="out"
          type="source"
          position={Position.Right}
          className="node-handle node-handle-green"
        />
      </div>
    );
  }

  // Vista informative: header + badges + descripción
  return (
    <div
      className={`node-container trigger-node informative-view ${selected ? 'node-selected' : ''} ${statusClass}`}
      style={{ minWidth: '200px' }}
    >
      <div className="node-header">
        <div className={`node-indicator node-indicator-green ${statusClass}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M8 5.14V19.14L19 12.14L8 5.14Z"
              fill="currentColor"
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
      <div className="node-badge node-badge-green">
        {method} {path}
      </div>
      <Handle
        id="out"
        type="source"
        position={Position.Right}
        className="node-handle node-handle-green"
      />
    </div>
  );
};

export default TriggerNode;
