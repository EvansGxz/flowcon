import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useEffect, useRef } from 'react';
import { Database, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { NodeStatus, type NodeStatusValue } from './definitions/types';
import { nodeRegistry } from './definitions/registry';
import { useEditorStore } from '../store/editorStore';
import type { ReactFlowNodeData } from '../types/reactflow';
import './NodeStyles.css';

interface ToolPostgresNodeProps extends NodeProps {
  data: ReactFlowNodeData;
}

const ToolPostgresNode = ({ data, selected, id }: ToolPostgresNodeProps) => {
  // Obtener definición del nodo
  const definition = data.typeId ? nodeRegistry.get(data.typeId) : null;
  const displayName = data.displayName || definition?.displayName || (data.label as string) || 'PostgreSQL';
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
  const queryType = typeof config.queryType === 'string' ? config.queryType : null;
  const database = typeof config.database === 'string' ? config.database : null;

  // Clase de estado para el indicador
  const statusClass = `node-status-${status}`;

  // Render status icon helper
  const renderIcon = (size: number) => {
    if (status === NodeStatus.RUNNING) return <Loader2 size={size} className="animate-spin" />;
    if (status === NodeStatus.SUCCESS) return <CheckCircle2 size={size} />;
    if (status === NodeStatus.ERROR) return <XCircle size={size} />;
    return <Database size={size} />;
  };

  // Vista icon: small circle
  if (nodeViewMode === 'icon') {
    return (
      <div
        ref={nodeRef}
        className={`node-container sub-agent-node ${selected ? 'node-selected' : ''} ${statusClass}`}
        style={{ width: 48, height: 48 }}
      >
        {renderIcon(24)}
        <Handle id="ai_output" type="source" position={Position.Top} className="node-handle node-handle-ai-source" />
        <div className="sub-agent-label">{displayName}</div>
      </div>
    );
  }

  // Vista compact: medium circle with label
  if (nodeViewMode === 'compact') {
    return (
      <div
        ref={nodeRef}
        className={`node-container sub-agent-node ${selected ? 'node-selected' : ''} ${statusClass}`}
        style={{ width: 64, height: 64 }}
      >
        {renderIcon(28)}
        <Handle id="ai_output" type="source" position={Position.Top} className="node-handle node-handle-ai-source" />
        <div className="sub-agent-label">{displayName}</div>
      </div>
    );
  }

  // Vista informative: larger circle with name + details
  return (
    <div
      ref={nodeRef}
      className={`node-container sub-agent-node ${selected ? 'node-selected' : ''} ${statusClass}`}
      style={{ width: 80, height: 80 }}
    >
      {renderIcon(32)}
      <Handle id="ai_output" type="source" position={Position.Top} className="node-handle node-handle-ai-source" />
      <div className="sub-agent-label">
        {displayName}
        {(queryType || database) && (
          <span className="sub-agent-detail">
            {queryType && queryType}
            {queryType && database && ' · '}
            {database && database}
          </span>
        )}
      </div>
    </div>
  );
};

export default ToolPostgresNode;
