import { Handle, Position } from '@xyflow/react';
import { Zap, Loader2, CheckCircle2, XCircle } from 'lucide-react';
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

  // Vista icon: solo icono - Más grande
  if (nodeViewMode === 'icon') {
    return (
      <div
        className={`node-container action-node icon-view ${selected ? 'node-selected' : ''} ${statusClass}`}
        style={{ width: '64px', height: '64px', minWidth: '64px' }}
      >
        <div className={`node-indicator node-indicator-blue ${statusClass}`} style={{ width: '100%', height: '100%', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' }}>
          {status === NodeStatus.RUNNING ? (
            <Loader2 size={32} className="animate-spin" />
          ) : status === NodeStatus.SUCCESS ? (
            <CheckCircle2 size={32} />
          ) : status === NodeStatus.ERROR ? (
            <XCircle size={32} />
          ) : (
            <Zap size={32} />
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

  // Vista compact: solo header
  if (nodeViewMode === 'compact') {
    return (
      <div
        className={`node-container action-node compact-view ${selected ? 'node-selected' : ''} ${statusClass}`}
        style={{ minWidth: '200px' }}
      >
        <div className="node-header">
          <div className={`node-indicator node-indicator-blue ${statusClass}`}>
            {status === NodeStatus.RUNNING ? (
              <Loader2 size={22} className="animate-spin" />
            ) : status === NodeStatus.SUCCESS ? (
              <CheckCircle2 size={22} />
            ) : status === NodeStatus.ERROR ? (
              <XCircle size={22} />
            ) : (
              <Zap size={22} />
            )}
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
          {status === NodeStatus.RUNNING ? (
            <Loader2 size={16} className="animate-spin" />
          ) : status === NodeStatus.SUCCESS ? (
            <CheckCircle2 size={16} />
          ) : status === NodeStatus.ERROR ? (
            <XCircle size={16} />
          ) : (
            <Zap size={16} />
          )}
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
