import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEditorStore } from '../../store/editorStore';
import { getFlows } from '../../services/flowsService';
import ProjectContextMenu from './ProjectContextMenu';
import ConfirmModal from '../modals/ConfirmModal';
import './ProjectsList.css';


const ProjectsList = () => {
  const navigate = useNavigate();
  const { 
    projects, 
    loadProjects, 
    checkConnection, 
    connectionStatus, 
    createProject, 
    selectProject,
    deleteProject,
    duplicateProject,
    exportProject,
    exportAllProjects,
  } = useEditorStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [contextMenu, setContextMenu] = useState({ isOpen: false, position: null, project: null });
  const [flowsByProject, setFlowsByProject] = useState({}); // { projectId: [flows] }
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  // Helper para obtener flows de un proyecto específico
  const fetchFlowsForProject = useCallback(async (projectId) => {
    try {
      const flows = await getFlows(projectId);
      return Array.isArray(flows) ? flows : [];
    } catch (err) {
      console.error(`Error al obtener flows del proyecto ${projectId}:`, err);
      return [];
    }
  }, []);

  // Helper para obtener flows de todos los proyectos
  const fetchAllFlowsByProject = useCallback(async (projectsList) => {
    const grouped = {};
    
    if (!Array.isArray(projectsList) || projectsList.length === 0) {
      return grouped;
    }

    // Obtener flows de cada proyecto individualmente
    const flowPromises = projectsList.map(async (project) => {
      const projectId = String(project.id);
      const flows = await fetchFlowsForProject(projectId);
      return { projectId, flows };
    });

    const results = await Promise.all(flowPromises);
    
    // Agrupar los resultados
    results.forEach(({ projectId, flows }) => {
      if (flows.length > 0) {
        grouped[projectId] = flows;
      }
    });

    return grouped;
  }, [fetchFlowsForProject]);

  const initializedRef = useRef(false);
  
  useEffect(() => {
    const initialize = async () => {
      if (initializedRef.current) return; // Evitar múltiples inicializaciones
      
      setLoading(true);
      setError(null);
      try {
        await checkConnection();
        await loadProjects();
        
        // Esperar un momento para que el store se actualice
        setTimeout(async () => {
          const currentProjects = useEditorStore.getState().projects;
          if (currentProjects && currentProjects.length > 0) {
            const grouped = await fetchAllFlowsByProject(currentProjects);
            setFlowsByProject(grouped);
          }
          setLoading(false);
          initializedRef.current = true;
        }, 100);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkConnection, loadProjects]); // fetchAllFlowsByProject se usa dentro de initialize pero no debe estar en deps para evitar re-ejecuciones

  // Recargar flows cuando cambien los proyectos para actualizar conteos
  // Usar un ref para evitar bucles infinitos comparando IDs de proyectos
  const previousProjectIdsRef = useRef('');
  
  useEffect(() => {
    if (!initializedRef.current) return; // Esperar a que termine la inicialización
    
    // Comparar IDs de proyectos para detectar cambios reales
    const currentProjectIds = projects?.map(p => p.id).sort().join(',') || '';
    const previousProjectIds = previousProjectIdsRef.current;
    
    // Solo recargar si los IDs realmente cambiaron
    if (currentProjectIds !== previousProjectIds) {
      previousProjectIdsRef.current = currentProjectIds;
      
      const refreshFlows = async () => {
        if (projects && projects.length > 0) {
          try {
            const grouped = await fetchAllFlowsByProject(projects);
            setFlowsByProject(grouped);
          } catch (err) {
            console.error('Error al recargar flows:', err);
          }
        } else {
          // Si no hay proyectos, limpiar los flows agrupados
          setFlowsByProject({});
        }
      };
      refreshFlows();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]); // fetchAllFlowsByProject está memoizado con useCallback y no necesita estar en deps

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) {
      return;
    }

    try {
      const result = await createProject({
        name: projectName.trim(),
        description: projectDescription.trim() || undefined,
      });

      if (result.success) {
        setProjectName('');
        setProjectDescription('');
        setShowCreateModal(false);
        await loadProjects();
        // Los flows se recargarán automáticamente cuando projects cambie en el useEffect
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSelectProject = async (projectId) => {
    await selectProject(projectId);
    // Navegar a flows del proyecto
    navigate(`/projects/${projectId}/flows`);
  };

  const handleContextMenu = (e, project = null) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      project,
    });
  };

  const handleContextAction = async (action, project) => {
    switch (action) {
      case 'create':
        setShowCreateModal(true);
        break;
      case 'duplicate':
        if (project) {
          const result = await duplicateProject(project.id);
          if (result.success) {
            await loadProjects();
            // Recargar flows para actualizar conteos
            try {
              // Esperar a que projects se actualice en el store
              setTimeout(async () => {
                const updatedProjects = useEditorStore.getState().projects;
                const grouped = await fetchAllFlowsByProject(updatedProjects);
                setFlowsByProject(grouped);
              }, 100);
            } catch (err) {
              // Ignorar errores al recargar flows
            }
          } else {
            setError(result.error || 'Error al duplicar proyecto');
          }
        }
        break;
      case 'delete':
        if (project) {
          setProjectToDelete(project);
          setShowDeleteConfirm(true);
        }
        break;
      case 'export':
        if (project) {
          const result = await exportProject(project.id);
          if (!result.success) {
            setError(result.error || 'Error al exportar proyecto');
          }
        }
        break;
      case 'export-all':
        const result = await exportAllProjects();
        if (!result.success) {
          setError(result.error || 'Error al exportar proyectos');
        }
        break;
      default:
        break;
    }
  };

  const handleDeleteConfirm = async () => {
    setShowDeleteConfirm(false);
    if (projectToDelete) {
      const result = await deleteProject(projectToDelete.id);
      if (result.success) {
        await loadProjects();
        // Los flows se recargarán automáticamente cuando projects cambie en el useEffect
      } else {
        setError(result.error || 'Error al eliminar proyecto');
      }
      setProjectToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="projects-list-container">
        <div className="projects-list-loading">Cargando proyectos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="projects-list-container">
        <div className="projects-list-error">
          <p>Error al cargar proyectos: {error}</p>
          <button onClick={() => window.location.reload()}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="projects-list-container"
      onContextMenu={(e) => handleContextMenu(e)}
    >
      <ProjectContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={() => setContextMenu({ isOpen: false, position: null, project: null })}
        onAction={handleContextAction}
        project={contextMenu.project}
      />
      <div className="projects-list-header">
        <div>
          <h1 className="projects-list-title">Proyectos</h1>
          <p className="projects-list-subtitle">
            Estado de conexión: <span className={`connection-status ${connectionStatus}`}>{connectionStatus}</span>
          </p>
        </div>
        <button className="projects-list-create-button" onClick={() => setShowCreateModal(true)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 5V19M5 12H19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Crear Proyecto
        </button>
      </div>

      {showCreateModal && (
        <div className="projects-list-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="projects-list-modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nuevo Proyecto</h2>
            <form onSubmit={handleCreateProject}>
              <div className="projects-list-form-group">
                <label>Nombre del Proyecto</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Ej: Agente de Ventas"
                  required
                  autoFocus
                />
              </div>
              <div className="projects-list-form-group">
                <label>Descripción (opcional)</label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  placeholder="Descripción del proyecto"
                  rows="3"
                />
              </div>
              <div className="projects-list-modal-actions">
                <button type="button" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </button>
                <button type="submit">Crear</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="projects-list-empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p>No hay proyectos</p>
          <p className="projects-list-empty-note">Crea tu primer proyecto para comenzar</p>
          <button className="projects-list-create-button" onClick={() => setShowCreateModal(true)}>
            Crear tu primer proyecto
          </button>
        </div>
      ) : (
        <div className="projects-list-grid">
          {projects.map((project) => (
            <div
              key={project.id}
              className="projects-list-card"
              onClick={() => handleSelectProject(project.id)}
              onContextMenu={(e) => handleContextMenu(e, project)}
            >
              <div className="projects-list-card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className="projects-list-card-content">
                <h3>{project.name}</h3>
                {project.description && <p>{project.description}</p>}
                <div className="projects-list-card-meta">
                  {flowsByProject[String(project.id)]?.length || 0} flujo{(flowsByProject[String(project.id)]?.length || 0) !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          )          )}
        </div>
      )}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setProjectToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Proyecto"
        message={projectToDelete ? `¿Estás seguro de eliminar el proyecto "${projectToDelete.name}"? Esta acción eliminará todos los flows y runs asociados.` : ''}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </div>
  );
};

export default ProjectsList;
