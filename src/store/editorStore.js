/**
 * Store Zustand para el editor de grafos
 * Basado en REDMIND_MVP1_Frontend_Semana1.pdf
 */

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { reactFlowToGraphDefinition, graphDefinitionToReactFlow } from '../utils/graphConverter';
import { validateGraph } from '../contracts';
import { checkHealth } from '../services/healthService';
import { getFlows as getFlowsService, saveFlow as saveFlowService, getFlow as getFlowService, deleteFlow as deleteFlowService, updateFlow as updateFlowService } from '../services/flowsService';
import { getRuns, executeFlowTest, executeFlow as executeFlowService, rerunFlow as rerunFlowService, getRun as getRunService, cancelRun as cancelRunService } from '../services/runsService';
import { validateGraphRemote } from '../services/validationService';
import { createProject as createProjectService, getProjects as getProjectsService, deleteProject as deleteProjectService, getProject as getProjectService } from '../services/projectsService';

/**
 * @typedef {Object} EditorState
 * @property {Array} nodes - Nodos de React Flow
 * @property {Array} edges - Edges de React Flow
 * @property {string|null} selectedNodeId - ID del nodo seleccionado
 * @property {Function} setNodes - Actualizar nodos
 * @property {Function} setEdges - Actualizar edges
 * @property {Function} setSelectedNodeId - Seleccionar nodo
 * @property {Function} upsertNode - Agregar o actualizar nodo
 * @property {Function} updateNodeConfig - Actualizar configuración de un nodo
 * @property {Function} addEdge - Agregar edge
 * @property {Function} removeNode - Eliminar nodo
 * @property {Function} removeEdge - Eliminar edge
 * @property {Function} validateLocal - Validar grafo localmente
 * @property {Function} exportGraph - Exportar grafo a JSON
 * @property {Function} importGraph - Importar grafo desde JSON
 */

// Inicializar proyecto desde localStorage según REDMIND_Projects_System.md
const getInitialProjectId = () => {
  try {
    return localStorage.getItem('redmind_currentProjectId');
  } catch (e) {
    return null;
  }
};

