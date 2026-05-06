import { useState, useMemo } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  useNodes,
  type EdgeProps,
} from '@xyflow/react';
import { ulid } from 'ulid';
import { createNodeInstance } from '../utils/nodeInstance';
import type { ReactFlowNode, ReactFlowEdge } from '../types/reactflow';
import EdgeControls from './EdgeControls';
import { NodeStatus } from '../nodes/definitions/types';
import './CustomEdge.css';

interface CustomEdgeProps extends EdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  source: string;
  target: string;
}

// Colores de edge según estado de ejecución
const EDGE_COLORS: Record<string, string> = {
  running: '#f59e0b',   // amber
  success: '#10b981',   // green
  error: '#ef4444',     // red
  idle: '',             // default (theme)
};

export default function CustomEdge({ 
  id, 
  sourceX, 
  sourceY, 
  targetX, 
  targetY,
  source,
  target,
}: CustomEdgeProps) {
  const { deleteElements, getNode, setNodes, setEdges } = useReactFlow();
  const [isHovered, setIsHovered] = useState(false);
  
  // useNodes() para reactividad -- se re-renderiza cuando cambia data.status de cualquier nodo
  const allNodes = useNodes();
  
  // Determinar color del edge basado en estado de los nodos conectados
  const edgeStatus = useMemo(() => {
    const sourceNode = allNodes.find(n => n.id === source);
    const targetNode = allNodes.find(n => n.id === target);
    const srcStatus = (sourceNode?.data?.status as string) || 'idle';
    const tgtStatus = (targetNode?.data?.status as string) || 'idle';
    
    // Si el source completó y el target está running → edge activo
    if (srcStatus === NodeStatus.SUCCESS && tgtStatus === NodeStatus.RUNNING) return 'running';
    // Si el source está running → edge alimentando
    if (srcStatus === NodeStatus.RUNNING) return 'running';
    // Si ambos completaron → edge completado
    if (srcStatus === NodeStatus.SUCCESS && tgtStatus === NodeStatus.SUCCESS) return 'success';
    // Si alguno tiene error → edge error
    if (srcStatus === NodeStatus.ERROR || tgtStatus === NodeStatus.ERROR) return 'error';
    return 'idle';
  }, [allNodes, source, target]);
  
  const edgeColor = EDGE_COLORS[edgeStatus] || '';
  
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  const onDelete = () => {
    deleteElements({ edges: [{ id }] });
  };

  const onAddNode = () => {
    const sourceNode = getNode(source);
    const targetNode = getNode(target);
    
    if (!sourceNode || !targetNode) return;

    // Calcular posición del nuevo nodo en el medio
    const midX = (sourceNode.position.x + targetNode.position.x) / 2;
    const midY = (sourceNode.position.y + targetNode.position.y) / 2;

    // Crear nuevo nodo usando createNodeInstance con ULID (prefijo "n_")
    const newNode = createNodeInstance('ap.agent.core', { x: midX, y: midY });

    // Crear nuevos edges con ULID y prefijo "e_"
    const newEdge1: ReactFlowEdge = {
      id: `e_${ulid()}`,
      source: source,
      target: newNode.id,
      type: 'custom',
      animated: true,
      sourceHandle: 'out',
      targetHandle: 'in',
    };

    const newEdge2: ReactFlowEdge = {
      id: `e_${ulid()}`,
      source: newNode.id,
      target: target,
      type: 'custom',
      animated: true,
      sourceHandle: 'out',
      targetHandle: 'in',
    };

    // Actualizar estado
    setNodes((nds) => [...nds, newNode]);
    setEdges((eds) => {
      // Eliminar el edge actual
      const filtered = eds.filter((edge) => edge.id !== id);
      // Agregar los dos nuevos edges
      return [...filtered, newEdge1, newEdge2];
    });
  };

  return (
    <>
      <g
        className={`edge-path-group ${isHovered ? 'hovered' : ''} edge-status-${edgeStatus}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <BaseEdge id={id} path={edgePath} style={edgeColor ? { stroke: edgeColor, strokeWidth: 2.5 } : undefined} />
        {/* Path invisible más grueso para facilitar el hover */}
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={20}
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        />
      </g>
      <EdgeLabelRenderer>
        <div
          className="edge-controls-wrapper"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <EdgeControls
            id={id}
            labelX={labelX}
            labelY={labelY}
            onDelete={onDelete}
            onAddNode={onAddNode}
            isVisible={isHovered}
          />
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
