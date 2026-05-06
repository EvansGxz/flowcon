import { useState } from 'react';
import {
  BaseEdge,
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

interface CustomEdgeProps extends EdgeProps {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  source: string;
  target: string;
}

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
  style,
  markerEnd,
}: CustomEdgeProps) {
  const { deleteElements, getNode, setNodes, setEdges } = useReactFlow();
  const [isHovered, setIsHovered] = useState(false);
  
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

  const hoverStyle = isHovered ? { stroke: '#a78bfa', strokeWidth: 3 } : {};

  return (
    <>
      <g
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* BaseEdge maneja animated nativo de React Flow */}
        <BaseEdge 
          id={id} 
          path={edgePath} 
          style={{ ...style, ...hoverStyle }}
          markerEnd={markerEnd}
        />
        {/* Hit area */}
        <path
          d={edgePath}
          fill="none"
          stroke="transparent"
          strokeWidth={20}
          style={{ cursor: 'pointer' }}
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
