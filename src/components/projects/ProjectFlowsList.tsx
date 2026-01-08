import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditorStore } from '../../store/editorStore';
import { getFlows as getFlowsService } from '../../services/flowsService';
import { v4 as uuidv4 } from 'uuid';
import FlowCard from '../flows/FlowCard';
import SkeletonLoader from '../common/SkeletonLoader';
import type { Flow } from '../../types/api';
import './ProjectFlowsList.css';

const ProjectFlowsList = () => {
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const { 
    projects, 
    loadFlows, 
    selectProject,
    selectedProjectId,
  } = useEditorStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectFlows, setProjectFlows] = useState<Flow[]>([]);

  useEffect(() => {
    const initialize = async () => {
      if (!projectId) {
        setError('ID de proyecto no proporcionado');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // Seleccionar el proyecto si no está seleccionado
        if (selectedProjectId !== projectId) {
          await selectProject(projectId);
        }
        
        // Cargar flows del proyecto usando /flows con X-Project-Id header
        const flows = await getFlowsService(projectId);
        setProjectFlows(flows || []);
        
        // También actualizar el store
        await loadFlows();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [projectId, selectedProjectId, selectProject, loadFlows]);

  const project = projects?.find(p => p.id === projectId);

  if (loading) {
    return (
      <div className="project-flows-container">
        <div className="project-flows-header">
          <button
            className="project-flows-back-button"
            onClick={() => navigate('/projects')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M19 12H5M5 12L12 19M5 12L12 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Volver a Proyectos
          </button>
          <h1 className="project-flows-title">Cargando...</h1>
        </div>
        <div className="project-flows-grid">
          <SkeletonLoader type="card" count={3} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="project-flows-container">
        <div className="project-flows-error">
          <p>Error: {error}</p>
          <button onClick={() => navigate('/projects')}>Volver a Proyectos</button>
        </div>
      </div>
    );
  }

  return (
    <div className="project-flows-container">
      <div className="project-flows-header">
        <button
          className="project-flows-back-button"
          onClick={() => navigate('/projects')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M19 12H5M5 12L12 19M5 12L12 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Volver a Proyectos
        </button>
        <div>
          <h1 className="project-flows-title">
            {project?.name || 'Proyecto'} - Flujos
          </h1>
          {project?.description && (
            <p className="project-flows-subtitle">{project.description}</p>
          )}
        </div>
        <button 
          className="project-flows-create-button" 
          onClick={() => {
            const newWorkflowId = uuidv4();
            navigate(`/workflow/${newWorkflowId}`);
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 5V19M5 12H19"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Crear Flow
        </button>
      </div>

      {projectFlows.length === 0 ? (
        <div className="project-flows-empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 2V8H20"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p>No hay flujos en este proyecto</p>
          <p className="project-flows-empty-note">Crea tu primer flow para comenzar</p>
          <button 
            className="project-flows-create-button" 
            onClick={() => {
              const newWorkflowId = uuidv4();
              navigate(`/workflow/${newWorkflowId}`);
            }}
          >
            Crear tu primer flow
          </button>
        </div>
      ) : (
        <div className="project-flows-grid">
          {projectFlows.map((flow) => {
            // Normalizar el flow para que FlowCard pueda manejarlo
            const flowId = flow.id || (flow as unknown as { flow_id?: string }).flow_id;
            const normalizedFlow: Flow = {
              ...flow,
              id: flowId,
              name: flow.name || `Flow ${flowId}`,
              updated_at: flow.updated_at || (flow as unknown as { updatedAt?: string }).updatedAt,
              created_at: flow.created_at || (flow as unknown as { createdAt?: string }).createdAt,
            };
            return <FlowCard key={normalizedFlow.id} flow={normalizedFlow} />;
          })}
        </div>
      )}
    </div>
  );
};

export default ProjectFlowsList;
