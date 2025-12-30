import { Handle, Position } from '@xyflow/react';
import { getNodeDefinition } from '../utils/nodeInstance';
import { NodeStatus } from './definitions/types';
import { useEditorStore } from '../store/editorStore';
import './NodeStyles.css';

const ActionNode = ({ data, selected, id }) => {
  // Obtener definición del nodo
  const definition = getNodeDefinition({ data, id });
  const displayName = data.displayName || definition?.displayName || data.label || 'Action';
  const config = data.config || {};
  const status = data.status || NodeStatus.IDLE;
  const nodeViewMode = useEditorStore((state) => state.nodeViewMode);

  // Obtener valores de configuración
  const actionType = config.method || data.actionType || 'HTTP Request';
  const version = data.version || definition?.version || 1;

  // Clase de estado para el indicador
  const statusClass = `node-status-${status}`;

  // Vista icon: solo icono
  if (nodeViewMode === 'icon') {
    return (
      <div
        className={`node-container action-node icon-view ${selected ? 'node-selected' : ''} ${statusClass}`}
        style={{ width: '48px', height: '48px', minWidth: '48px' }}
      >
        <div className={`node-indicator node-indicator-blue ${statusClass}`} style={{ width: '100%', height: '100%', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M22.7 19L13.6 9.9C14.5 7.6 14 4.9 12.1 3C10.1 1 7.1 0.6 4.7 1.7L9 6L6 9L1.6 4.7C0.4 7.1 0.9 10.1 2.9 12.1C4.8 14 7.5 14.5 9.8 13.6L18.9 22.7C19.3 23.1 19.9 23.1 20.3 22.7L22.6 20.4C23.1 20 23.1 19.3 22.7 19Z"
              fill="currentColor"
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
          className="node-handle node-handle-blue"
        />
        <Handle
          id="out"
          type="source"
          position={Position.Right}
          className="node-handle node-handle-blue"
        />
        {definition?.outputs.some((p) => p.type === 'error') && (
          <Handle
            id="error"
            type="source"
            position={Position.Bottom}
            className="node-handle node-handle-error"
          />
        )}
      </div>
    );
  }

  // Vista compact: solo header
  if (nodeViewMode === 'compact') {
    return (
      <div
        className={`node-container action-node compact-view ${selected ? 'node-selected' : ''} ${statusClass}`}
        style={{ minWidth: '200px' }}
      >
        <div className="node-header">
          <div className={`node-indicator node-indicator-blue ${statusClass}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M22.7 19L13.6 9.9C14.5 7.6 14 4.9 12.1 3C10.1 1 7.1 0.6 4.7 1.7L9 6L6 9L1.6 4.7C0.4 7.1 0.9 10.1 2.9 12.1C4.8 14 7.5 14.5 9.8 13.6L18.9 22.7C19.3 23.1 19.9 23.1 20.3 22.7L22.6 20.4C23.1 20 23.1 19.3 22.7 19Z"
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
          id="in"
          type="target"
          position={Position.Left}
          className="node-handle node-handle-blue"
        />
        <Handle
          id="out"
          type="source"
          position={Position.Right}
          className="node-handle node-handle-blue"
        />
        {definition?.outputs.some((p) => p.type === 'error') && (
          <Handle
            id="error"
            type="source"
            position={Position.Bottom}
            className="node-handle node-handle-error"
          />
        )}
      </div>
    );
  }

  // Vista informative: header + badges + descripción
  return (
    <div
      className={`node-container action-node informative-view ${selected ? 'node-selected' : ''} ${statusClass}`}
      style={{ minWidth: '200px' }}
    >
      <div className="node-header">
        <div className={`node-indicator node-indicator-blue ${statusClass}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M22.7 19L13.6 9.9C14.5 7.6 14 4.9 12.1 3C10.1 1 7.1 0.6 4.7 1.7L9 6L6 9L1.6 4.7C0.4 7.1 0.9 10.1 2.9 12.1C4.8 14 7.5 14.5 9.8 13.6L18.9 22.7C19.3 23.1 19.9 23.1 20.3 22.7L22.6 20.4C23.1 20 23.1 19.3 22.7 19Z"
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
      {actionType && (
        <div className="node-badge node-badge-blue">
          {actionType}
        </div>
      )}
      {config.url && (
        <div className="node-badge node-badge-info">
          {config.url.length > 30 ? `${config.url.substring(0, 30)}...` : config.url}
        </div>
      )}
      <Handle
        id="in"
        type="target"
        position={Position.Left}
        className="node-handle node-handle-blue"
      />
      <Handle
        id="out"
        type="source"
        position={Position.Right}
        className="node-handle node-handle-blue"
      />
      {definition?.outputs.some((p) => p.type === 'error') && (
        <Handle
          id="error"
          type="source"
          position={Position.Bottom}
          className="node-handle node-handle-error"
        />
      )}
    </div>
  );
};

export default ActionNode;
