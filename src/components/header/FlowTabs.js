import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import { getFlow as getFlowService } from '../../services/flowsService';
import './FlowTabs.css';

const FlowTabs = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Extraer workflowId de la URL manualmente ya que FlowTabs está fuera de la ruta /workflow/:workflowId
  const workflowIdMatch = location.pathname.match(/\/workflow\/([^/]+)/);
  const workflowId = workflowIdMatch ? workflowIdMatch[1] : null;
  const {
    flows,
    selectedFlowId,
    selectedProjectId,
    nodes,
    edges,
    loadFlow,
    setSelectedFlowId,
    openTabs,
    setOpenTabs,
    checkFlowHasUnsavedChanges,
    checkFlowHasErrors,
    updateFlowName,
    loadFlows,
  } = useEditorStore();

  const tabsContainerRef = useRef(null);
  const [editingTabId, setEditingTabId] = useState(null);
  const [editingName, setEditingName] = useState('');
  const editInputRef = useRef(null);
  const previousSelectedFlowIdRef = useRef(null);

  // Agregar el tab cuando hay un workflowId en la URL (acceso directo o refresh)
  // Este efecto tiene prioridad y se ejecuta primero para asegurar que el tab esté presente
  useEffect(() => {
    const addTabFromUrl = async () => {
      if (workflowId) {
        console.log('[FlowTabs] workflowId detectado en URL:', workflowId);
        const currentTabs = useEditorStore.getState().openTabs;
        console.log('[FlowTabs] Tabs actuales:', currentTabs);
        
        // Si hay un workflowId en la URL y no está en los tabs, agregarlo
        if (!currentTabs.includes(workflowId)) {
          console.log('[FlowTabs] Tab no existe, verificando si el flow está en la lista...');
          
          // Verificar si el flow está en el array flows para obtener el nombre
          const { flows } = useEditorStore.getState();
          console.log('[FlowTabs] Flows en store:', flows.length);
          const flowInList = flows.find(f => (f.id || f.flow_id) === workflowId);
          
          if (flowInList) {
            console.log('[FlowTabs] Flow encontrado en lista:', flowInList.name || flowInList.id);
          } else {
            console.log('[FlowTabs] Flow NO está en la lista, haciendo fetch para obtener nombre...');
            
            // Si el flow no está en la lista, hacer fetch para obtener el nombre
            try {
              const flow = await getFlowService(workflowId);
              console.log('[FlowTabs] Flow obtenido del backend:', flow.name || flow.id);
              
              // Actualizar el array flows con el flow obtenido
              const { flows: currentFlows } = useEditorStore.getState();
              // Verificar si el flow ya fue agregado (por si loadFlows se ejecutó mientras tanto)
              const alreadyExists = currentFlows.find(f => (f.id || f.flow_id) === workflowId);
              
              if (!alreadyExists && flow) {
                console.log('[FlowTabs] Agregando flow al array flows con nombre:', flow.name || `Flow ${workflowId}`);
                // Agregar el flow al array para que tenga el nombre disponible
                useEditorStore.setState({
                  flows: [...currentFlows, { id: workflowId, name: flow.name || `Flow ${workflowId}` }]
                });
              } else if (alreadyExists) {
                console.log('[FlowTabs] Flow ya fue agregado mientras se hacía el fetch');
              }
            } catch (error) {
              // Si hay error al obtener el flow (404 = flow nuevo que aún no existe),
              // agregar el tab de todas formas con nombre por defecto
              // El nombre se mostrará como "Flow {id}" por defecto
              if (error.status === 404 || error.message?.includes('not found') || error.message?.includes('Not found')) {
                console.log('[FlowTabs] Flow nuevo (aún no guardado), usando nombre por defecto');
              } else {
                console.log('[FlowTabs] Error al obtener flow, usando nombre por defecto:', error.message || error);
              }
            }
          }
          
          // Agregar el tab
          const updatedTabs = useEditorStore.getState().openTabs;
          if (!updatedTabs.includes(workflowId)) {
            console.log('[FlowTabs] Agregando tab a openTabs:', workflowId);
            setOpenTabs([...updatedTabs, workflowId]);
          } else {
            console.log('[FlowTabs] Tab ya existe en openTabs (fue agregado mientras tanto)');
          }
          
          // Actualizar el ref para indicar que hay un flow activo
          // Esto es importante para que el segundo useEffect no lo quite
          previousSelectedFlowIdRef.current = workflowId;
          console.log('[FlowTabs] Ref actualizado con workflowId:', workflowId);
        } else {
          console.log('[FlowTabs] Tab ya existe en openTabs, no se agrega');
        }
      } else {
        console.log('[FlowTabs] No hay workflowId en la URL');
      }
    };
    
    addTabFromUrl();
  }, [workflowId, setOpenTabs]);

  // Asegurar que el flow seleccionado esté en las tabs abiertas
  // Este efecto se ejecuta después y sincroniza selectedFlowId con los tabs
  useEffect(() => {
    if (selectedFlowId) {
      // Usar el estado actual del store en lugar de la prop para evitar loops
      const currentTabs = useEditorStore.getState().openTabs;
      // Si el flow seleccionado no está en los tabs, agregarlo
      // Siempre agregar si hay un workflowId en la URL que coincide (refresh o acceso directo)
      // O si el ref no es null (hay un flow activo previo)
      const isDirectUrlAccess = workflowId === selectedFlowId;
      const shouldAdd = !currentTabs.includes(selectedFlowId) && 
                       (previousSelectedFlowIdRef.current !== null || isDirectUrlAccess || workflowId);
      
      if (shouldAdd) {
        setOpenTabs([...currentTabs, selectedFlowId]);
      }
      // Actualizar el ref cuando cambia el selectedFlowId
      if (selectedFlowId !== previousSelectedFlowIdRef.current) {
        previousSelectedFlowIdRef.current = selectedFlowId;
      }
    } else if (workflowId) {
      // Si selectedFlowId es null pero hay un workflowId en la URL (durante la carga),
      // asegurar que el tab esté presente
      const currentTabs = useEditorStore.getState().openTabs;
      if (!currentTabs.includes(workflowId)) {
        setOpenTabs([...currentTabs, workflowId]);
        previousSelectedFlowIdRef.current = workflowId;
      }
    }
    // No limpiar el ref cuando selectedFlowId es null aquí
    // El ref se limpia manualmente cuando se cierran todos los tabs
  }, [selectedFlowId, workflowId, setOpenTabs]);

  // Enfocar el input cuando se activa el modo de edición
  useEffect(() => {
    if (editingTabId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingTabId]);

  const handleTabClick = async (flowId) => {
    if (flowId === selectedFlowId || editingTabId === flowId) return;

    // Cargar el flow y navegar a la ruta correspondiente
    const result = await loadFlow(flowId);
    if (result?.success) {
      navigate(`/workflow/${flowId}`);
    }
  };

  const handleTabClose = async (e, flowId) => {
    e.stopPropagation();
    
    const newOpenTabs = openTabs.filter(id => id !== flowId);
    setOpenTabs(newOpenTabs);

    // Si el tab cerrado era el seleccionado, seleccionar otro o navegar al proyecto
    if (flowId === selectedFlowId) {
      if (newOpenTabs.length > 0) {
        // Seleccionar el último tab abierto
        await loadFlow(newOpenTabs[newOpenTabs.length - 1]);
      } else {
        // No hay tabs abiertos, limpiar todo y navegar a la página del proyecto
        // Limpiar el ref primero para evitar que el useEffect vuelva a agregar el tab
        previousSelectedFlowIdRef.current = null;
        setSelectedFlowId(null);
        useEditorStore.getState().setNodes([]);
        useEditorStore.getState().setEdges([]);
        useEditorStore.getState().setGraphId('default');
        if (selectedProjectId) {
          navigate(`/projects/${selectedProjectId}/flows`);
        }
      }
    }
  };


  const handleTabDoubleClick = (e, flowId, currentName) => {
    e.stopPropagation();
    setEditingTabId(flowId);
    setEditingName(currentName);
  };

  const handleEditNameChange = (e) => {
    setEditingName(e.target.value);
  };

  const handleEditNameKeyDown = async (e, flowId) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await saveFlowName(flowId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  const handleEditNameBlur = async (flowId) => {
    await saveFlowName(flowId);
  };

  const saveFlowName = async (flowId) => {
    if (!editingName.trim()) {
      // Si el nombre está vacío, cancelar la edición
      cancelEdit();
      return;
    }

    try {
      await updateFlowName(flowId, editingName.trim());
      // Recargar flows para actualizar el nombre en la lista
      await loadFlows();
      setEditingTabId(null);
      setEditingName('');
    } catch (error) {
      console.error('Error al actualizar nombre del flow:', error);
      // Mantener el modo de edición si hay error
    }
  };

  const cancelEdit = () => {
    setEditingTabId(null);
    setEditingName('');
  };

  // Filtrar flows del proyecto actual
  // NOTA: El backend ya filtra los flows por el header X-Project-Id, 
  // por lo que todos los flows en el array ya pertenecen al proyecto seleccionado
  // No necesitamos filtrar por project_id aquí
  const projectFlows = flows;

  // Obtener tabs abiertas con información completa
  const tabsData = openTabs
    .map(flowId => {
      const flow = projectFlows.find(f => (f.id || f.flow_id) === flowId);
      if (!flow) return null;
      
      // Solo mostrar modificaciones no guardadas si el flow está activo y hay cambios reales
      const isActive = flowId === selectedFlowId;
      const hasUnsavedChanges = isActive ? checkFlowHasUnsavedChanges(flowId, nodes, edges) : false;
      
      // Solo mostrar errores si el flow se ejecutó (tiene errores registrados)
      const hasErrors = checkFlowHasErrors(flowId);
      
      return {
        id: flowId,
        name: flow.name || `Flow ${flowId}`,
        hasUnsavedChanges,
        hasErrors,
        isActive,
      };
    })
    .filter(Boolean);

  // Si no hay proyecto seleccionado, no mostrar tabs
  if (!selectedProjectId || projectFlows.length === 0) {
    return null;
  }

  return (
    <div className="flow-tabs-container" ref={tabsContainerRef}>
      <div className="flow-tabs-scroll">
        {tabsData.map((tab) => (
          <div
            key={tab.id}
            className={`flow-tab ${tab.isActive ? 'active' : ''} ${tab.hasErrors ? 'has-errors' : ''} ${editingTabId === tab.id ? 'editing' : ''}`}
            onClick={() => {
              if (editingTabId !== tab.id) {
                handleTabClick(tab.id);
              }
            }}
            onDoubleClick={(e) => handleTabDoubleClick(e, tab.id, tab.name)}
            title={tab.name}
          >
            {editingTabId === tab.id ? (
              <input
                ref={editInputRef}
                type="text"
                className="flow-tab-name-input"
                value={editingName}
                onChange={handleEditNameChange}
                onKeyDown={(e) => handleEditNameKeyDown(e, tab.id)}
                onBlur={() => handleEditNameBlur(tab.id)}
                onClick={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="flow-tab-name">{tab.name}</span>
            )}
            {tab.hasUnsavedChanges && (
              <span className="flow-tab-dot" title="Modificaciones no guardadas" />
            )}
            {tab.hasErrors && (
              <span className="flow-tab-error-indicator" title="Errores de validación" />
            )}
            <button
              className="flow-tab-close"
              onClick={(e) => handleTabClose(e, tab.id)}
              aria-label="Cerrar tab"
              title="Cerrar tab"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FlowTabs;
