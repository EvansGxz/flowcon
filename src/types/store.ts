/**
 * Tipos para el store de Zustand
 */

import { ReactFlowNode, ReactFlowEdge, NodeViewMode } from './reactflow';
import { Flow, Run, TraceEntry } from './api';

// Estado guardado de un flow
export interface FlowSavedState {
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
  graphId: string;
}

// Errores de validación por flow
export interface FlowErrors {
  valid: boolean;
  errors: string[];
}

// Estado del editor
export interface EditorState {
  // Estado básico
  nodes: ReactFlowNode[];
  edges: ReactFlowEdge[];
  selectedNodeId: string | null;
  graphId: string;
  nodeViewMode: NodeViewMode;

  // Estado Semana 2
  selectedFlowId: string | null;
  flows: Flow[];
  runs: Run[];
  selectedRun: Run | null;
  trace: TraceEntry[];
  connectionStatus: 'connected' | 'offline' | 'mismatch';
  projects: import('./api').Project[];
  selectedProjectId: string | null;
  activeNodeId: string | null;
  pollingInterval: NodeJS.Timeout | null;

  // Estado para tabs de flows
  openTabs: string[];
  flowSavedStates: Record<string, FlowSavedState>;
  flowErrors: Record<string, FlowErrors>;
  flowsLoaded: boolean;
  loadFlowRequestId: number;

  // Setters básicos
  setNodes: (nodesOrUpdater: ReactFlowNode[] | ((nodes: ReactFlowNode[]) => ReactFlowNode[])) => void;
  setEdges: (edgesOrUpdater: ReactFlowEdge[] | ((edges: ReactFlowEdge[]) => ReactFlowEdge[])) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  setGraphId: (graphId: string) => void;
  setNodeViewMode: (mode: NodeViewMode) => void;
  setSelectedFlowId: (flowId: string | null) => void;
  setSelectedRun: (run: Run | null) => void;
  setConnectionStatus: (status: 'connected' | 'offline' | 'mismatch') => void;
  setOpenTabs: (tabs: string[]) => void;
  setFlowSavedState: (flowId: string, state: FlowSavedState) => void;

  // Operaciones de nodos
  upsertNode: (node: ReactFlowNode) => void;
  updateNodeConfig: (nodeId: string, configPatch: Record<string, unknown>) => void;
  removeNode: (nodeId: string) => void;

  // Operaciones de edges
  addEdge: (newEdges: ReactFlowEdge | ReactFlowEdge[]) => void;
  removeEdge: (edgeId: string) => void;

  // Validación
  validateLocal: () => { valid: boolean; errors: string[] };
  validateRemote: () => Promise<{ valid: boolean; errors: string[] }>;

  // Export/Import
  exportGraph: () => string;
  importGraph: (jsonString: string) => { success: boolean; errors?: string[] };

  // Reset
  reset: () => void;

  // Cargar ejemplo
  loadExample: (exampleName: string) => Promise<{ success: boolean; errors?: string[] }>;

  // Conexión
  checkConnection: () => Promise<import('./api').HealthCheck>;

  // Flows
  loadFlows: () => Promise<{ success: boolean; flows: Flow[] }>;
  getProjectFlows: (projectId: string) => Promise<Flow[]>;
  loadFlow: (flowId: string) => Promise<{ success: boolean; flow?: Flow | null; error?: string; message?: string }>;
  saveFlow: (flowName?: string) => Promise<{ success: boolean; flow?: Flow; error?: string }>;
  deleteFlow: (flowId: string) => Promise<{ success: boolean }>;
  updateFlowName: (flowId: string, newName: string) => Promise<{ success: boolean; flow?: Flow }>;

  // Runs
  loadRuns: (flowId: string) => Promise<{ success: boolean; runs?: Run[]; error?: string }>;
  executeFlow: (timeoutSeconds?: number | null) => Promise<{ success: boolean; run?: Run; error?: string }>;
  startPollingRun: (runId: string) => void;
  stopPolling: () => void;
  cancelRun: (runId: string) => Promise<{ success: boolean; error?: string }>;
  loadRun: (runId: string) => Promise<{ success: boolean; run?: Run; error?: string }>;
  rerunFlow: (runId: string) => Promise<{ success: boolean; run?: Run; error?: string }>;

  // Proyectos
  loadProjects: () => Promise<{ success: boolean; projects: import('./api').Project[] }>;
  createProject: (projectData: { name: string; description?: string }) => Promise<{ success: boolean; project?: import('./api').Project; error?: string }>;
  deleteProject: (projectId: string) => Promise<{ success: boolean; error?: string }>;
  selectProject: (projectId: string | null) => Promise<void>;
  duplicateProject: (projectId: string) => Promise<{ success: boolean; project?: import('./api').Project; error?: string }>;
  exportProject: (projectId: string) => Promise<{ success: boolean; error?: string }>;
  exportAllProjects: () => Promise<{ success: boolean; error?: string }>;
  createFlow: (flowData: { name: string; description?: string; projectId: string }) => Promise<{ success: boolean; flow?: Flow; error?: string }>;

  // Helpers
  checkFlowHasUnsavedChanges: (flowId: string, currentNodes: ReactFlowNode[], currentEdges: ReactFlowEdge[]) => boolean;
  checkFlowHasErrors: (flowId: string) => boolean;
  navigateToRuns: (flowId: string) => void;
}
