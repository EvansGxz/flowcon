/**
 * Tipos para React Flow
 */

import { Node, Edge } from '@xyflow/react';

// Tipos de datos de nodos React Flow
export interface ReactFlowNodeData extends Record<string, unknown> {
  typeId: string;
  displayName: string;
  label?: string;
  version?: number;
  config?: Record<string, unknown>;
  status?: 'idle' | 'running' | 'success' | 'error' | 'skipped';
  category?: string;
  description?: string;
  icon?: string;
  color?: string;
}

// Nodo de React Flow con datos tipados
export type ReactFlowNode = Node<ReactFlowNodeData>;

// Edge de React Flow
export type ReactFlowEdge = Edge;

// Tipos de vista de nodos
export type NodeViewMode = 'icon' | 'compact' | 'informative';
