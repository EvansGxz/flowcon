// Versión refactorizada de FlowCanvas usando Zustand
// Este archivo será usado para reemplazar FlowCanvas.js

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Background,
  MiniMap,
  useReactFlow,
  useStore,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '../../styles/ReactFlowTheme.css';

import { useTheme } from '../../context/ThemeContext';
import { useEditorStore } from '../../store/editorStore';
import TriggerNode from '../../nodes/TriggerNode';
import AgentNode from '../../nodes/AgentNode';
import ActionNode from '../../nodes/ActionNode';
import CustomEdge from '../../edges/CustomEdge';
import CustomControls from '../controls/CustomControls';
import TopRightControls from '../controls/TopRightControls';
import NodePalette from '../palette/NodePalette';
import PropertiesPanel from '../modals/PropertiesPanel';
import EmptyState from './EmptyState';
import { applyElkLayout, ELK_PRESETS } from '../../utils/elkLayout';
import { createNodeInstance, migrateNodeIfNeeded, getNodeDefinition } from '../../utils/nodeInstance';
import { ulid } from 'ulid';
import '../../nodes/definitions/registry'; // Cargar definiciones

// Mapeo de nombres de componentes a componentes React
const nodeTypes = {
  webhook_trigger: TriggerNode,
  manual_trigger: TriggerNode,
  agent_core: AgentNode,
  condition_expr: AgentNode, // TODO: crear componente específico
  memory_kv: AgentNode, // TODO: crear componente específico
  model_llm: AgentNode, // TODO: crear componente específico
  tool_http: ActionNode,
  tool_postgres: ActionNode, // TODO: crear componente específico
  response_chat: ActionNode, // TODO: crear componente específico
  http_request: ActionNode,
  // Mantener compatibilidad con nombres antiguos
  trigger: TriggerNode,
  agent: AgentNode,
  action: ActionNode,
};

const edgeTypes = {
  custom: CustomEdge,
};

