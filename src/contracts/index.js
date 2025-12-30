/**
 * Contratos REDMIND - Tipos y Schemas Zod
 * Basado en REDMIND_MVP1_Frontend_Semana1.pdf
 */

import { z } from 'zod';

// ============================================================================
// Tipos base
// ============================================================================

export const NodeTypeSchema = z.enum([
  'trigger.webhook',
  'trigger.manual',
  'agent.core',
  'condition.expr',
  'memory.kv',
  'model.llm',
  'tool.http',
  'tool.postgres',
  'response.chat',
]);

// Los IDs pueden ser cualquier string único, no necesariamente UUIDs
// Esto permite importar grafos con IDs simples como "t1", "a1", etc.
export const NodeIdSchema = z.string().min(1);
export const EdgeIdSchema = z.string().min(1);

// ============================================================================
// Configuraciones por tipo de nodo
// ============================================================================

export const TriggerManualConfigSchema = z.object({
  message: z.string(),
});

export const TriggerWebhookConfigSchema = z.object({
  path: z.string().regex(/^\//), // Debe empezar con /
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
});

export const AgentCoreConfigSchema = z.object({
  strategy: z.literal('reactive'),
  instructions: z.string(),
});

export const ConditionExprConfigSchema = z.object({
  engine: z.enum(['jexl', 'jmespath']),
  rules: z.array(
    z.object({
      if: z.string().min(1),
      to: z.string().min(1), // NodeIdSchema
    })
  ).min(1), // minItems: 1 según JSON Schema
});

export const MemoryKvConfigSchema = z.object({
  mode: z.enum(['load', 'save']),
  scope: z.enum(['conversation', 'run']),
  backend: z.enum(['postgres', 'memory']),
});

export const ModelLlmConfigSchema = z.object({
  provider: z.enum(['azure', 'openai', 'local']),
  model: z.string(),
  temperature: z.number().min(0).max(2).optional(),
});

export const ToolHttpConfigSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  url: z.string().url(),
  headers: z.record(z.string()).optional(),
  body: z.any().optional(),
});

export const ToolPostgresConfigSchema = z.object({
  connectionRef: z.string(),
  query: z.string(),
});

export const ResponseChatConfigSchema = z.object({
  format: z.enum(['text', 'json']),
  template: z.string().optional(),
});

// ============================================================================
// Schema de configuración unificado (discriminated union)
// ============================================================================

export const NodeConfigSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('trigger.manual'), config: TriggerManualConfigSchema }),
  z.object({ type: z.literal('trigger.webhook'), config: TriggerWebhookConfigSchema }),
  z.object({ type: z.literal('agent.core'), config: AgentCoreConfigSchema }),
  z.object({ type: z.literal('condition.expr'), config: ConditionExprConfigSchema }),
  z.object({ type: z.literal('memory.kv'), config: MemoryKvConfigSchema }),
  z.object({ type: z.literal('model.llm'), config: ModelLlmConfigSchema }),
  z.object({ type: z.literal('tool.http'), config: ToolHttpConfigSchema }),
  z.object({ type: z.literal('tool.postgres'), config: ToolPostgresConfigSchema }),
  z.object({ type: z.literal('response.chat'), config: ResponseChatConfigSchema }),
]);

// ============================================================================
// BaseNode Schema
// ============================================================================

export const BaseNodeSchema = z.object({
  id: NodeIdSchema,
  type: NodeTypeSchema,
  typeVersion: z.number().int().min(1).default(1), // integer, minimum: 1, default: 1 (según JSON Schema)
  label: z.string().optional(),
  config: z.any(), // Se valida según el tipo en validateNode
  ui: z
    .object({
      x: z.number(),
      y: z.number(),
      w: z.number().optional(),
      h: z.number().optional(),
    })
    .optional(),
});

// ============================================================================
// Edge Schema
// ============================================================================

export const EdgeSchema = z.object({
  id: EdgeIdSchema,
  source: NodeIdSchema,
  target: NodeIdSchema,
  label: z.string().optional(),
});

// ============================================================================
// GraphDefinition Schema
// ============================================================================

export const GraphDefinitionSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().min(1), // contract version (integer, minimum: 1)
  start: NodeIdSchema,
  nodes: z.array(BaseNodeSchema).min(1), // minItems: 1 según JSON Schema
  edges: z.array(EdgeSchema),
});

// ============================================================================
// Funciones de validación
// ============================================================================

/**
 * Valida un nodo completo según su tipo
 */
