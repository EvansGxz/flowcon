import { useEffect, useRef, useState, KeyboardEvent, ChangeEvent, MouseEvent } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import './FlowTabs.css';

interface TabData {
  id: string;
  name: string;
  isActive: boolean;
  hasUnsavedChanges: boolean;
  hasErrors: boolean;
}

const FlowTabs = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Source of truth del tab activo: la URL
  const workflowIdMatch = location.pathname.match(/\/workflow\/([^/]+)/);
  const activeWorkflowId = workflowIdMatch ? workflowIdMatch[1] : null;

  const {
    flows,
    selectedProjectId,
    openTabs,
    setOpenTabs,
    setSelectedFlowId,
    nodes,
    edges,
    checkFlowHasUnsavedChanges,
    checkFlowHasErrors,
    updateFlowName,
    loadFlows,
  } = useEditorStore();

  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  // 1) Agregar tab desde URL (refresh/acceso directo)
  // Esta es la única fuente de verdad para agregar tabs
  useEffect(() => {
    if (!activeWorkflowId) return;

    const currentTabs = useEditorStore.getState().openTabs;
    if (!currentTabs.includes(activeWorkflowId)) {
      setOpenTabs([...currentTabs, activeWorkflowId]);
    }

    // Mantener selectedFlowId alineado con la URL (sin loops raros)
    const { selectedFlowId } = useEditorStore.getState();
    if (selectedFlowId !== activeWorkflowId) {
      setSelectedFlowId(activeWorkflowId);
    }
  }, [activeWorkflowId, setOpenTabs, setSelectedFlowId]);

  // Enfocar input al editar
  useEffect(() => {
    if (editingTabId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingTabId]);

  const handleTabClick = (flowId: string) => {
    if (flowId === activeWorkflowId || editingTabId === flowId) return;
    // IMPORTANTE: no cargar aquí, solo navegar
    navigate(`/workflow/${flowId}`);
  };

  const handleTabClose = (e: MouseEvent<HTMLButtonElement>, flowId: string) => {
    e.stopPropagation();

    const currentTabs = useEditorStore.getState().openTabs;
    const closingIndex = currentTabs.indexOf(flowId);
    const nextTabs = currentTabs.filter((id) => id !== flowId);

    setOpenTabs(nextTabs);

    const isClosingActive = flowId === activeWorkflowId;

    if (!isClosingActive) return;

    if (nextTabs.length > 0) {
      // Elige tab "vecino" (izquierda si existe; si no, el último)
      const nextIndex = Math.max(0, closingIndex - 1);
      const nextId = nextTabs[nextIndex] ?? nextTabs[nextTabs.length - 1];
      navigate(`/workflow/${nextId}`, { replace: true });
      return;
    }

    // Cerraste el último tab
    setSelectedFlowId(null);
    useEditorStore.getState().setNodes([]);
    useEditorStore.getState().setEdges([]);
    useEditorStore.getState().setGraphId('default');

    if (selectedProjectId) {
      navigate(`/projects/${selectedProjectId}/flows`, { replace: true });
    }
  };

  const handleTabDoubleClick = (e: MouseEvent<HTMLDivElement>, flowId: string, currentName: string) => {
    e.stopPropagation();
    setEditingTabId(flowId);
    setEditingName(currentName);
  };

  const handleEditNameChange = (e: ChangeEvent<HTMLInputElement>) => setEditingName(e.target.value);

  const cancelEdit = () => {
    setEditingTabId(null);
    setEditingName('');
  };

  const saveFlowName = async (flowId: string) => {
    if (!editingName.trim()) return cancelEdit();

    try {
      await updateFlowName(flowId, editingName.trim());
      await loadFlows(); // refresca nombres
      cancelEdit();
    } catch (error) {
      console.error('Error al actualizar nombre del flow:', error);
    }
  };

  const handleEditNameKeyDown = async (e: KeyboardEvent<HTMLInputElement>, flowId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await saveFlowName(flowId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  const handleEditNameBlur = async (flowId: string) => {
    await saveFlowName(flowId);
  };

  // Render: si no hay tabs, no muestres nada (esto también mata "UI fantasma")
  if (!selectedProjectId || openTabs.length === 0) return null;

  // No dependas de que el flow exista en flows para renderizar tab.
  // Si no está, igual muestra fallback.
  const tabsData: TabData[] = openTabs.map((flowId) => {
    const flow = flows.find((f) => (f.id || (f as unknown as { flow_id?: string }).flow_id) === flowId);
    const isActive = flowId === activeWorkflowId;

    return {
      id: flowId,
      name: flow?.name || `Flow ${flowId}`,
      isActive,
      hasUnsavedChanges: isActive ? checkFlowHasUnsavedChanges(flowId, nodes, edges) : false,
      hasErrors: checkFlowHasErrors(flowId),
    };
  });

  return (
    <div className="flow-tabs-container">
      <div className="flow-tabs-scroll">
        {tabsData.map((tab) => (
          <div
            key={tab.id}
            className={`flow-tab ${tab.isActive ? 'active' : ''} ${tab.hasErrors ? 'has-errors' : ''} ${editingTabId === tab.id ? 'editing' : ''}`}
            onClick={() => editingTabId !== tab.id && handleTabClick(tab.id)}
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

            {tab.hasUnsavedChanges && <span className="flow-tab-dot" title="Modificaciones no guardadas" />}
            {tab.hasErrors && <span className="flow-tab-error-indicator" title="Errores de validación" />}

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