export const useEditorStore = create((set, get) => ({
  // Estado básico (Semana 1)
  nodes: [],
  edges: [],
  selectedNodeId: null,
  graphId: 'default',
  nodeViewMode: 'informative', // 'icon' | 'compact' | 'informative'
  
  // Estado Semana 2
  selectedFlowId: null,
  flows: [],
  runs: [],
  selectedRun: null,
  trace: [],
  connectionStatus: 'offline', // 'connected' | 'offline' | 'mismatch'
  projects: [],
  selectedProjectId: getInitialProjectId(), // Inicializar desde localStorage
  activeNodeId: null, // Nodo activo durante ejecución (para resaltar en canvas)
  pollingInterval: null, // Intervalo de polling para runs activos
  // Estado para tabs de flows
  openTabs: [], // Array de flowIds que están abiertos en tabs
  flowSavedStates: {}, // { flowId: { nodes, edges, graphId } } - Estado guardado de cada flow
  flowErrors: {}, // { flowId: { valid: boolean, errors: [] } } - Errores de validación por flow

  // Setters básicos
  setNodes: (nodesOrUpdater) => {
    if (typeof nodesOrUpdater === 'function') {
      set((state) => {
        const newNodes = nodesOrUpdater(state.nodes);
        return { nodes: Array.isArray(newNodes) ? newNodes : [] };
      });
    } else {
      set({ nodes: Array.isArray(nodesOrUpdater) ? nodesOrUpdater : [] });
    }
  },
  setEdges: (edgesOrUpdater) => {
    if (typeof edgesOrUpdater === 'function') {
      set((state) => {
        const newEdges = edgesOrUpdater(state.edges);
        return { edges: Array.isArray(newEdges) ? newEdges : [] };
      });
    } else {
      set({ edges: Array.isArray(edgesOrUpdater) ? edgesOrUpdater : [] });
    }
  },
  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),
  setGraphId: (graphId) => set({ graphId }),
  setNodeViewMode: (mode) => set({ nodeViewMode: mode }),
  setSelectedFlowId: (flowId) => set({ selectedFlowId: flowId }),
  setSelectedRun: (run) => set({ selectedRun: run }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setOpenTabs: (tabs) => set({ openTabs: tabs }),
  setFlowSavedState: (flowId, state) => {
    const { flowSavedStates } = get();
    set({
      flowSavedStates: {
        ...flowSavedStates,
        [flowId]: state,
      },
    });
  },
  checkFlowHasUnsavedChanges: (flowId, currentNodes, currentEdges) => {
    const { flowSavedStates, selectedFlowId } = get();
    
    // Solo verificar cambios si el flow está activo
    if (selectedFlowId !== flowId) {
      return false;
    }
    
    const savedState = flowSavedStates[flowId];
    
    if (!savedState) {
      // Si no hay estado guardado, no hay cambios (el flow no se ha guardado aún)
      return false;
    }
    
    // Comparar nodes y edges de forma más precisa
    // Normalizar para comparación (ordenar por id para evitar falsos positivos)
    const normalizeNodes = (nodes) => {
      return nodes.map(n => ({
        id: n.id,
        type: n.type,
        position: n.position,
        data: n.data,
      })).sort((a, b) => a.id.localeCompare(b.id));
    };
    
    const normalizeEdges = (edges) => {
      return edges.map(e => ({
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle,
        targetHandle: e.targetHandle,
      })).sort((a, b) => a.id.localeCompare(b.id));
    };
    
    const savedNodesNormalized = normalizeNodes(savedState.nodes || []);
    const currentNodesNormalized = normalizeNodes(currentNodes || []);
    const savedEdgesNormalized = normalizeEdges(savedState.edges || []);
    const currentEdgesNormalized = normalizeEdges(currentEdges || []);
    
    const nodesChanged = JSON.stringify(savedNodesNormalized) !== JSON.stringify(currentNodesNormalized);
    const edgesChanged = JSON.stringify(savedEdgesNormalized) !== JSON.stringify(currentEdgesNormalized);
    
    return nodesChanged || edgesChanged;
  },
  checkFlowHasErrors: (flowId) => {
    const { flowErrors } = get();
    const errors = flowErrors[flowId];
    return errors && !errors.valid;
  },
  selectProject: async (projectId) => {
    // Guardar en localStorage según REDMIND_Projects_System.md
    if (projectId) {
      localStorage.setItem('redmind_currentProjectId', projectId);
    } else {
      localStorage.removeItem('redmind_currentProjectId');
    }
    
    set({ selectedProjectId: projectId });
    
    // Recargar flows y runs al cambiar de proyecto según REDMIND_Projects_System.md
    if (projectId) {
      const { loadFlows } = get();
      try {
        await loadFlows();
        // Limpiar runs y flows del proyecto anterior
        set({ runs: [], selectedRun: null, flows: [], selectedFlowId: null });
      } catch (error) {
        console.error('Error al recargar datos del proyecto:', error);
      }
    } else {
      // Si no hay proyecto, limpiar todo
      set({ runs: [], selectedRun: null, flows: [], selectedFlowId: null, nodes: [], edges: [], openTabs: [], flowSavedStates: {}, flowErrors: {} });
    }
  },

  // Operaciones de nodos
  upsertNode: (node) => {
    const { nodes } = get();
    const existingIndex = nodes.findIndex((n) => n.id === node.id);
    if (existingIndex >= 0) {
      const updated = [...nodes];
      updated[existingIndex] = node;
      set({ nodes: updated });
    } else {
      set({ nodes: [...nodes, node] });
    }
  },

  updateNodeConfig: (nodeId, configPatch) => {
    const { nodes } = get();
    const updated = nodes.map((node) => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            config: {
              ...node.data.config,
              ...configPatch,
            },
          },
        };
      }
      return node;
    });
    set({ nodes: updated });
  },

  removeNode: (nodeId) => {
    const { nodes, edges } = get();
    const updatedNodes = nodes.filter((n) => n.id !== nodeId);
    const updatedEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
    set({ nodes: updatedNodes, edges: updatedEdges });
    if (get().selectedNodeId === nodeId) {
      set({ selectedNodeId: null });
    }
  },

  // Operaciones de edges
  addEdge: (newEdges) => {
    // newEdges puede ser un array o un solo edge
    const edgesArray = Array.isArray(newEdges) ? newEdges : [newEdges];
    const { edges } = get();
    set({ edges: [...edges, ...edgesArray] });
  },

  removeEdge: (edgeId) => {
    const { edges } = get();
    set({ edges: edges.filter((e) => e.id !== edgeId) });
  },

  // Validación
  validateLocal: () => {
    const { nodes, edges, graphId, selectedFlowId } = get();
    const graphDefinition = reactFlowToGraphDefinition(nodes, edges, graphId);
    const validation = validateGraph(graphDefinition);
    
    // Actualizar errores del flow actual si hay uno seleccionado
    if (selectedFlowId) {
      const { flowErrors } = get();
      set({
        flowErrors: {
          ...flowErrors,
          [selectedFlowId]: validation,
        },
      });
    }
    
    return validation;
  },

  validateRemote: async () => {
    const { nodes, edges, graphId } = get();
    const graphDefinition = reactFlowToGraphDefinition(nodes, edges, graphId);
    return await validateGraphRemote(graphDefinition);
  },

  // Export/Import
  exportGraph: () => {
    const { nodes, edges, graphId } = get();
    const graphDefinition = reactFlowToGraphDefinition(nodes, edges, graphId);
    return JSON.stringify(graphDefinition, null, 2);
  },

  importGraph: (jsonString) => {
    try {
      const graphDefinition = JSON.parse(jsonString);
      
      // Validar estructura básica
      if (!graphDefinition || typeof graphDefinition !== 'object') {
        return { success: false, errors: ['El JSON no es un objeto válido'] };
      }

      // Asegurar que nodes y edges sean arrays
      if (!Array.isArray(graphDefinition.nodes)) {
        graphDefinition.nodes = [];
      }
      if (!Array.isArray(graphDefinition.edges)) {
        graphDefinition.edges = [];
      }

      const validation = validateGraph(graphDefinition);
      if (!validation.valid) {
        return { success: false, errors: validation.errors };
      }

      const result = graphDefinitionToReactFlow(graphDefinition);
      
      // Validar que la conversión retornó un objeto válido
      if (!result || typeof result !== 'object') {
        return { success: false, errors: ['Error al convertir el grafo: resultado inválido'] };
      }

      const { nodes, edges } = result;
      
      // Validar que la conversión fue exitosa
      if (!Array.isArray(nodes) || !Array.isArray(edges)) {
        return { 
          success: false, 
          errors: [`Error al convertir el grafo a formato React Flow. nodes: ${typeof nodes}, edges: ${typeof edges}`] 
        };
      }

      // Validar que todos los edges referencien nodos existentes
      const nodeIds = new Set(nodes.map((n) => String(n.id)));
      const invalidEdges = edges.filter(
        (e) => !nodeIds.has(String(e.source)) || !nodeIds.has(String(e.target))
      );
      
      if (invalidEdges.length > 0) {
        return {
          success: false,
          errors: [
            `Edges con referencias inválidas: ${invalidEdges.map((e) => e.id).join(', ')}`,
          ],
        };
      }

      set({
        nodes,
        edges,
        graphId: graphDefinition.id || 'default',
        selectedNodeId: null,
      });

      return { success: true };
    } catch (error) {
      return { success: false, errors: [`Error al importar: ${error.message}`] };
    }
  },

  // Reset
  reset: () => {
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      graphId: 'default',
    });
  },

  // Cargar ejemplo
  loadExample: async (exampleName) => {
    try {
      // Importar dinámicamente el ejemplo desde src/examples
      let exampleData;
      let importedModule;
      
      if (exampleName === 'hello-agent' || exampleName === 'helloAgent') {
        importedModule = await import('../examples/hello-agent.json');
      } else if (exampleName === 'route-intent' || exampleName === 'routeIntent') {
        importedModule = await import('../examples/route-intent.json');
      } else if (exampleName === 'input-llm-end-flow' || exampleName === 'inputLlmEndFlow') {
        importedModule = await import('../examples/input-llm-end-flow.json');
      } else {
        return { success: false, errors: [`Ejemplo desconocido: ${exampleName}`] };
      }

      // En Create React App, los JSON se importan directamente o como default
      exampleData = importedModule.default || importedModule;
      // Si el módulo tiene una propiedad data, usarla
      if (importedModule.data) {
        exampleData = importedModule.data;
      }

      // Validar que se obtuvo data válida
      if (!exampleData || typeof exampleData !== 'object') {
        console.error('Datos del ejemplo inválidos:', exampleData, 'Módulo completo:', importedModule);
        return { success: false, errors: ['Error al cargar ejemplo: datos inválidos'] };
      }

      // Validar estructura básica antes de convertir
      if (!exampleData.nodes || !Array.isArray(exampleData.nodes)) {
        return { success: false, errors: ['Error al cargar ejemplo: estructura inválida (nodes faltante o no es array)'] };
      }
      if (!exampleData.edges || !Array.isArray(exampleData.edges)) {
        return { success: false, errors: ['Error al cargar ejemplo: estructura inválida (edges faltante o no es array)'] };
      }

      // Convertir a string JSON y usar importGraph
      const jsonString = JSON.stringify(exampleData, null, 2);
      return get().importGraph(jsonString);
    } catch (error) {
      console.error('Error al cargar ejemplo:', error);
      return { success: false, errors: [`Error al cargar ejemplo: ${error.message}`] };
    }
  },

  // Semana 2: Conexión y health check
  checkConnection: async () => {
    try {
      const health = await checkHealth();
      set({ connectionStatus: health.status });
      return health;
    } catch (error) {
      set({ connectionStatus: 'offline' });
      return { status: 'offline', error: error.message };
    }
  },

  // Semana 2: Flows
  loadFlows: async () => {
    try {
      const { selectedProjectId } = get();
      const localStorageProjectId = localStorage.getItem('redmind_currentProjectId');
      
      // Asegurar que el selectedProjectId esté en localStorage para que apiService lo use
      if (selectedProjectId && selectedProjectId !== localStorageProjectId) {
        localStorage.setItem('redmind_currentProjectId', selectedProjectId);
      }
      
      // Usar /flows con X-Project-Id header si hay proyecto seleccionado
      // Si no hay proyecto, llamar sin X-Project-Id para obtener todos los flows
      const flows = await getFlowsService(selectedProjectId || null);
      set({ flows: Array.isArray(flows) ? flows : [] });
      return { success: true, flows: Array.isArray(flows) ? flows : [] };
    } catch (error) {
      console.error('Error al cargar flows:', error);
      // No fallar si el endpoint no existe, solo retornar lista vacía
      set({ flows: [] });
      return { success: true, flows: [] };
    }
  },

  getProjectFlows: async (projectId) => {
    try {
      // Usar /flows con X-Project-Id header en lugar de /projects/:id/flows
      const flows = await getFlowsService(projectId);
      return flows || [];
    } catch (error) {
      console.error('Error al obtener flows del proyecto:', error);
      return [];
    }
  },

  loadFlow: async (flowId) => {
    try {
      const flow = await getFlowService(flowId);
      
      // El backend puede retornar el grafo de diferentes formas:
      // 1. En flow.graph_json (string JSON o objeto)
      // 2. En flow.graph (objeto)
      // 3. Directamente en el body (el objeto completo es el grafo)
      let graphData = flow.graph_json || flow.graph;
      
      // Si no hay graph_json ni graph, pero el flow tiene nodes y edges, 
      // significa que el grafo viene directamente en el body
      if (!graphData && flow.nodes && flow.edges) {
        graphData = {
          id: flow.id,
          version: flow.version,
          start: flow.start,
          nodes: flow.nodes,
          edges: flow.edges,
        };
      }
      
      // Si graph_json es un string, parsearlo
      if (typeof graphData === 'string') {
        try {
          graphData = JSON.parse(graphData);
        } catch (parseError) {
          console.error('Error al parsear graph_json:', parseError);
          graphData = null;
        }
      }
      
      // Si no hay graphData, inicializar con canvas vacío
      if (!graphData) {
        // Guardar el estado inicial como estado guardado
        const { setFlowSavedState } = get();
        setFlowSavedState(flowId, {
          nodes: [],
          edges: [],
          graphId: flow.id || flowId,
        });
        
        // No validar automáticamente - solo validar cuando se ejecute
        const { flowErrors } = get();
        set({
          flowErrors: {
            ...flowErrors,
            [flowId]: { valid: true, errors: [] },
          },
        });
        
        set({
          nodes: [],
          edges: [],
          graphId: flow.id || flowId,
          selectedFlowId: flowId,
        });
        return { success: true, flow };
      }
      
      const { nodes, edges } = graphDefinitionToReactFlow(graphData);
      
      // Guardar el estado inicial como estado guardado
      const { setFlowSavedState } = get();
      setFlowSavedState(flowId, {
        nodes: JSON.parse(JSON.stringify(nodes)), // Deep copy
        edges: JSON.parse(JSON.stringify(edges)), // Deep copy
        graphId: flow.id || flowId,
      });
      
      // No validar automáticamente al cargar - solo validar cuando se ejecute
      // Limpiar errores previos al cargar un flow
      const { flowErrors } = get();
      set({
        flowErrors: {
          ...flowErrors,
          [flowId]: { valid: true, errors: [] },
        },
      });
      
      set({
        nodes,
        edges,
        graphId: flow.id || flowId,
        selectedFlowId: flowId,
      });
      return { success: true, flow };
    } catch (error) {
      // Si el flow no existe (404), inicializar canvas vacío en lugar de mostrar error
      if (error.status === 404 || error.message?.includes('not found') || error.message?.includes('Not found')) {
        set({
          nodes: [],
          edges: [],
          graphId: flowId,
          selectedFlowId: flowId,
        });
        return { success: true, flow: null, message: 'Flow no encontrado, canvas inicializado vacío' };
      }
      
      // Para otros errores, loguear y retornar error
      console.error('Error al cargar flow:', error);
      return { success: false, error: error.message };
    }
  },

  saveFlow: async (flowName) => {
    try {
      const { nodes, edges, graphId, selectedFlowId } = get();
      
      // Si es un flow nuevo (no tiene selectedFlowId o es 'default'), generar un UUID v4
      let flowIdToUse = selectedFlowId;
      let graphIdToUse = graphId;
      let isNewFlow = false;
      
      if (!selectedFlowId || selectedFlowId === 'default') {
        // Generar nuevo UUID v4 para el flow
        flowIdToUse = null; // null indica que es un nuevo flow
        graphIdToUse = uuidv4(); // Generar UUID v4 para el graphId
        isNewFlow = true;
      } else {
        // Verificar si el flow existe en el backend
        // Si no existe, tratarlo como nuevo flow
        try {
          await getFlowService(selectedFlowId);
          // El flow existe, usar PUT
          graphIdToUse = selectedFlowId;
        } catch (error) {
          // Si el flow no existe (404), tratarlo como nuevo flow
          if (error.status === 404 || error.message?.includes('not found') || error.message?.includes('Not found')) {
            flowIdToUse = null; // null indica que es un nuevo flow
            graphIdToUse = selectedFlowId; // Mantener el UUID generado para el graphId
            isNewFlow = true;
          } else {
            // Otro tipo de error, lanzarlo
            throw error;
          }
        }
      }
      
      const graphDefinition = reactFlowToGraphDefinition(nodes, edges, graphIdToUse);
      
      const flowData = {
        name: flowName || `Flow ${new Date().toLocaleString()}`,
        graph: graphDefinition, // El backend espera 'graph' pero lo guarda en la columna 'graph_json'
      };

      const savedFlow = await saveFlowService(flowIdToUse, flowData);
      
      // El backend puede retornar id o flow_id
      const flowId = savedFlow.id || savedFlow.flow_id;
      
      // Actualizar el estado guardado con el estado actual
      const { setFlowSavedState } = get();
      setFlowSavedState(flowId, {
        nodes: JSON.parse(JSON.stringify(nodes)), // Deep copy
        edges: JSON.parse(JSON.stringify(edges)), // Deep copy
        graphId: flowId,
      });
      
      // No validar automáticamente al guardar - solo validar cuando se ejecute
      // Limpiar errores previos al guardar
      const { flowErrors } = get();
      set({
        flowErrors: {
          ...flowErrors,
          [flowId]: { valid: true, errors: [] },
        },
      });
      
      // Actualizar estado
      set({
        selectedFlowId: flowId,
        graphId: flowId,
      });

      // Recargar lista de flows
      await get().loadFlows();

      return { success: true, flow: savedFlow };
    } catch (error) {
      console.error('Error al guardar flow:', error);
      return { success: false, error: error.message };
    }
  },

  // Semana 2: Runs
  loadRuns: async (flowId) => {
    try {
      const runs = await getRuns(flowId);
      // Asegurar que runs sea siempre un array
      const runsArray = Array.isArray(runs) ? runs : [];
      set({ runs: runsArray });
      return { success: true, runs };
    } catch (error) {
      console.error('Error al cargar runs:', error);
      return { success: false, error: error.message };
    }
  },

  executeFlow: async (timeoutSeconds = null) => {
    try {
      const { nodes, edges, graphId, selectedFlowId } = get();
      
      // Validar el flow antes de ejecutar y guardar errores
      const graphDefinition = reactFlowToGraphDefinition(nodes, edges, graphId);
      const validation = validateGraph(graphDefinition);
      const { flowErrors } = get();
      
      if (selectedFlowId) {
        set({
          flowErrors: {
            ...flowErrors,
            [selectedFlowId]: validation,
          },
        });
      }
      
      // Si hay errores de validación, no ejecutar
      if (!validation.valid) {
        return { 
          success: false, 
          error: `El flow tiene errores de validación: ${validation.errors.join(', ')}` 
        };
      }
      
      let result;
      
      // Si hay un flowId persistido, usar POST /api/v1/runs (asíncrono según Semana 3)
      // Si no, usar POST /api/v1/runs/test (in-memory, puede ser síncrono)
      if (selectedFlowId) {
        console.log('[editorStore] Ejecutando flow persistido:', selectedFlowId);
        // Para flows persistidos, extraer input del grafo actual si hay trigger manual
        const graphDefinition = reactFlowToGraphDefinition(nodes, edges, graphId);
        const startNodeId = graphDefinition.start;
        const startNode = graphDefinition.nodes.find((n) => n.id === startNodeId);
        let input = null;
        
        // Si el start node es un trigger manual, extraer su input
        if (startNode && startNode.type === 'trigger.manual' && startNode.config) {
          input = {
            message: startNode.config.message || '',
          };
          console.log('[editorStore] Input extraído del trigger manual:', input);
        }
        
        // POST /api/v1/runs ahora retorna inmediatamente con {runId, status: "running"}
        result = await executeFlowService(selectedFlowId, input, timeoutSeconds);
        
        console.log('[editorStore] Respuesta inmediata del backend:', result);
        
        // El backend retorna inmediatamente: {runId, status: "running"}
        const runId = result.runId || result.id || result.run_id;
        const initialStatus = result.status || 'running';
        
        // Inicializar el run seleccionado con estado inicial
        set({
          selectedRun: {
            id: runId,
            flowId: selectedFlowId,
            status: initialStatus,
            trace: [],
            error: null,
            createdAt: new Date().toISOString(),
            endedAt: null,
          },
          trace: [],
          activeNodeId: null,
        });
        
        // Iniciar polling para actualizar el estado del run
        get().startPollingRun(runId);
        
        // Si hay un flowId, recargar runs para incluir el nuevo run
        if (selectedFlowId) {
          await get().loadRuns(selectedFlowId);
        }
        
        return { success: true, run: { id: runId, status: initialStatus } };
      } else {
        console.log('[editorStore] Ejecutando flow de prueba (in-memory)');
        // Ejecutar in-memory sin persistir (puede seguir siendo síncrono)
        const graphDefinition = reactFlowToGraphDefinition(nodes, edges, graphId);
        result = await executeFlowTest(graphDefinition, timeoutSeconds);
        
        console.log('[editorStore] Resultado de ejecución test:', result);
        
        // Actualizar trace y run seleccionado
        const traceArray = result.trace || result.node_runs || [];
        set({
          trace: traceArray,
          selectedRun: {
            id: result.runId || result.id || result.run_id,
            flowId: result.flowId || result.flow_id,
            status: result.status,
            trace: traceArray,
            error: result.error,
            createdAt: result.created_at || result.started_at || new Date().toISOString(),
            endedAt: result.ended_at,
          },
          activeNodeId: null,
        });
        
        return { success: true, run: result };
      }
    } catch (error) {
      console.error('[editorStore] Error al ejecutar flow:', error);
      return { success: false, error: error.message };
    }
  },

  // Polling para actualizar el estado de un run en ejecución
  startPollingRun: (runId) => {
    const { pollingInterval } = get();
    
    // Limpiar intervalo anterior si existe
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    console.log('[editorStore] Iniciando polling para run:', runId);
    
    // Polling cada 1.5 segundos (recomendado: 1-2 segundos según documentación)
    const interval = setInterval(async () => {
      try {
        const run = await getRunService(runId);
        const traceArray = run.trace || run.node_runs || [];
        
        // Identificar nodo activo (el que está en estado 'running')
        const activeNode = traceArray.find(entry => entry.status === 'running');
        const activeNodeId = activeNode ? (activeNode.nodeId || activeNode.node_id) : null;
        
        set({
          selectedRun: {
            id: run.runId || run.id || run.run_id,
            flowId: run.flowId || run.flow_id,
            status: run.status,
            trace: traceArray,
            error: run.error,
            createdAt: run.created_at || run.started_at || run.createdAt,
            endedAt: run.ended_at || run.endedAt,
          },
          trace: traceArray,
          activeNodeId: activeNodeId,
        });
        
        // Si el run terminó (completed, error, cancelled, timeout), detener polling
        const finalStatuses = ['completed', 'error', 'cancelled', 'timeout'];
        if (finalStatuses.includes(run.status)) {
          console.log('[editorStore] Run terminado, deteniendo polling:', run.status);
          clearInterval(interval);
          set({ pollingInterval: null, activeNodeId: null });
          
          // Recargar runs para actualizar la lista
          const { selectedFlowId } = get();
          if (selectedFlowId) {
            await get().loadRuns(selectedFlowId);
          }
        }
      } catch (error) {
        console.error('[editorStore] Error en polling:', error);
        // Si hay error, detener polling
        clearInterval(interval);
        set({ pollingInterval: null });
      }
    }, 1500); // 1.5 segundos
    
    set({ pollingInterval: interval });
  },

  // Detener polling manualmente
  stopPolling: () => {
    const { pollingInterval } = get();
    if (pollingInterval) {
      clearInterval(pollingInterval);
      set({ pollingInterval: null, activeNodeId: null });
    }
  },

  // Cancelar un run en ejecución
  cancelRun: async (runId) => {
    try {
      await cancelRunService(runId);
      // Detener polling ya que el run fue cancelado
      get().stopPolling();
      // Recargar el run para obtener el estado actualizado
      await get().loadRun(runId);
      return { success: true };
    } catch (error) {
      console.error('Error al cancelar run:', error);
      return { success: false, error: error.message };
    }
  },

  // Helper para navegar a runs con flowId
  navigateToRuns: (flowId) => {
    if (typeof window !== 'undefined' && window.location) {
      window.location.href = `/runs?flowId=${flowId}`;
    }
  },

  loadRun: async (runId) => {
    try {
      const run = await getRunService(runId);
      set({
        selectedRun: run,
        trace: run.trace || [],
      });
      return { success: true, run };
    } catch (error) {
      console.error('Error al cargar run:', error);
      return { success: false, error: error.message };
    }
  },

  rerunFlow: async (runId) => {
    try {
      const result = await rerunFlowService(runId);
      
      // El backend puede retornar trace como node_runs
      const traceArray = result.trace || result.node_runs || [];
      set({
        trace: traceArray,
        selectedRun: {
          id: result.runId || result.id || result.run_id,
          flowId: result.flowId || result.flow_id,
          status: result.status,
          trace: traceArray,
          error: result.error,
          createdAt: result.created_at || result.started_at || new Date().toISOString(),
          endedAt: result.ended_at,
        },
      });

      // Recargar runs si hay flowId
      const { selectedFlowId } = get();
      if (selectedFlowId) {
        await get().loadRuns(selectedFlowId);
      }

      return { success: true, run: result };
    } catch (error) {
      console.error('Error al re-ejecutar flow:', error);
      return { success: false, error: error.message };
    }
  },

  deleteFlow: async (flowId) => {
    try {
      await deleteFlowService(flowId);
      if (get().selectedFlowId === flowId) {
        set({ selectedFlowId: null });
      }
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar flow:', error);
      throw error;
    }
  },

  // Actualizar solo el nombre de un flow
  updateFlowName: async (flowId, newName) => {
    try {
      // El backend requiere el campo 'graph' en el PUT request
      // Necesitamos obtener el graph actual del flow
      let graphData = null;
      
      // Intentar obtener el graph del estado guardado si está disponible
      const { flowSavedStates, nodes, edges, graphId, selectedFlowId } = get();
      const savedState = flowSavedStates[flowId];
      
      if (savedState && savedState.nodes && savedState.edges) {
        // Usar el estado guardado para construir el graph
        graphData = reactFlowToGraphDefinition(savedState.nodes, savedState.edges, savedState.graphId || flowId);
      } else if (selectedFlowId === flowId && nodes && edges) {
        // Si el flow está actualmente cargado, usar los nodes/edges actuales
        graphData = reactFlowToGraphDefinition(nodes, edges, graphId || flowId);
      } else {
        // Si no hay estado guardado ni está cargado, obtener el flow del backend
        try {
          const flow = await getFlowService(flowId);
          graphData = flow.graph_json || flow.graph;
          
          // Si graph_json es un string, parsearlo
          if (typeof graphData === 'string') {
            try {
              graphData = JSON.parse(graphData);
            } catch (parseError) {
              console.error('Error al parsear graph_json:', parseError);
              graphData = null;
            }
          }
          
          // Si no hay graphData, crear uno vacío
          if (!graphData) {
            graphData = {
              id: flowId,
              version: 1,
              start: '',
              nodes: [],
              edges: [],
            };
          }
        } catch (fetchError) {
          console.error('Error al obtener flow para actualizar nombre:', fetchError);
          // Si no se puede obtener el flow, crear un graph vacío
          graphData = {
            id: flowId,
            version: 1,
            start: '',
            nodes: [],
            edges: [],
          };
        }
      }
      
      // Actualizar el nombre incluyendo el graph actual
      const flowData = {
        name: newName,
        graph: graphData,
      };
      
      const updatedFlow = await updateFlowService(flowId, flowData);
      
      // Actualizar el flow en la lista local
      const { flows } = get();
      const updatedFlows = flows.map(flow => {
        const id = flow.id || flow.flow_id;
        if (id === flowId) {
          return {
            ...flow,
            name: newName,
          };
        }
        return flow;
      });
      
      set({ flows: updatedFlows });
      
      return { success: true, flow: updatedFlow };
    } catch (error) {
      console.error('Error al actualizar nombre del flow:', error);
      throw error;
    }
  },

  // Proyectos y Flujos
  loadProjects: async () => {
    try {
      const projects = await getProjectsService();
      set({ projects: Array.isArray(projects) ? projects : [] });
      return { success: true, projects: Array.isArray(projects) ? projects : [] };
    } catch (error) {
      console.error('Error al cargar proyectos:', error);
      set({ projects: [] });
      return { success: true, projects: [] };
    }
  },

  createProject: async (projectData) => {
    try {
      const project = await createProjectService(projectData);
      const projectId = project.id || project.project_id;
      
      // Recargar lista de proyectos
      await get().loadProjects();
      
      // Seleccionar el nuevo proyecto (esto guardará en localStorage y recargará flows/runs)
      await get().selectProject(projectId);
      
      return { success: true, project };
    } catch (error) {
      console.error('Error al crear proyecto:', error);
      return { success: false, error: error.message };
    }
  },

  deleteProject: async (projectId) => {
    try {
      await deleteProjectService(projectId);
      
      // Si el proyecto eliminado era el seleccionado, deseleccionarlo
      if (get().selectedProjectId === projectId) {
        await get().selectProject(null);
      }
      
      // Recargar lista de proyectos
      await get().loadProjects();
      
      return { success: true };
    } catch (error) {
      console.error('Error al eliminar proyecto:', error);
      return { success: false, error: error.message };
    }
  },

  duplicateProject: async (projectId) => {
    try {
      // Obtener el proyecto original
      const originalProject = await getProjectService(projectId);
      
      // Crear nuevo proyecto con nombre duplicado
      const newProject = await createProjectService({
        name: `${originalProject.name} (Copia)`,
        description: originalProject.description,
      });
      
      // TODO: Duplicar flows del proyecto (esto requeriría crear flows en el nuevo proyecto)
      // Por ahora solo creamos el proyecto duplicado
      // const flows = await getProjectFlowsService(projectId);
      // const newProjectId = newProject.id || newProject.project_id;
      
      // Recargar lista de proyectos
      await get().loadProjects();
      
      return { success: true, project: newProject };
    } catch (error) {
      console.error('Error al duplicar proyecto:', error);
      return { success: false, error: error.message };
    }
  },

  exportProject: async (projectId) => {
    try {
      // Obtener el proyecto y sus flows usando /flows con X-Project-Id
      const project = await getProjectService(projectId);
      const flowsList = await getFlowsService(projectId);
      
      // Obtener los flows completos (con graph)
      const flows = [];
      for (const flowItem of flowsList) {
        try {
          const flowId = flowItem.flow_id || flowItem.id;
          const fullFlow = await getFlowService(flowId);
          flows.push({
            id: fullFlow.id || flowId,
            name: fullFlow.name,
            graph: fullFlow.graph,
            graph_version: fullFlow.graph_version,
            contract_version: fullFlow.contract_version,
            created_at: fullFlow.created_at || flowItem.created_at,
          });
        } catch (error) {
          console.error(`Error al obtener flow ${flowItem.flow_id || flowItem.id}:`, error);
          // Continuar con los demás flows aunque uno falle
        }
      }
      
      // Crear objeto de exportación
      const exportData = {
        project: {
          name: project.name,
          description: project.description,
          created_at: project.created_at,
        },
        flows: flows,
        exported_at: new Date().toISOString(),
      };
      
      // Crear blob y descargar
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.name.replace(/[^a-z0-9]/gi, '_')}_export.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Error al exportar proyecto:', error);
      return { success: false, error: error.message };
    }
  },

  exportAllProjects: async () => {
    try {
      const projects = get().projects;
      const exportData = {
        projects: [],
        exported_at: new Date().toISOString(),
      };
      
      // Exportar cada proyecto con sus flows
      for (const project of projects) {
        try {
          const projectData = await getProjectService(project.id);
          const flowsList = await getFlowsService(project.id);
          
          // Obtener los flows completos (con graph)
          const flows = [];
          for (const flowItem of flowsList) {
            try {
              const flowId = flowItem.flow_id || flowItem.id;
              const fullFlow = await getFlowService(flowId);
              flows.push({
                id: fullFlow.id || flowId,
                name: fullFlow.name,
                graph: fullFlow.graph,
                graph_version: fullFlow.graph_version,
                contract_version: fullFlow.contract_version,
                created_at: fullFlow.created_at || flowItem.created_at,
              });
            } catch (error) {
              console.error(`Error al obtener flow ${flowItem.flow_id || flowItem.id}:`, error);
              // Continuar con los demás flows aunque uno falle
            }
          }
          
          exportData.projects.push({
            project: {
              name: projectData.name,
              description: projectData.description,
              created_at: projectData.created_at,
            },
            flows: flows,
          });
        } catch (error) {
          console.error(`Error al exportar proyecto ${project.id}:`, error);
        }
      }
      
      // Crear blob y descargar
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `proyectos_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error) {
      console.error('Error al exportar todos los proyectos:', error);
      return { success: false, error: error.message };
    }
  },

  createFlow: async (flowData) => {
    try {
      // flowData debe incluir projectId
      // Usar saveFlow con null como flowId para crear uno nuevo
      const flow = await saveFlowService(null, {
        name: flowData.name,
        description: flowData.description,
        projectId: flowData.projectId,
        graph: {
          id: `flow_${Date.now()}`,
          version: 1,
          start: '',
          nodes: [],
          edges: [],
        },
      });
      
      // Recargar proyectos para actualizar la lista de flujos
      await get().loadProjects();
      
      return { success: true, flow };
    } catch (error) {
      console.error('Error al crear flujo:', error);
      return { success: false, error: error.message };
    }
  },
}));