function FlowCanvasInner() {
  const { isDark } = useTheme();
  const { fitView, screenToFlowPosition } = useReactFlow();
  const nodeInternals = useStore((store) => store.nodeInternals);
  
  // Usar Zustand store
  const {
    nodes,
    edges,
    selectedNodeId,
    setNodes,
    setEdges,
    setSelectedNodeId,
    upsertNode,
  } = useEditorStore();

  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [propertiesModalOpen, setPropertiesModalOpen] = useState(false);
  const [selectedNodeForProperties, setSelectedNodeForProperties] = useState(null);
  
  // Verificar si hay alguna modal abierta (desde TopRightControls)
  const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);
  const autoLayoutEnabled = useRef(true);
  const layoutTimeoutRef = useRef(null);
  const previousEdgesLength = useRef(edges.length);
  const isApplyingLayout = useRef(false);
  const isInitialMount = useRef(true);

  // Función para agregar un nodo desde la paleta
  const handleAddNode = useCallback(
    (typeId) => {
      const viewport = screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      const newNode = createNodeInstance(typeId, viewport);
      upsertNode(newNode);
      setIsPaletteOpen(false);
    },
    [screenToFlowPosition, upsertNode]
  );

  // Función para aplicar layout automáticamente
  const applyAutoLayout = useCallback(async () => {
    if (!autoLayoutEnabled.current || isApplyingLayout.current) return;
    if (nodes.length === 0) return;

    isApplyingLayout.current = true;

    try {
      const getInternal = (id) => {
        if (!nodeInternals || typeof nodeInternals !== 'object') return null;
        if (typeof nodeInternals.get === 'function') {
          return nodeInternals.get(id) || null;
        }
        return nodeInternals[id] || null;
      };

      const layoutedNodes = await applyElkLayout(
        nodes,
        edges,
        ELK_PRESETS.N8N_WORKFLOW,
        getInternal
      );

      setNodes(layoutedNodes);
      setTimeout(() => fitView({ duration: 300, padding: 0.2 }), 50);
    } catch (error) {
      console.error('Error al aplicar layout:', error);
    } finally {
      isApplyingLayout.current = false;
    }
  }, [nodes, edges, nodeInternals, setNodes, fitView]);

  const onNodesChange = useCallback(
    (changes) => {
      if (isApplyingLayout.current) return;

      setNodes((nds) => {
        const updated = applyNodeChanges(changes, nds);
        // Migrar nodos si es necesario
        return updated.map((node) => migrateNodeIfNeeded(node));
      });

      // Manejar selección de nodos
      for (const change of changes) {
        if (change.type === 'select' && change.selected) {
          setSelectedNodeId(change.id);
        } else if (change.type === 'select' && !change.selected) {
          if (selectedNodeId === change.id) {
            setSelectedNodeId(null);
          }
        }
        // Manejar doble clic para abrir propiedades
        if (change.type === 'position' && change.dragging === false) {
          // Esto se activa cuando se suelta el mouse después de hacer doble clic
        }
      }
    },
    [setNodes, setSelectedNodeId, selectedNodeId]
  );

  const onEdgesChange = useCallback(
    (changes) => {
      if (isApplyingLayout.current) return;
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [setEdges]
  );

  const onConnect = useCallback(
    (params) => {
      const newEdge = {
        ...params,
        id: `e_${ulid()}`, // Edge ID con prefijo "e_" usando ULID
        type: 'custom',
        animated: true,
        sourceHandle: params.sourceHandle ?? 'out',
        targetHandle: params.targetHandle ?? 'in',
      };
      const updatedEdges = addEdge(newEdge, edges);
      setEdges(updatedEdges);
    },
    [edges, setEdges]
  );

  // Auto-layout cuando se agregan edges (después del mount inicial)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      previousEdgesLength.current = edges.length;
      return;
    }

    const currentEdgesLength = edges.length;
    if (currentEdgesLength > previousEdgesLength.current && autoLayoutEnabled.current) {
      if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
      }
      layoutTimeoutRef.current = setTimeout(() => {
        if (!isApplyingLayout.current) {
          applyAutoLayout();
        }
      }, 500);
    }

    previousEdgesLength.current = currentEdgesLength;

    return () => {
      if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
      }
    };
  }, [edges.length, applyAutoLayout]);

  // Colores adaptados al tema
  const { theme } = useTheme();
  const backgroundColor = isDark ? '#4b5563' : '#aaa';
  const minimapMaskColor = isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)';
  const minimapBgColor = theme === 'light' ? '#ffffff' : theme === 'abyss' ? '#1e293b' : '#171717';

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <NodePalette
        isOpen={isPaletteOpen}
        onClose={() => setIsPaletteOpen(false)}
        onAddNode={handleAddNode}
      />
      <PropertiesPanel
        isOpen={propertiesModalOpen}
        onClose={() => {
          setPropertiesModalOpen(false);
          setSelectedNodeForProperties(null);
        }}
        nodeId={selectedNodeForProperties}
      />
      {nodes.length === 0 && !isAnyModalOpen && !isPaletteOpen && !propertiesModalOpen && (
        <EmptyState onAddNode={() => setIsPaletteOpen(true)} />
      )}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(event, node) => {
          // Manejar clic simple para selección
          setSelectedNodeId(node.id);
        }}
        onNodeDoubleClick={(event, node) => {
          console.log('Double click on node:', node.id, node);
          event.stopPropagation();
          setSelectedNodeForProperties(node.id);
          setPropertiesModalOpen(true);
          console.log('Modal state after set:', { 
            selectedNodeForProperties: node.id, 
            propertiesModalOpen: true 
          });
        }}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Background color={backgroundColor} gap={16} />
        <CustomControls onLayout={applyAutoLayout} />
        <TopRightControls 
          onAddNode={() => setIsPaletteOpen(true)}
          onModalStateChange={setIsAnyModalOpen}
        />
        <MiniMap
          nodeColor={(node) => {
            const def = getNodeDefinition(node);
            return def?.color || (isDark ? '#64748b' : '#94a3b8');
          }}
          maskColor={minimapMaskColor}
          style={{
            backgroundColor: minimapBgColor,
          }}
        />
      </ReactFlow>
    </div>
  );
}

function FlowCanvas() {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner />
    </ReactFlowProvider>
  );
}

export default FlowCanvas;

