// Versión refactorizada de FlowCanvas usando Zustand
// Este archivo será usado para reemplazar FlowCanvas.js

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '../../styles/ReactFlowTheme.css';

import { useEditorStore } from '../../store/editorStore';
import type { ReactFlowNode } from '../../types/reactflow';
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
import type { ReactFlowNodeData } from '../../types/reactflow';
import { ulid } from 'ulid';
import '../../nodes/definitions/registry'; // Cargar definiciones

// Mapeo de nombres de componentes a componentes React
const nodeTypes: NodeTypes = {
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

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

interface ConnectionFilter {
  nodeId: string;
  handleId: string;
  handleType: 'source' | 'target';
}

interface ContextMenuState {
  isOpen: boolean;
  position: { x: number; y: number } | null;
}

interface HandleDoubleClickEvent extends CustomEvent {
  detail: {
    nodeId: string;
    handleId: string;
    handleType: 'source' | 'target';
  };
}

function FlowCanvasInner() {
  const { workflowId } = useParams<{ workflowId?: string }>();
  const { fitView, screenToFlowPosition } = useReactFlow();
  const nodeInternals = useStore((store) => (store as unknown as { nodeInternals?: Map<string, Node> | Record<string, Node> }).nodeInternals);
  
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
  
  // ÚNICO lugar que carga el flow: cuando cambia workflowId en la URL
  // Esta es la única fuente de verdad para cargar flows
  useEffect(() => {
    if (!workflowId) return;
    
    // Cargar el flow cuando cambia el workflowId de la URL
    loadFlow(workflowId).catch((error) => {
      // Si el flow no existe (es un nuevo workflow), no hacer nada
      // El canvas se inicializará vacío
      console.log('Workflow no encontrado, inicializando canvas vacío');
    });
  }, [workflowId, loadFlow]);
  
  // Memorizar nodos y edges para evitar renders intermedios
  // Solo mostrar contenido cuando selectedFlowId coincide con workflowId
  // Esto previene mostrar contenido del flow anterior mientras se carga el nuevo
  const displayNodes = useMemo(() => {
    // Si no hay workflowId, mostrar canvas vacío
    if (!workflowId) {
      return [];
    }
    // Si workflowId no coincide con selectedFlowId, mostrar canvas vacío
    // Esto evita mostrar contenido del flow anterior mientras se carga el nuevo
    if (workflowId !== selectedFlowId) {
      return [];
    }
    // Solo mostrar nodos cuando workflowId y selectedFlowId coinciden
    return nodes;
  }, [nodes, workflowId, selectedFlowId]);
  
  const displayEdges = useMemo(() => {
    // Si no hay workflowId, mostrar canvas vacío
    if (!workflowId) {
      return [];
    }
    // Si workflowId no coincide con selectedFlowId, mostrar canvas vacío
    // Esto evita mostrar contenido del flow anterior mientras se carga el nuevo
    if (workflowId !== selectedFlowId) {
      return [];
    }
    // Solo mostrar edges cuando workflowId y selectedFlowId coinciden
    return edges;
  }, [edges, workflowId, selectedFlowId]);
  
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
    const traceStatusMap = new Map<string, typeof NodeStatus[keyof typeof NodeStatus]>();
    trace.forEach((entry) => {
      const nodeId = entry.nodeId || (entry as unknown as { node_id?: string }).node_id;
      if (nodeId) {
        // Mapear estados del trace a NodeStatus
        let nodeStatus: typeof NodeStatus[keyof typeof NodeStatus] = NodeStatus.IDLE;
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
  const getActiveNodeId = (): string | null => {
    if (!trace || trace.length === 0) return null;
    // Buscar el último nodo con status 'running' o el primero con status diferente a 'completed'/'error'
    const runningNode = trace.find(entry => entry.status === 'running');
    if (runningNode) {
      return (runningNode as unknown as { node_id?: string }).node_id || runningNode.nodeId || null;
    }
    return null;
  };
  
  const activeNodeId = getActiveNodeId();

  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [propertiesModalOpen, setPropertiesModalOpen] = useState(false);
  const [selectedNodeForProperties, setSelectedNodeForProperties] = useState<string | null>(null);
  const [connectionFilter, setConnectionFilter] = useState<ConnectionFilter | null>(null);
  
  // Verificar si hay alguna modal abierta (desde TopRightControls)
  const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);
  
  // Menú contextual
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ isOpen: false, position: null });
  const previousEdgesLength = useRef(edges.length);
  const isApplyingLayout = useRef(false);
  const isInitialMount = useRef(true);

  // Listener para doble clic en handles (estilo BaseNode)
  useEffect(() => {
    const handleDoubleClick = (event: Event) => {
      const customEvent = event as HandleDoubleClickEvent;
      const { nodeId, handleId, handleType } = customEvent.detail;
      setConnectionFilter({ nodeId, handleId, handleType });
      setIsPaletteOpen(true);
    };

    window.addEventListener('handleDoubleClick', handleDoubleClick);
    return () => {
      window.removeEventListener('handleDoubleClick', handleDoubleClick);
    };
  }, []);

  // Función para agregar un nodo desde la paleta
  const handleAddNode = useCallback(
    (typeId: string) => {
      const viewport = screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      const newNode = createNodeInstance(typeId, viewport);
      upsertNode(newNode);
      
      // Si hay un filtro de conexión, conectar automáticamente
      if (connectionFilter) {
        const { nodeId, handleId, handleType } = connectionFilter;
        setTimeout(() => {
          const newEdge: Edge = {
            id: `e_${ulid()}`,
            source: handleType === 'source' ? nodeId : newNode.id,
            target: handleType === 'target' ? nodeId : newNode.id,
            sourceHandle: handleType === 'source' ? handleId : 'out',
            targetHandle: handleType === 'target' ? handleId : 'in',
            type: 'custom',
            animated: true,
          };
          setEdges((eds) => addEdge(newEdge, eds));
        }, 100);
        setConnectionFilter(null);
      }
      
      setIsPaletteOpen(false);
    },
    [screenToFlowPosition, upsertNode, connectionFilter, setEdges]
  );

  // Función para aplicar layout manualmente (solo desde el botón)
  const applyAutoLayout = useCallback(async () => {
    if (isApplyingLayout.current) return;
    if (nodes.length === 0) return;

    isApplyingLayout.current = true;

    try {
      const getInternal = (id: string): Node<ReactFlowNodeData> | null => {
        if (!nodeInternals || typeof nodeInternals !== 'object') return null;
        if (typeof (nodeInternals as Map<string, Node>).get === 'function') {
          return (nodeInternals as Map<string, Node>).get(id) as Node<ReactFlowNodeData> | null;
        }
        return (nodeInternals as Record<string, Node>)[id] as Node<ReactFlowNodeData> | null;
      };

      // Ajustar spacing según el modo de vista
      let layoutOptions: { algorithm?: string; direction?: 'RIGHT' | 'LEFT' | 'DOWN' | 'UP'; nodeSpacing?: string | number; layerSpacing?: string | number; tidyLinear?: boolean; grid?: number } = { 
        ...ELK_PRESETS.N8N_WORKFLOW,
        direction: ELK_PRESETS.N8N_WORKFLOW.direction as 'RIGHT' | 'LEFT' | 'DOWN' | 'UP' | undefined
      };
      
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
    (changes: NodeChange[]) => {
      if (isApplyingLayout.current) return;

      setNodes((nds) => {
        const updated = applyNodeChanges(changes, nds);
        // Migrar nodos si es necesario
        return updated.map((node) => migrateNodeIfNeeded(node as ReactFlowNode));
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
    (changes: EdgeChange[]) => {
      if (isApplyingLayout.current) return;
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    [setEdges]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge: Edge = {
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
        onClose={() => {
          setIsPaletteOpen(false);
          setConnectionFilter(null);
        }}
        onAddNode={handleAddNode}
        connectionFilter={connectionFilter}
      />
      <PropertiesPanel
        isOpen={propertiesModalOpen}
        onClose={() => {
          setPropertiesModalOpen(false);
          setSelectedNodeForProperties(null);
        }}
        nodeId={selectedNodeForProperties}
      />
      {displayNodes.length === 0 && !isAnyModalOpen && !isPaletteOpen && !propertiesModalOpen && (
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
        nodes={displayNodes.map(node => ({
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
        edges={displayEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(event, node) => {
          // Solo seleccionar si el clic NO viene de un handle wrapper o del handle mismo
          const target = event.target as HTMLElement;
          const isHandleClick = target.closest('[data-handle-wrapper]') !== null || 
                               target.closest('[data-handleid]') !== null ||
                               target.hasAttribute('data-handleid');
          
          if (!isHandleClick) {
            setSelectedNodeId(node.id);
          }
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
          nodeColor={(node: Node) => {
            const def = getNodeDefinition(node as Node<ReactFlowNodeData>);
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
