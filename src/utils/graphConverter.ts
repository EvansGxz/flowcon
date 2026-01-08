/**
 * Utilidades para convertir entre formato React Flow y GraphDefinition (REDMIND)
 */

import type { ReactFlowNode, ReactFlowEdge } from '../types/reactflow';
import type { BaseNode, Edge, GraphDefinition } from '../types/contracts';

/**
 * Convierte nodos de React Flow a formato BaseNode (REDMIND)
 */
export function reactFlowNodesToBaseNodes(reactFlowNodes: ReactFlowNode[]): BaseNode[] {
  if (!Array.isArray(reactFlowNodes)) {
    return [];
  }
  return reactFlowNodes.map((node) => {
    const mappedType = mapTypeIdToNodeType(node.data?.typeId);
    return {
      id: String(node.id), // Preservar ID original al exportar
      type: mappedType as BaseNode['type'],
      typeVersion: node.data?.version || 1,
      label: node.data?.displayName || node.data?.label,
      config: node.data?.config || {},
      ui: {
        x: node.position.x,
        y: node.position.y,
        // w y h se pueden obtener de measured si están disponibles
      },
    };
  });
}

/**
 * Convierte edges de React Flow a formato Edge (REDMIND)
 */
export function reactFlowEdgesToEdges(reactFlowEdges: ReactFlowEdge[]): Edge[] {
  if (!Array.isArray(reactFlowEdges)) {
    return [];
  }
  return reactFlowEdges.map((edge) => ({
    id: String(edge.id), // Preservar ID original al exportar
    source: String(edge.source), // Preservar referencias
    target: String(edge.target), // Preservar referencias
    label: typeof edge.label === 'string' ? edge.label : undefined,
  }));
}

/**
 * Convierte un grafo de React Flow a GraphDefinition (REDMIND)
 */
export function reactFlowToGraphDefinition(
  reactFlowNodes: ReactFlowNode[],
  reactFlowEdges: ReactFlowEdge[],
  graphId: string = 'default'
): GraphDefinition {
  const nodes = reactFlowNodesToBaseNodes(reactFlowNodes || []);
  const edges = reactFlowEdgesToEdges(reactFlowEdges || []);

  // Encontrar el nodo start (primer trigger o primer nodo sin inputs)
  const nodesWithInputs = new Set(edges.map((e) => e.target));
  const startNode = nodes.find((n) => n.type.startsWith('trigger.') || !nodesWithInputs.has(n.id)) || nodes[0];

  return {
    id: graphId,
    version: 1, // contract version
    start: startNode?.id || nodes[0]?.id || '',
    nodes,
    edges,
  };
}

/**
 * Convierte BaseNodes (REDMIND) a formato React Flow
 */
export function baseNodesToReactFlow(baseNodes: BaseNode[]): ReactFlowNode[] {
  if (!Array.isArray(baseNodes)) {
    return [];
  }
  return baseNodes.map((baseNode) => {
    const typeId = mapNodeTypeToTypeId(baseNode.type);
    // PRESERVAR el ID original del nodo - esto es crítico para mantener referencias
    return {
      id: String(baseNode.id), // Asegurar que sea string y preservar el ID original
      type: getReactFlowTypeName(baseNode.type),
      position: baseNode.ui
        ? { x: baseNode.ui.x, y: baseNode.ui.y }
        : { x: 0, y: 0 },
      data: {
        typeId,
        version: baseNode.typeVersion || 1,
        displayName: baseNode.label || typeId || '',
        config: baseNode.config || {},
        status: 'idle',
      },
    };
  });
}

/**
 * Convierte Edges (REDMIND) a formato React Flow
 */
export function edgesToReactFlow(edges: Edge[]): ReactFlowEdge[] {
  if (!Array.isArray(edges)) {
    return [];
  }
  return edges.map((edge) => ({
    id: String(edge.id), // Preservar ID original del edge
    source: String(edge.source), // Preservar referencias a nodos
    target: String(edge.target), // Preservar referencias a nodos
    type: 'custom',
    animated: true,
    sourceHandle: 'out',
    targetHandle: 'in',
    label: edge.label,
  }));
}

/**
 * Convierte un GraphDefinition (REDMIND) a formato React Flow
 */
export function graphDefinitionToReactFlow(graphDefinition: GraphDefinition | null | undefined): {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
} {
  if (!graphDefinition) {
    return { nodes: [], edges: [] };
  }
  
  const nodes = baseNodesToReactFlow(graphDefinition.nodes || []);
  const edges = edgesToReactFlow(graphDefinition.edges || []);

  return { nodes, edges };
}

/**
 * Mapea typeId (nuestro sistema) a NodeType (REDMIND)
 */
function mapTypeIdToNodeType(typeId?: string): string {
  const mapping: Record<string, string> = {
    'ap.trigger.webhook': 'trigger.webhook',
    'ap.trigger.manual': 'trigger.manual',
    'ap.trigger.input': 'trigger.input',
    'ap.agent.core': 'agent.core',
    'ap.condition.expr': 'condition.expr',
    'ap.memory.kv': 'memory.kv',
    'ap.model.llm': 'model.llm',
    'ap.action.http': 'tool.http',
    'ap.tool.http': 'tool.http',
    'ap.tool.postgres': 'tool.postgres',
    'ap.response.chat': 'response.chat',
    'ap.response.end': 'response.end',
  };
  return mapping[typeId || ''] || typeId || 'trigger.manual';
}

/**
 * Mapea NodeType (REDMIND) a typeId (nuestro sistema)
 */
function mapNodeTypeToTypeId(nodeType: string): string {
  const mapping: Record<string, string> = {
    'trigger.webhook': 'ap.trigger.webhook',
    'trigger.manual': 'ap.trigger.manual',
    'trigger.input': 'ap.trigger.input',
    'agent.core': 'ap.agent.core',
    'condition.expr': 'ap.condition.expr',
    'memory.kv': 'ap.memory.kv',
    'model.llm': 'ap.model.llm',
    'tool.http': 'ap.tool.http',
    'tool.postgres': 'ap.tool.postgres',
    'response.chat': 'ap.response.chat',
    'response.end': 'ap.response.end',
  };
  return mapping[nodeType] || `ap.${nodeType}`;
}

/**
 * Obtiene el nombre del tipo React Flow desde NodeType
 */
function getReactFlowTypeName(nodeType: string): string {
  // Mapeo simple: convertir "trigger.webhook" a "trigger_webhook" o similar
  // Esto debe coincidir con los nombres en nodeTypes del FlowCanvas
  const mapping: Record<string, string> = {
    'trigger.webhook': 'webhook_trigger',
    'trigger.manual': 'manual_trigger',
    'trigger.input': 'trigger_input',
    'agent.core': 'agent_core',
    'condition.expr': 'condition_expr',
    'memory.kv': 'memory_kv',
    'model.llm': 'model_llm',
    'tool.http': 'tool_http',
    'tool.postgres': 'tool_postgres',
    'response.chat': 'response_chat',
    'response.end': 'response_end',
  };
  return mapping[nodeType] || nodeType.replace('.', '_');
}
