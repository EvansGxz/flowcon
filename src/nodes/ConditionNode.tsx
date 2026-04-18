import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useEffect, useRef } from 'react';
import { GitBranch, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { NodeStatus, type NodeStatusValue } from './definitions/types';
import { nodeRegistry } from './definitions/registry';
import { useEditorStore } from '../store/editorStore';
import type { ReactFlowNodeData } from '../types/reactflow';
import './NodeStyles.css';

interface HandleWithClickProps {
  id: string;
  type: 'source' | 'target';
  position: Position;
  className: string;
  nodeId: string;
}

// Helper para crear un handle (según documentación React Flow)
// React Flow posiciona los handles automáticamente en el centro del lado especificado
const HandleWithClick = ({ id, type, position, className, nodeId }: HandleWithClickProps) => {
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

interface ConditionNodeProps extends NodeProps {
  data: ReactFlowNodeData;
}

const ConditionNode = ({ data, selected, id }: ConditionNodeProps) => {
  // Obtener definición del nodo
  const definition = data.typeId ? nodeRegistry.get(data.typeId) : null;
  const displayName = data.displayName || definition?.displayName || (data.label as string) || 'Condition';
  const config = data.config || {};
  const status = (data.status as NodeStatusValue) || NodeStatus.IDLE;
  const nodeViewMode = useEditorStore((state) => state.nodeViewMode);
  const nodeRef = useRef<HTMLDivElement>(null);

  // Event listener para detectar doble clic en handles dentro de este nodo
  useEffect(() => {
    const handleDoubleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
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
  const rules = Array.isArray(config.rules) ? config.rules : [];
  const rulesCount = rules.length;
  const defaultTarget = typeof config.defaultTarget === 'string' ? config.defaultTarget : null;
  const version = data.version || definition?.version || 1;

  // Clase de estado para el indicador
  const statusClass = `node-status-${status}`;

  // Vista icon: solo icono - Más grande
  if (nodeViewMode === 'icon') {
    return (
      <div
        ref={nodeRef}
        className={`node-container condition-node icon-view ${selected ? 'node-selected' : ''} ${statusClass}`}
        style={{ width: '64px', height: '64px', minWidth: '64px' }}
      >
        <div className={`node-indicator node-indicator-amber ${statusClass}`} style={{ width: '100%', height: '100%', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' }}>
          {status === NodeStatus.RUNNING ? (
            <Loader2 size={32} className="animate-spin" />
          ) : status === NodeStatus.SUCCESS ? (
            <CheckCircle2 size={32} />
          ) : status === NodeStatus.ERROR ? (
            <XCircle size={32} />
          ) : (
            <GitBranch size={32} />
          )}
        </div>
        <HandleWithClick
          id="in"
          type="target"
          position={Position.Left}
          className="node-handle node-handle-amber"
          nodeId={id}
        />
        <HandleWithClick
          id="out"
          type="source"
          position={Position.Right}
          className="node-handle node-handle-amber"
          nodeId={id}
        />
        <HandleWithClick
          id="else"
          type="source"
          position={Position.Bottom}
          className="node-handle node-handle-amber"
          nodeId={id}
        />
      </div>
    );
  }

  // Vista compact: solo header
  if (nodeViewMode === 'compact') {
    return (
      <div
        ref={nodeRef}
        className={`node-container condition-node compact-view ${selected ? 'node-selected' : ''} ${statusClass}`}
        style={{ minWidth: '200px' }}
      >
        <div className="node-header">
          <div className={`node-indicator node-indicator-amber ${statusClass}`}>
            {status === NodeStatus.RUNNING ? (
              <Loader2 size={22} className="animate-spin" />
            ) : status === NodeStatus.SUCCESS ? (
              <CheckCircle2 size={22} />
            ) : status === NodeStatus.ERROR ? (
              <XCircle size={22} />
            ) : (
              <GitBranch size={22} />
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
          className="node-handle node-handle-amber"
          nodeId={id}
        />
        <HandleWithClick
          id="out"
          type="source"
          position={Position.Right}
          className="node-handle node-handle-amber"
          nodeId={id}
        />
        <HandleWithClick
          id="else"
          type="source"
          position={Position.Bottom}
          className="node-handle node-handle-amber"
          nodeId={id}
        />
      </div>
    );
  }

  // Vista informative: header + badges + descripción
  return (
    <div
      ref={nodeRef}
      className={`node-container condition-node informative-view ${selected ? 'node-selected' : ''} ${statusClass}`}
      style={{ minWidth: '200px' }}
    >
      <div className="node-header">
        <div className={`node-indicator node-indicator-amber ${statusClass}`}>
          {status === NodeStatus.RUNNING ? (
            <Loader2 size={16} className="animate-spin" />
          ) : status === NodeStatus.SUCCESS ? (
            <CheckCircle2 size={16} />
          ) : status === NodeStatus.ERROR ? (
            <XCircle size={16} />
          ) : (
            <GitBranch size={16} />
          )}
        </div>
        <div className="node-title">{displayName}</div>
        {version > 1 && (
          <div className="node-version">v{version}</div>
        )}
      </div>
      {data.description && (
        <div className="node-description">{data.description as string}</div>
      )}
      {rulesCount > 0 && (
        <div className="node-badge node-badge-amber">
          Rules: {rulesCount}
        </div>
      )}
      {defaultTarget && (
        <div className="node-badge node-badge-info">
          Default: {defaultTarget}
        </div>
      )}
      <HandleWithClick
        id="in"
        type="target"
        position={Position.Left}
        className="node-handle node-handle-amber"
        nodeId={id}
      />
      <HandleWithClick
        id="out"
        type="source"
        position={Position.Right}
        className="node-handle node-handle-amber"
        nodeId={id}
      />
      <HandleWithClick
        id="else"
        type="source"
        position={Position.Bottom}
        className="node-handle node-handle-amber"
        nodeId={id}
      />
    </div>
  );
};

export default ConditionNode;
