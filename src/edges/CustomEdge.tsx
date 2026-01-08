import { useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  useReactFlow,
  type EdgeProps,
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
}

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
        className={`edge-path-group ${isHovered ? 'hovered' : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <BaseEdge id={id} path={edgePath} />
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
