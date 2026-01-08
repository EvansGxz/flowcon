/**
 * Tipos TypeScript derivados de los schemas Zod
 * Estos tipos se generan automáticamente desde los schemas en contracts/index.ts
 */

import { z } from 'zod';
import {
  NodeTypeSchema,
  BaseNodeSchema,
  EdgeSchema,
  GraphDefinitionSchema,
  TriggerManualConfigSchema,
  TriggerWebhookConfigSchema,
  TriggerInputConfigSchema,
  AgentCoreConfigSchema,
  ConditionExprConfigSchema,
  MemoryKvConfigSchema,
  ModelLlmConfigSchema,
  ToolHttpConfigSchema,
  ToolPostgresConfigSchema,
  ResponseChatConfigSchema,
  ResponseEndConfigSchema,
} from '../contracts';

// Tipos base
export type NodeType = z.infer<typeof NodeTypeSchema>;
export type NodeId = string;
export type EdgeId = string;

// Tipos de configuración
export type TriggerManualConfig = z.infer<typeof TriggerManualConfigSchema>;
export type TriggerWebhookConfig = z.infer<typeof TriggerWebhookConfigSchema>;
export type TriggerInputConfig = z.infer<typeof TriggerInputConfigSchema>;
export type AgentCoreConfig = z.infer<typeof AgentCoreConfigSchema>;
export type ConditionExprConfig = z.infer<typeof ConditionExprConfigSchema>;
export type MemoryKvConfig = z.infer<typeof MemoryKvConfigSchema>;
export type ModelLlmConfig = z.infer<typeof ModelLlmConfigSchema>;
export type ToolHttpConfig = z.infer<typeof ToolHttpConfigSchema>;
export type ToolPostgresConfig = z.infer<typeof ToolPostgresConfigSchema>;
export type ResponseChatConfig = z.infer<typeof ResponseChatConfigSchema>;
export type ResponseEndConfig = z.infer<typeof ResponseEndConfigSchema>;

// Union de configuraciones
export type NodeConfig =
  | { type: 'trigger.manual'; config: TriggerManualConfig }
  | { type: 'trigger.webhook'; config: TriggerWebhookConfig }
  | { type: 'trigger.input'; config: TriggerInputConfig }
  | { type: 'agent.core'; config: AgentCoreConfig }
  | { type: 'condition.expr'; config: ConditionExprConfig }
  | { type: 'memory.kv'; config: MemoryKvConfig }
  | { type: 'model.llm'; config: ModelLlmConfig }
  | { type: 'tool.http'; config: ToolHttpConfig }
  | { type: 'tool.postgres'; config: ToolPostgresConfig }
  | { type: 'response.chat'; config: ResponseChatConfig }
  | { type: 'response.end'; config: ResponseEndConfig };

// Tipos principales
export type BaseNode = z.infer<typeof BaseNodeSchema>;
export type Edge = z.infer<typeof EdgeSchema>;
export type GraphDefinition = z.infer<typeof GraphDefinitionSchema>;

// Resultado de validación
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}
