/**
 * Tipos para las respuestas de la API
 */

// Flow
export interface Flow {
  id?: string;
  flow_id?: string;
  name: string;
  description?: string;
  graph?: unknown;
  graph_json?: string | unknown;
  graph_version?: number;
  contract_version?: number;
  created_at?: string;
  updated_at?: string;
}

// Run
export interface Run {
  id?: string;
  runId?: string;
  run_id?: string;
  flowId?: string;
  flow_id?: string;
  status: 'running' | 'completed' | 'error' | 'cancelled' | 'timeout' | 'pending';
  execution_mode?: 'agent' | 'sequential' | string | null;
  trace?: TraceEntry[];
  node_runs?: TraceEntry[];
  error?: string | { message?: string; code?: string; timeout_seconds?: number; timeoutSeconds?: number; elapsed_seconds?: number } | null;
  createdAt?: string;
  created_at?: string;
  started_at?: string;
  endedAt?: string | null;
  ended_at?: string | null;
}

// Trace Entry
export interface TraceEntry {
  nodeId?: string;
  node_id?: string;
  status: 'running' | 'completed' | 'error' | 'skipped' | 'success' | 'pending';
  input?: unknown;
  output?: {
    iteration?: number;
    action?: {
      type?: string;
      capability_id?: string;
      capabilityId?: string;
      confidence?: number;
      reasoning?: string;
    };
    should_continue?: boolean;
    [key: string]: unknown;
  };
  error?: string | { message?: string; code?: string; timeout_seconds?: number; timeoutSeconds?: number } | null;
  started_at?: string;
  ended_at?: string;
  duration_ms?: number;
  durationMs?: number;
  duration?: number;
  invokedByAgent?: boolean;
}

// Project
export interface Project {
  id?: string;
  project_id?: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

// Health Check
export interface HealthCheck {
  status: 'connected' | 'offline' | 'mismatch';
  version?: string;
  error?: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
