import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, MoreVertical, Download, Upload, CheckCircle2, Save, Play, X } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import JsonModal from '../modals/JsonModal';
import ExecuteFlowModal from '../modals/ExecuteFlowModal';
import PromptModal from '../modals/PromptModal';
import AlertModal from '../modals/AlertModal';
import FlowTabs from './FlowTabs';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const { selectedProjectId, projects, flows, loadFlows, loadProjects, exportGraph, importGraph, validateLocal, validateRemote, saveFlow, executeFlow, selectedFlowId, loadFlow, openTabs, setOpenTabs } = useEditorStore();
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isJsonModalOpen, setJsonModalOpen] = useState(false);
  const [jsonMode, setJsonMode] = useState('export');
  const [validationResult, setValidationResult] = useState(null);
  const [showRunConfirm, setShowRunConfirm] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', type: 'info' });
  const [showFlowsMenu, setShowFlowsMenu] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error' | null
  
  const exportMenuRef = useRef(null);
  const flowsMenuRef = useRef(null);

  // Cargar flows cuando hay un proyecto seleccionado (al hacer refresh)
  useEffect(() => {
    const initialize = async () => {
      if (selectedProjectId) {
        try {
          // Cargar proyectos primero si no están cargados
          if (!projects || projects.length === 0) {
            await loadProjects();
          }
          // Cargar flows del proyecto seleccionado
          await loadFlows();
        } catch (error) {
          console.error('Error al inicializar datos del proyecto:', error);
        }
      }
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId]); // Solo ejecutar cuando cambia el proyecto seleccionado

  // Cerrar menú de exportar al hacer clic fuera
  useEffect(() => {
    if (!showExportMenu) return;

    const handleClickOutside = (event) => {
      const target = event.target;
      
      if (showExportMenu && exportMenuRef.current) {
        const isClickInside = exportMenuRef.current.contains(target);
        if (!isClickInside) {
          setShowExportMenu(false);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true);
      document.addEventListener('click', handleClickOutside, true);
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [showExportMenu]);

  // Cerrar menú de flows al hacer clic fuera
  useEffect(() => {
    if (!showFlowsMenu) return;

    const handleClickOutside = (event) => {
      const target = event.target;
      
      if (showFlowsMenu && flowsMenuRef.current) {
        const isClickInside = flowsMenuRef.current.contains(target);
        if (!isClickInside) {
          setShowFlowsMenu(false);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true);
      document.addEventListener('click', handleClickOutside, true);
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [showFlowsMenu]);

  const selectedProject = projects?.find((p) => p.id === selectedProjectId);

  // Filtrar flows del proyecto actual
  // NOTA: El backend ya filtra los flows por el header X-Project-Id, 
  // por lo que todos los flows en el array ya pertenecen al proyecto seleccionado
  // No necesitamos filtrar por project_id aquí
  const projectFlows = flows;

  const handleProjectClick = async () => {
    if (!showFlowsMenu) {
      // Si el menú se va a abrir, verificar si necesitamos cargar flows
      if (selectedProjectId) {
        // Solo hacer fetch si no hay flows cargados o si los flows están vacíos
        // Si ya hay flows cargados, usar esos en lugar de hacer fetch
        if (flows.length === 0) {
          try {
            await loadFlows();
          } catch (error) {
            console.error('Error al cargar flows:', error);
          }
        }
      }
    }
    setShowFlowsMenu(!showFlowsMenu);
  };

  const handleFlowSelect = async (flowId) => {
    // Agregar el flow a las tabs abiertas si no está
    if (!openTabs.includes(flowId)) {
      setOpenTabs([...openTabs, flowId]);
    }
    // Cargar el flow y navegar a la ruta correspondiente
    const result = await loadFlow(flowId);
    if (result?.success) {
      navigate(`/workflow/${flowId}`);
    }
    setShowFlowsMenu(false);
  };

  const handleExport = () => {
    setJsonMode('export');
    setJsonModalOpen(true);
    setShowExportMenu(false);
  };

  const handleImport = () => {
    setJsonMode('import');
    setJsonModalOpen(true);
    setShowExportMenu(false);
  };

  const handleValidate = async () => {
    // Validar localmente primero
    const localResult = validateLocal();
    if (!localResult.valid) {
      setValidationResult(localResult);
      setShowExportMenu(false);
      return;
    }

    // Si es válido localmente, validar remotamente
    try {
      const remoteResult = await validateRemote();
      setValidationResult(remoteResult);
    } catch (error) {
      setValidationResult({
        valid: false,
        errors: [`Error al validar remotamente: ${error.message}`],
      });
    }
    setShowExportMenu(false);
  };

  const handleSave = async () => {
    // Si el flow ya existe (tiene selectedFlowId), guardar directamente sin modal
    if (selectedFlowId && selectedFlowId !== 'default') {
      try {
        // Obtener el nombre actual del flow
        const currentFlow = flows.find(f => (f.id || f.flow_id) === selectedFlowId);
        const flowName = currentFlow?.name || `Flow ${selectedFlowId}`;
        
        const result = await saveFlow(flowName);
        if (result.success) {
          setSaveStatus('success');
          setTimeout(() => setSaveStatus(null), 2000);
        } else {
          setSaveStatus('error');
          setTimeout(() => setSaveStatus(null), 2000);
        }
      } catch (error) {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus(null), 2000);
      }
    } else {
      // Si no existe, mostrar modal para crear uno nuevo
      setShowPromptModal(true);
    }
  };

  const handleSaveConfirm = async (flowName) => {
    if (!flowName) return;

    try {
      const result = await saveFlow(flowName);
      if (result.success) {
        setShowPromptModal(false);
        setSaveStatus('success');
        setTimeout(() => setSaveStatus(null), 2000);
      } else {
        setAlertModal({ isOpen: true, message: `Error al guardar: ${result.error}`, type: 'error' });
        setSaveStatus('error');
        setTimeout(() => setSaveStatus(null), 2000);
      }
    } catch (error) {
      setAlertModal({ isOpen: true, message: `Error al guardar: ${error.message}`, type: 'error' });
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 2000);
    }
  };

  const handleRunClick = () => {
    // Validar primero
    const validation = validateLocal();
    if (!validation.valid) {
      setAlertModal({ isOpen: true, message: `El flow no es válido:\n${validation.errors.join('\n')}`, type: 'error' });
      return;
    }
    setShowRunConfirm(true);
  };

  const handleRunConfirm = async (timeoutSeconds = null) => {
    setShowRunConfirm(false);
    try {
      const result = await executeFlow(timeoutSeconds);
      if (result.success) {
        // Navegar a runs con flowId si está disponible
        const { selectedFlowId } = useEditorStore.getState();
        if (selectedFlowId) {
          window.location.href = `/runs?flowId=${selectedFlowId}`;
        } else if (window.location.pathname !== '/runs') {
          window.location.href = '/runs';
        }
      } else {
        setAlertModal({ isOpen: true, message: `Error al ejecutar: ${result.error}`, type: 'error' });
      }
    } catch (error) {
      setAlertModal({ isOpen: true, message: `Error al ejecutar: ${error.message}`, type: 'error' });
    }
  };

  const handleJsonImport = (jsonString) => {
    const result = importGraph(jsonString);
    if (result.success) {
      setJsonModalOpen(false);
    }
    // Si hay errores, se mostrarán en el modal
    return result;
  };

  return (
    <header className="app-header">
      <div className="header-left">
        {selectedProject && (
          <div className="header-control-wrapper" ref={flowsMenuRef}>
            <button
              className="header-project"
              onClick={handleProjectClick}
              aria-label="Ver flows del proyecto"
              title="Ver flows del proyecto"
            >
              <Home size={16} />
              <span className="header-project-name">{selectedProject.name}</span>
            </button>
            {showFlowsMenu && (
              <div className="header-flows-menu">
                <div className="header-flows-menu-header">
                  <strong>Flows del proyecto</strong>
                </div>
                {projectFlows.length > 0 ? (
                  <div className="header-flows-menu-list">
                    {projectFlows.map((flow) => {
                      const flowId = flow.id || flow.flow_id;
                      const isOpen = openTabs.includes(flowId);
                      return (
                        <button
                          key={flowId}
                          className={`header-flows-menu-item ${isOpen ? 'is-open' : ''} ${flowId === selectedFlowId ? 'is-active' : ''}`}
                          onClick={() => handleFlowSelect(flowId)}
                        >
                          <span className="header-flows-menu-item-name">{flow.name || `Flow ${flowId}`}</span>
                          {isOpen && <span className="header-flows-menu-item-badge">Abierto</span>}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="header-flows-menu-empty">
                    No hay flows en este proyecto
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <FlowTabs />

      <div className="header-right">
        {/* Exportar/Importar/Validar */}
        <div className="header-control-wrapper" ref={exportMenuRef}>
          <button
            className="header-control-button"
            onClick={() => setShowExportMenu(!showExportMenu)}
            aria-label="Opciones"
            title="Opciones"
          >
            <MoreVertical size={18} />
          </button>
          {showExportMenu && (
            <div className="header-control-menu">
              <button
                className="header-control-menu-item"
                onClick={handleExport}
              >
                <Download size={16} style={{ marginRight: '8px' }} />
                Exportar
              </button>
              <button
                className="header-control-menu-item"
                onClick={handleImport}
              >
                <Upload size={16} style={{ marginRight: '8px' }} />
                Importar
              </button>
              <button
                className="header-control-menu-item"
                onClick={handleValidate}
              >
                <CheckCircle2 size={16} style={{ marginRight: '8px' }} />
                Validar
              </button>
            </div>
          )}
        </div>

        {/* Guardar Flow */}
        <button
          className={`header-control-button ${saveStatus === 'success' ? 'save-success' : ''} ${saveStatus === 'error' ? 'save-error' : ''}`}
          onClick={handleSave}
          aria-label="Guardar flow"
          title="Guardar flow"
        >
          <Save size={18} />
        </button>

        {/* Ejecutar Flow */}
        <button
          className="header-control-button"
          onClick={handleRunClick}
          aria-label="Ejecutar flow"
          title="Ejecutar flow"
        >
          <Play size={18} />
        </button>
      </div>

      {/* Modal JSON */}
      {isJsonModalOpen && (
        <JsonModal
          mode={jsonMode}
          onClose={() => {
            setJsonModalOpen(false);
            setValidationResult(null);
          }}
          onImport={handleJsonImport}
          initialJson={jsonMode === 'export' ? exportGraph() : ''}
        />
      )}

      {/* Mostrar errores de validación si hay */}
      {validationResult && !validationResult.valid && (
        <div className="validation-errors-popup">
          <div className="validation-errors-header">
            <strong>Errores de validación</strong>
            <button onClick={() => setValidationResult(null)}>
              <X size={16} />
            </button>
          </div>
          <ul>
            {validationResult.errors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      <ExecuteFlowModal
        isOpen={showRunConfirm}
        onClose={() => setShowRunConfirm(false)}
        onConfirm={handleRunConfirm}
        defaultTimeout={300}
      />
      <PromptModal
        isOpen={showPromptModal}
        onClose={() => setShowPromptModal(false)}
        onConfirm={handleSaveConfirm}
        title="Guardar Flow"
        message="Ingresa el nombre del flow:"
        defaultValue={selectedFlowId || 'Nuevo Flow'}
        placeholder="Nombre del flow"
      />
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ isOpen: false, message: '', type: 'info' })}
        title={alertModal.type === 'error' ? 'Error' : alertModal.type === 'success' ? 'Éxito' : 'Información'}
        message={alertModal.message}
        type={alertModal.type}
      />
    </header>
  );
};

export default Header;