export function validateNode(node) {
  const baseValidation = BaseNodeSchema.safeParse(node);
  if (!baseValidation.success) {
    return { valid: false, errors: baseValidation.error.errors };
  }

  // Validar config según el tipo
  let configSchema;
  switch (node.type) {
    case 'trigger.manual':
      configSchema = TriggerManualConfigSchema;
      break;
    case 'trigger.webhook':
      configSchema = TriggerWebhookConfigSchema;
      break;
    case 'agent.core':
      configSchema = AgentCoreConfigSchema;
      break;
    case 'condition.expr':
      configSchema = ConditionExprConfigSchema;
      break;
    case 'memory.kv':
      configSchema = MemoryKvConfigSchema;
      break;
    case 'model.llm':
      configSchema = ModelLlmConfigSchema;
      break;
    case 'tool.http':
      configSchema = ToolHttpConfigSchema;
      break;
    case 'tool.postgres':
      configSchema = ToolPostgresConfigSchema;
      break;
    case 'response.chat':
      configSchema = ResponseChatConfigSchema;
      break;
    default:
      return { valid: false, errors: [{ message: `Tipo de nodo desconocido: ${node.type}` }] };
  }

  const configValidation = configSchema.safeParse(node.config);
  if (!configValidation.success) {
    return { valid: false, errors: configValidation.error.errors };
  }

  return { valid: true };
}

/**
 * Valida un grafo completo
 */
export function validateGraph(graph) {
  const result = GraphDefinitionSchema.safeParse(graph);
  if (!result.success) {
    return {
      valid: false,
      errors: result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`),
    };
  }

  // Validar que todos los nodos sean válidos
  const nodeErrors = [];
  for (const node of graph.nodes) {
    const nodeValidation = validateNode(node);
    if (!nodeValidation.valid) {
      nodeErrors.push(
        ...nodeValidation.errors.map((err) => `Nodo ${node.id}: ${err.message || JSON.stringify(err)}`)
      );
    }
  }

  // Validar que los edges referencien nodos existentes
  const nodeIds = new Set(graph.nodes.map((n) => n.id));
  const edgeErrors = graph.edges
    .filter((e) => !nodeIds.has(e.source) || !nodeIds.has(e.target))
    .map((e) => `Edge ${e.id}: referencia a nodo inexistente`);

  // Validar que start existe
  if (!nodeIds.has(graph.start)) {
    edgeErrors.push(`Start node '${graph.start}' no existe en el grafo`);
  }

  // Validar IDs únicos: node.id y edge.id sin duplicados
  const nodeIdSet = new Set();
  const duplicateNodeIds = graph.nodes.filter((n) => {
    if (nodeIdSet.has(n.id)) return true;
    nodeIdSet.add(n.id);
    return false;
  });
  if (duplicateNodeIds.length > 0) {
    edgeErrors.push(`IDs de nodos duplicados: ${duplicateNodeIds.map((n) => n.id).join(', ')}`);
  }

  const edgeIdSet = new Set();
  const duplicateEdgeIds = graph.edges.filter((e) => {
    if (edgeIdSet.has(e.id)) return true;
    edgeIdSet.add(e.id);
    return false;
  });
  if (duplicateEdgeIds.length > 0) {
    edgeErrors.push(`IDs de edges duplicados: ${duplicateEdgeIds.map((e) => e.id).join(', ')}`);
  }

  // Validar no self-loops (source==target) en v1
  const selfLoops = graph.edges.filter((e) => e.source === e.target);
  if (selfLoops.length > 0) {
    edgeErrors.push(`Self-loops no permitidos en v1: ${selfLoops.map((e) => e.id).join(', ')}`);
  }

  // Validar Condition rules: rule.to debe existir
  for (const node of graph.nodes) {
    if (node.type === 'condition.expr' && node.config?.rules) {
      for (const rule of node.config.rules) {
        if (rule.to && !nodeIds.has(rule.to)) {
          edgeErrors.push(`Condition node ${node.id}: rule.to '${rule.to}' no existe`);
        }
      }
    }
  }

  const allErrors = [...nodeErrors, ...edgeErrors];

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

// ============================================================================
// Tipos TypeScript (para referencia, aunque usemos JS)
// ============================================================================

/**
 * @typedef {z.infer<typeof NodeTypeSchema>} NodeType
 * @typedef {z.infer<typeof BaseNodeSchema>} BaseNode
 * @typedef {z.infer<typeof EdgeSchema>} Edge
 * @typedef {z.infer<typeof GraphDefinitionSchema>} GraphDefinition
 */

