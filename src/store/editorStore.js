/**
 * Store Zustand para el editor de grafos
 * Basado en REDMIND_MVP1_Frontend_Semana1.pdf
 */

import { create } from 'zustand';
import { reactFlowToGraphDefinition, graphDefinitionToReactFlow } from '../utils/graphConverter';
import { validateGraph } from '../contracts';

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

export const useEditorStore = create((set, get) => ({
  // Estado
  nodes: [],
  edges: [],
  selectedNodeId: null,
  graphId: 'default',
  nodeViewMode: 'informative', // 'icon' | 'compact' | 'informative'

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

  // Validación local
  validateLocal: () => {
    const { nodes, edges, graphId } = get();
    const graphDefinition = reactFlowToGraphDefinition(nodes, edges, graphId);
    return validateGraph(graphDefinition);
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

      const { nodes, edges } = graphDefinitionToReactFlow(graphDefinition);
      
      // Validar que la conversión fue exitosa
      if (!Array.isArray(nodes) || !Array.isArray(edges)) {
        return { success: false, errors: ['Error al convertir el grafo a formato React Flow'] };
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
      // Importar dinámicamente el ejemplo
      let exampleData;
      if (exampleName === 'hello-agent' || exampleName === 'helloAgent') {
        const module = await import('../examples/helloAgent.json');
        exampleData = module.default || module;
      } else if (exampleName === 'route-intent' || exampleName === 'routeIntent') {
        const module = await import('../examples/routeIntent.json');
        exampleData = module.default || module;
      } else {
        return { success: false, errors: [`Ejemplo desconocido: ${exampleName}`] };
      }

      // Convertir a string JSON y usar importGraph
      const jsonString = JSON.stringify(exampleData, null, 2);
      return get().importGraph(jsonString);
    } catch (error) {
      console.error('Error al cargar ejemplo:', error);
      return { success: false, errors: [`Error al cargar ejemplo: ${error.message}`] };
    }
  },
}));

