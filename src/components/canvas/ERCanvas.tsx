import { useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Background,
  MiniMap,
  useReactFlow,
  type NodeChange,
  type EdgeChange,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import '../../styles/ReactFlowTheme.css';

import EntityNode from '../../nodes/db/EntityNode';
import CustomEdge from '../../edges/CustomEdge';
import CustomControls from '../controls/CustomControls';
import ERTopRightControls from '../controls/ERTopRightControls';
import EREmptyState from './EREmptyState';
import DatabaseHeader from '../header/DatabaseHeader';
import NotificationToast, { type Notification, type NotificationType } from '../notifications/NotificationToast';
import type { EntityNodeData } from '../../types/database';
import type { Node, Edge } from '@xyflow/react';
import { areDataTypesCompatible, getDataTypeCompatibilityMessage } from '../../utils/dataTypeValidator';
import { ulid } from 'ulid';

const nodeTypes: NodeTypes = {
  entity: EntityNode,
};

const edgeTypes: EdgeTypes = {
  custom: CustomEdge,
};

function ERCanvasInner() {
  const { fitView, screenToFlowPosition } = useReactFlow();
  const [nodes, setNodes] = useState<Node<EntityNodeData>[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [selectedDatabase, setSelectedDatabase] = useState<string>('');
  const [databases] = useState<string[]>([]); // TODO: Implementar gestión de databases

  const showNotificationToast = useCallback((message: string, type: NotificationType, duration?: number) => {
    const id = `notif_${ulid()}`;
    setNotification({
      id,
      message,
      type,
      duration,
    });
    // Auto-cerrar después de la duración
    if (duration) {
      setTimeout(() => {
        setNotification(null);
      }, duration);
    }
  }, []);

  const validateExistingRelations = useCallback((updatedNodes: any[], currentEdges: any[]) => {
    // Validar todas las relaciones existentes con los nuevos tipos de datos
    const invalidEdges: string[] = [];
    
    currentEdges.forEach(edge => {
      if (!edge.sourceHandle || !edge.targetHandle) return;
      
      const sourceAttrId = edge.sourceHandle.replace('attr_', '');
      const targetAttrId = edge.targetHandle.replace('attr_', '');
      
      const sourceNode = updatedNodes.find(n => n.id === edge.source);
      const targetNode = updatedNodes.find(n => n.id === edge.target);
      
      if (!sourceNode || !targetNode) return;
      
      const sourceData = sourceNode.data as EntityNodeData;
      const targetData = targetNode.data as EntityNodeData;
      
      const sourceAttribute = sourceData.attributes?.find(attr => attr.id === sourceAttrId);
      const targetAttribute = targetData.attributes?.find(attr => attr.id === targetAttrId);
      
      if (!sourceAttribute || !targetAttribute) return;
      
      // Validar compatibilidad
      const compatibility = areDataTypesCompatible(sourceAttribute.dataType, targetAttribute.dataType);
      
      if (!compatibility.compatible) {
        invalidEdges.push(edge.id);
        const message = getDataTypeCompatibilityMessage(
          sourceAttribute.dataType,
          targetAttribute.dataType,
          `${sourceData.entityName}.${sourceAttribute.name}`,
          `${targetData.entityName}.${targetAttribute.name}`
        );
        showNotificationToast(
          `Relación eliminada: ${message.message}`,
          'error',
          7000
        );
      } else if (compatibility.reason) {
        // Mostrar advertencia si hay cambio de compatibilidad
        const message = getDataTypeCompatibilityMessage(
          sourceAttribute.dataType,
          targetAttribute.dataType,
          `${sourceData.entityName}.${sourceAttribute.name}`,
          `${targetData.entityName}.${targetAttribute.name}`
        );
        showNotificationToast(message.message, 'warning', 6000);
      }
    });
    
    // Eliminar relaciones incompatibles
    if (invalidEdges.length > 0) {
      setEdges((eds) => eds.filter(e => !invalidEdges.includes(e.id)));
    }
  }, [showNotificationToast]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes((nds) => {
        const updated = applyNodeChanges(changes, nds) as Node<EntityNodeData>[];
        // Validar relaciones existentes cuando cambian los nodos (especialmente tipos de datos)
        // Usar setTimeout para asegurar que los nodos estén actualizados antes de validar
        setTimeout(() => {
          setEdges((currentEdges) => {
            validateExistingRelations(updated, currentEdges);
            return currentEdges;
          });
        }, 0);
        
        return updated;
      });
    },
    [validateExistingRelations]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges((eds) => applyEdgeChanges(changes, eds));
    },
    []
  );

  const onConnect = useCallback(
    (params: Connection) => {
      // Validar tipos de datos antes de crear la conexión
      if (!params.sourceHandle || !params.targetHandle) {
        showNotificationToast('Error: No se puede conectar sin especificar los handles de origen y destino', 'error', 5000);
        return;
      }

      // Extraer el ID del atributo del handle (formato: attr_<attributeId>)
      const sourceAttrId = params.sourceHandle.replace('attr_', '');
      const targetAttrId = params.targetHandle.replace('attr_', '');

      // Buscar los nodos source y target
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);

      if (!sourceNode || !targetNode) {
        showNotificationToast('Error: No se encontraron los nodos de origen o destino', 'error', 5000);
        return;
      }

      const sourceData = sourceNode.data as EntityNodeData;
      const targetData = targetNode.data as EntityNodeData;

      // Buscar los atributos específicos
      const sourceAttribute = sourceData.attributes?.find(attr => attr.id === sourceAttrId);
      const targetAttribute = targetData.attributes?.find(attr => attr.id === targetAttrId);

      if (!sourceAttribute || !targetAttribute) {
        showNotificationToast('Error: No se encontraron los atributos especificados', 'error', 5000);
        return;
      }

      // Validar compatibilidad de tipos
      const compatibility = areDataTypesCompatible(sourceAttribute.dataType, targetAttribute.dataType);
      
      if (!compatibility.compatible) {
        // Error: tipos incompatibles
        const message = getDataTypeCompatibilityMessage(
          sourceAttribute.dataType,
          targetAttribute.dataType,
          `${sourceData.entityName}.${sourceAttribute.name}`,
          `${targetData.entityName}.${targetAttribute.name}`
        );
        showNotificationToast(message.message, 'error', 7000);
        return; // No crear la conexión
      }

      // Si hay advertencia pero es compatible, mostrar warning pero permitir la conexión
      if (compatibility.reason) {
        const message = getDataTypeCompatibilityMessage(
          sourceAttribute.dataType,
          targetAttribute.dataType,
          `${sourceData.entityName}.${sourceAttribute.name}`,
          `${targetData.entityName}.${targetAttribute.name}`
        );
        showNotificationToast(message.message, 'warning', 6000);
      } else {
        // Tipos completamente compatibles
        showNotificationToast(
          `Relación creada: ${sourceData.entityName}.${sourceAttribute.name} → ${targetData.entityName}.${targetAttribute.name}`,
          'success',
          3000
        );
      }

      // Crear la conexión
      const newEdge: Edge = {
        ...params,
        id: `e_${ulid()}`,
        type: 'custom',
        animated: true,
        sourceHandle: params.sourceHandle || null,
        targetHandle: params.targetHandle || null,
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [nodes, showNotificationToast]
  );

  const handleAddEntity = useCallback(() => {
    const position = screenToFlowPosition({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    });

    const entityId = `entity_${ulid()}`;
    const newNode: Node<EntityNodeData> = {
      id: entityId,
      type: 'entity',
      position,
      data: {
        type: 'entity',
        entityId,
        entityName: 'Nueva Entidad',
        attributes: [],
        onChange: (updatedData: EntityNodeData) => {
          setNodes((nds) => 
            nds.map(n => 
              n.id === entityId 
                ? { ...n, data: updatedData }
                : n
            )
          );
        },
        onNotification: (message: string, type: 'warning' | 'info') => {
          showNotificationToast(message, type, 5000);
        },
      },
    };

    setNodes((nds) => [...nds, newNode]);
  }, [screenToFlowPosition, showNotificationToast]);

  const handleImport = useCallback((importedNodes: Node<EntityNodeData>[], importedEdges: Edge[]) => {
    setNodes(importedNodes);
    setEdges(importedEdges);
  }, []);

  // Mostrar estado vacío si no hay nodos
  const showEmptyState = nodes.length === 0;

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
      <DatabaseHeader
        nodes={nodes}
        edges={edges}
        onImport={handleImport}
        selectedDatabase={selectedDatabase}
        databases={databases}
        onDatabaseChange={setSelectedDatabase}
      />
      <div style={{ flex: 1, marginTop: '60px', position: 'relative', height: 'calc(100% - 60px)' }}>
      {showEmptyState ? (
        <EREmptyState onAddNode={handleAddEntity} />
      ) : (
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(event, node) => {
            setSelectedNodeId(node.id);
          }}
          onPaneClick={() => setSelectedNodeId(null)}
          onPaneContextMenu={(event) => {
            event.preventDefault();
            const mouseEvent = event as MouseEvent;
            const position = screenToFlowPosition({
              x: mouseEvent.clientX,
              y: mouseEvent.clientY,
            });
            const entityId = `entity_${ulid()}`;
            const newNode: Node<EntityNodeData> = {
              id: entityId,
              type: 'entity',
              position,
              data: {
                type: 'entity',
                entityId,
                entityName: 'Nueva Entidad',
                attributes: [],
                onChange: (updatedData: EntityNodeData) => {
                  setNodes((nds) => 
                    nds.map(n => 
                      n.id === entityId 
                        ? { ...n, data: updatedData }
                        : n
                    )
                  );
                },
                onNotification: (message: string, type: 'warning' | 'info') => {
                  showNotificationToast(message, type, 5000);
                },
              },
            };
            setNodes((nds) => [...nds, newNode]);
          }}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
        >
          <Background color="var(--bg-secondary)" gap={16} />
          <CustomControls onLayout={async () => {}} />
          <ERTopRightControls onAddTable={handleAddEntity} />
          <MiniMap
            nodeColor="var(--accent-color)"
            maskColor="rgba(0, 0, 0, 0.1)"
            style={{
              backgroundColor: 'var(--bg-primary)',
            }}
          />
        </ReactFlow>
        )}
        <NotificationToast
          notification={notification}
          onClose={(id) => {
            if (notification?.id === id) {
              setNotification(null);
            }
          }}
        />
      </div>
    </div>
  );
}

function ERCanvas() {
  return (
    <ReactFlowProvider>
      <ERCanvasInner />
    </ReactFlowProvider>
  );
}

export default ERCanvas;
