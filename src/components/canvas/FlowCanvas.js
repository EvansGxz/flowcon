// Versión refactorizada de FlowCanvas usando Zustand
// Este archivo será usado para reemplazar FlowCanvas.js

import { useState, useCallback, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
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
import NoProjectState from './NoProjectState';
import ContextMenu from './ContextMenu';
import { applyElkLayout, ELK_PRESETS } from '../../utils/elkLayout';
import { createNodeInstance, migrateNodeIfNeeded, getNodeDefinition } from '../../utils/nodeInstance';
import { NodeStatus } from '../../nodes/definitions/types';
import { ulid } from 'ulid';
import '../../nodes/definitions/registry'; // Cargar definiciones

// Mapeo de nombres de componentes a componentes React
const nodeTypes = {
  webhook_trigger: TriggerNode,
  manual_trigger: TriggerNode,
  trigger_input: TriggerNode, // Nuevo en v1.0.2
  agent_core: AgentNode,
  condition_expr: AgentNode, // TODO: crear componente específico
  memory_kv: AgentNode, // TODO: crear componente específico
  model_llm: AgentNode, // TODO: crear componente específico
  tool_http: ActionNode,
  tool_postgres: ActionNode, // TODO: crear componente específico
  response_chat: ActionNode, // TODO: crear componente específico
  response_end: ActionNode, // Nuevo en v1.0.2
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
  const { workflowId } = useParams();
  const { fitView, screenToFlowPosition } = useReactFlow();
  const nodeInternals = useStore((store) => store.nodeInternals);
  
  // Usar Zustand store
  const {
    nodes,
    edges,
    selectedNodeId,
    selectedProjectId,
    selectedFlowId,
    trace,
    nodeViewMode,
    setNodes,
    setEdges,
    setSelectedNodeId,
    upsertNode,
    loadFlow,
  } = useEditorStore();
  
  // Cargar el workflow cuando cambie el workflowId de la URL
  // Solo cargar si la URL tiene un workflowId diferente al seleccionado
  // Si selectedFlowId ya está establecido (por ejemplo, desde tabs), no forzar carga desde URL
  useEffect(() => {
    if (workflowId && workflowId !== selectedFlowId) {
      // Si el workflowId en la URL es diferente al seleccionado, cargar el flow
      // Esto puede pasar cuando se navega directamente a una URL o cuando se abre un flow desde fuera
      loadFlow(workflowId).catch((error) => {
        // Si el flow no existe (es un nuevo workflow), no hacer nada
        // El canvas se inicializará vacío
        console.log('Workflow no encontrado, inicializando canvas vacío');
      });
    }
  }, [workflowId, selectedFlowId, loadFlow]);
  
  // Actualizar estados de los nodos desde el trace durante la ejecución
  useEffect(() => {
    if (!trace || trace.length === 0) {
      // Si no hay trace, resetear todos los nodos a IDLE
      setNodes((currentNodes) =>
        currentNodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            status: NodeStatus.IDLE,
          },
        }))
      );
      return;
    }

    // Crear un mapa de estados por nodeId desde el trace
    const traceStatusMap = new Map();
    trace.forEach((entry) => {
      const nodeId = entry.nodeId || entry.node_id;
      if (nodeId) {
        // Mapear estados del trace a NodeStatus
        let nodeStatus = NodeStatus.IDLE;
        if (entry.status === 'running') {
          nodeStatus = NodeStatus.RUNNING;
        } else if (entry.status === 'completed' || entry.status === 'success') {
          nodeStatus = NodeStatus.SUCCESS;
        } else if (entry.status === 'error') {
          nodeStatus = NodeStatus.ERROR;
        } else if (entry.status === 'skipped') {
          nodeStatus = NodeStatus.SKIPPED;
        }
        traceStatusMap.set(String(nodeId), nodeStatus);
      }
    });

    // Actualizar nodos que tienen entrada en el trace
    setNodes((currentNodes) =>
      currentNodes.map((node) => {
        const traceStatus = traceStatusMap.get(String(node.id));
        if (traceStatus !== undefined) {
          // Solo actualizar si el estado cambió para evitar renders innecesarios
          if (node.data?.status !== traceStatus) {
            return {
              ...node,
              data: {
                ...node.data,
                status: traceStatus,
              },
            };
          }
        } else {
          // Si el nodo no está en el trace y tenía un estado de ejecución, resetearlo a IDLE
          // Solo resetear si estaba en un estado de ejecución (no IDLE)
          if (node.data?.status && node.data.status !== NodeStatus.IDLE) {
            return {
              ...node,
              data: {
                ...node.data,
                status: NodeStatus.IDLE,
              },
            };
          }
        }
        return node;
      })
    );
  }, [trace, setNodes]);
  
  // Identificar nodo activo desde el trace
  const getActiveNodeId = () => {
    if (!trace || trace.length === 0) return null;
    // Buscar el último nodo con status 'running' o el primero con status diferente a 'completed'/'error'
    const runningNode = trace.find(entry => entry.status === 'running');
    if (runningNode) {
      return runningNode.node_id || runningNode.nodeId;
    }
    return null;
  };
  
  const activeNodeId = getActiveNodeId();

  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [propertiesModalOpen, setPropertiesModalOpen] = useState(false);
  const [selectedNodeForProperties, setSelectedNodeForProperties] = useState(null);
  
  // Verificar si hay alguna modal abierta (desde TopRightControls)
  const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);
  
  // Menú contextual
  const [contextMenu, setContextMenu] = useState({ isOpen: false, position: null });
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

  // Función para aplicar layout manualmente (solo desde el botón)
  const applyAutoLayout = useCallback(async () => {
    if (isApplyingLayout.current) return;
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

      // Ajustar spacing según el modo de vista
      let layoutOptions = { ...ELK_PRESETS.N8N_WORKFLOW };
      
      if (nodeViewMode === 'icon') {
        // Modo "Solo Icono": distancia muy reducida (20/30)
        layoutOptions = {
          ...layoutOptions,
          nodeSpacing: '20',   // Mitad de 40
          layerSpacing: '30',  // Mitad de 60
        };
      } else {
        // Modos "Completo" e "Informativo": reducir un tercio (80/133)
        layoutOptions = {
          ...layoutOptions,
          nodeSpacing: '80',   // 120 - (120/3) = 80
          layerSpacing: '133', // 200 - (200/3) ≈ 133
        };
      }

      const layoutedNodes = await applyElkLayout(
        nodes,
        edges,
        layoutOptions,
        getInternal
      );

      setNodes(layoutedNodes);
      setTimeout(() => fitView({ duration: 300, padding: 0.2 }), 50);
    } catch (error) {
      console.error('Error al aplicar layout:', error);
    } finally {
      isApplyingLayout.current = false;
    }
  }, [nodes, edges, nodeInternals, nodeViewMode, setNodes, fitView]);

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

  // Auto-layout deshabilitado automáticamente - solo se aplica manualmente desde el botón
  // Se mantiene el efecto para tracking pero sin aplicar layout automático
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      previousEdgesLength.current = edges.length;
      return;
    }

    previousEdgesLength.current = edges.length;
  }, [edges.length]);

  // Auto-layout cuando cambia el modo de vista DESHABILITADO
  // El layout solo se aplica manualmente desde el botón
  // El spacing se ajustará la próxima vez que se presione el botón de Auto Layout

  // Colores adaptados al tema usando variables CSS
  const backgroundColor = 'var(--background-pattern)';
  const minimapMaskColor = 'var(--react-flow-minimap-mask)';
  const minimapBgColor = 'var(--react-flow-minimap-bg)';

  // Bloquear editor si no hay proyecto activo
  if (!selectedProjectId) {
    return (
      <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <NoProjectState />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
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
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={() => setContextMenu({ isOpen: false, position: null })}
        onAddNote={() => {
          // Por ahora solo muestra un mensaje, después se implementará la funcionalidad
          // TODO: Implementar funcionalidad de agregar nota
          console.log('Funcionalidad de agregar nota próximamente');
        }}
      />
      <ReactFlow
        style={{ width: '100%', height: '100%' }}
        nodes={nodes.map(node => ({
          ...node,
          className: activeNodeId === node.id ? 'node-active' : node.className,
          style: activeNodeId === node.id 
            ? { 
                ...node.style, 
                boxShadow: '0 0 0 3px var(--accent-color)',
                border: '2px solid var(--accent-color)',
                zIndex: 1000,
              }
            : node.style,
        }))}
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
        onPaneContextMenu={(event) => {
          event.preventDefault();
          const position = { x: event.clientX, y: event.clientY };
          setContextMenu({ isOpen: true, position });
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
            return def?.color || 'var(--text-secondary)';
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

