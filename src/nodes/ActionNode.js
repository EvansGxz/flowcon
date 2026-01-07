import { Handle, Position } from '@xyflow/react';
import { useEffect, useRef } from 'react';
import { Zap, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { getNodeDefinition } from '../utils/nodeInstance';
import { NodeStatus } from './definitions/types';
import { useEditorStore } from '../store/editorStore';
import './NodeStyles.css';

// Helper para crear un handle (según documentación React Flow)
// React Flow posiciona los handles automáticamente en el centro del lado especificado
const HandleWithClick = ({ id, type, position, className, nodeId }) => {
  return (
    <Handle
      id={id}
      type={type}
      position={position}
      className={className}
      data-handle-wrapper="true"
      data-node-id={nodeId}
      data-handle-id={id}
    />
  );
};

const ActionNode = ({ data, selected, id }) => {
  // Obtener definición del nodo
  const definition = getNodeDefinition({ data, id });
  const displayName = data.displayName || definition?.displayName || data.label || 'Action';
  const config = data.config || {};
  const status = data.status || NodeStatus.IDLE;
  const nodeViewMode = useEditorStore((state) => state.nodeViewMode);
  const nodeRef = useRef(null);

  // Event listener para detectar doble clic en handles dentro de este nodo
  useEffect(() => {
    const handleDoubleClick = (e) => {
      const target = e.target;
      // Verificar si el clic fue en un handle de este nodo
      if (target.hasAttribute('data-handleid') && target.getAttribute('data-nodeid') === id) {
        e.stopPropagation();
        e.stopImmediatePropagation();
        const handleId = target.getAttribute('data-handleid');
        const handleType = target.classList.contains('source') ? 'source' : 'target';
        
        // Emitir evento personalizado para abrir paleta
        const event = new CustomEvent('handleDoubleClick', {
          detail: {
            nodeId: id,
            handleId: handleId,
            handleType: handleType,
            position: { x: e.clientX, y: e.clientY },
          },
        });
        window.dispatchEvent(event);
      }
    };

    // Usar el ref del nodo o buscar en el DOM
    const nodeElement = nodeRef.current || document.querySelector(`[data-id="${id}"]`);
    if (nodeElement) {
      nodeElement.addEventListener('dblclick', handleDoubleClick, true);
      return () => {
        nodeElement.removeEventListener('dblclick', handleDoubleClick, true);
      };
    }
  }, [id]);

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
        <HandleWithClick
          id="in"
          type="target"
          position={Position.Left}
          className="node-handle node-handle-blue"
          nodeId={id}
        />
        <HandleWithClick
          id="out"
          type="source"
          position={Position.Right}
          className="node-handle node-handle-blue"
          nodeId={id}
        />
        {definition?.outputs.some((p) => p.type === 'error') && (
          <HandleWithClick
            id="error"
            type="source"
            position={Position.Bottom}
            className="node-handle node-handle-error"
            nodeId={id}
          />
        )}
      </div>
    );
  }

  // Vista compact: solo header
  if (nodeViewMode === 'compact') {
    return (
      <div
        ref={nodeRef}
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
        <HandleWithClick
          id="in"
          type="target"
          position={Position.Left}
          className="node-handle node-handle-blue"
          nodeId={id}
        />
        <HandleWithClick
          id="out"
          type="source"
          position={Position.Right}
          className="node-handle node-handle-blue"
          nodeId={id}
        />
        {definition?.outputs.some((p) => p.type === 'error') && (
          <HandleWithClick
            id="error"
            type="source"
            position={Position.Bottom}
            className="node-handle node-handle-error"
            nodeId={id}
          />
        )}
      </div>
    );
  }

  // Vista informative: header + badges + descripción
  return (
    <div
      ref={nodeRef}
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
      <HandleWithClick
        id="in"
        type="target"
        position={Position.Left}
        className="node-handle node-handle-blue"
        nodeId={id}
      />
      <HandleWithClick
        id="out"
        type="source"
        position={Position.Right}
        className="node-handle node-handle-blue"
        nodeId={id}
      />
      {definition?.outputs.some((p) => p.type === 'error') && (
        <HandleWithClick
          id="error"
          type="source"
          position={Position.Bottom}
          className="node-handle node-handle-error"
          nodeId={id}
        />
      )}
    </div>
  );
};

export default ActionNode;
