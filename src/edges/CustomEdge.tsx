import { useState } from 'react';
import {
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
  Position,
} from '@xyflow/react';
import { ulid } from 'ulid';
import { createNodeInstance } from '../utils/nodeInstance';
import type { ReactFlowNode, ReactFlowEdge } from '../types/reactflow';
import EdgeControls from './EdgeControls';
import './CustomEdge.css';

interface CustomEdgeProps extends EdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  source: string;
  target: string;
  data?: { edgeStatus?: string };
}

// Estilos por estado
const EDGE_STYLES: Record<string, { stroke: string; strokeWidth: number; dasharray: string; animated: boolean }> = {
  idle:    { stroke: '#9ca3af', strokeWidth: 1.5, dasharray: '6 3', animated: false },
  running: { stroke: '#f59e0b', strokeWidth: 2.5, dasharray: '8 4', animated: true },
  success: { stroke: '#10b981', strokeWidth: 2,   dasharray: '6 3', animated: false },
  error:   { stroke: '#ef4444', strokeWidth: 2,   dasharray: '4 4', animated: false },
};

export default function CustomEdge({ 
  id, 
  sourceX, 
  sourceY, 
  targetX, 
  targetY,
  sourcePosition,
  targetPosition,
  source,
  target,
  data,
}: CustomEdgeProps) {
  const { deleteElements, getNode, setNodes, setEdges } = useReactFlow();
  const [isHovered, setIsHovered] = useState(false);
  
  const edgeStatus = data?.edgeStatus || 'idle';
  const style = EDGE_STYLES[edgeStatus] || EDGE_STYLES.idle;
  
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition: sourcePosition || Position.Right,
    targetX,
    targetY,
    targetPosition: targetPosition || Position.Left,
    borderRadius: 8,
    offset: 30,
  });

  const onDelete = () => {
    deleteElements({ edges: [{ id }] });
  };

  const onAddNode = () => {
    const sourceNode = getNode(source);
    const targetNode = getNode(target);
    
    if (!sourceNode || !targetNode) return;

    const midX = (sourceNode.position.x + targetNode.position.x) / 2;
    const midY = (sourceNode.position.y + targetNode.position.y) / 2;

    const newNode = createNodeInstance('ap.agent.core', { x: midX, y: midY });

    const newEdge1: ReactFlowEdge = {
      id: `e_${ulid()}`,
      source: source,
      target: newNode.id,
      type: 'custom',
      animated: false,
      sourceHandle: 'out',
      targetHandle: 'in',
    };

    const newEdge2: ReactFlowEdge = {
      id: `e_${ulid()}`,
      source: newNode.id,
      target: target,
      type: 'custom',
      animated: false,
      sourceHandle: 'out',
      targetHandle: 'in',
    };

    setNodes((nds) => [...nds, newNode]);
    setEdges((eds) => {
      const filtered = eds.filter((edge) => edge.id !== id);
      return [...filtered, newEdge1, newEdge2];
    });
  };

  return (
    <>
      <g
        className={`edge-path-group ${isHovered ? 'hovered' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Edge path con estilos inline para garantizar que funcionen */}
        <path
          d={edgePath}
          fill="none"
          stroke={isHovered ? '#a78bfa' : style.stroke}
          strokeWidth={isHovered ? 3 : style.strokeWidth}
          strokeDasharray={style.dasharray}
          className={style.animated ? 'edge-dash-animated' : ''}
        />
        {/* Hit area invisible */}
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
