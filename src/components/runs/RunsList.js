import { useEffect, useState, useRef } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import RunCard from './RunCard';
import SkeletonLoader from '../common/SkeletonLoader';
import './RunsList.css';

const RunsList = () => {
  const { flowId: flowIdParam } = useParams(); // De /runs/flow/:flowId
  const [searchParams] = useSearchParams(); // De /runs?flowId=xxx
  const navigate = useNavigate();
  const { runs, loadRuns, selectedFlowId, selectedProjectId } = useEditorStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const refreshIntervalRef = useRef(null);

  // Auto-refresh para runs activos
  useEffect(() => {
    // Asegurar que runs sea un array
    const runsArray = Array.isArray(runs) ? runs : [];
    const hasActiveRuns = runsArray.some(run => run.status === 'running' || run.status === 'pending');
    
    if (hasActiveRuns) {
      // Refrescar cada 2 segundos si hay runs activos
      refreshIntervalRef.current = setInterval(async () => {
        const flowIdFromQuery = searchParams.get('flowId');
        const targetFlowId = flowIdParam || flowIdFromQuery || selectedFlowId;
        if (targetFlowId) {
          try {
            await loadRuns(targetFlowId);
          } catch (err) {
            console.error('Error al refrescar runs:', err);
          }
        }
      }, 2000);
    } else {
      // Limpiar intervalo si no hay runs activos
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [runs, flowIdParam, searchParams, selectedFlowId, loadRuns]);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      setError(null);
      try {
        // Prioridad: flowId de URL param > flowId de query param > selectedFlowId del store
        const flowIdFromQuery = searchParams.get('flowId');
        const targetFlowId = flowIdParam || flowIdFromQuery || selectedFlowId;
        
        if (targetFlowId) {
          await loadRuns(targetFlowId);
        } else if (!selectedProjectId) {
          // Si no hay proyecto seleccionado, mostrar mensaje
          setError('No hay proyecto seleccionado. Por favor, selecciona un proyecto primero.');
        } else {
          // Si no hay flowId, mostrar mensaje o redirigir
          setError('No se especificó un flowId. Por favor, selecciona un flow primero.');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [flowIdParam, searchParams, selectedFlowId, selectedProjectId, loadRuns]);

  if (loading) {
    return (
      <div className="runs-list-container">
        <div className="runs-list-header">
          <div>
            <h1 className="runs-list-title">Historial de Ejecuciones</h1>
          </div>
        </div>
        <div className="runs-list-grid">
          <SkeletonLoader type="card" count={3} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="runs-list-container">
        <div className="runs-list-error">
          <p>Error al cargar ejecuciones: {error}</p>
          <button onClick={() => window.location.reload()}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="runs-list-container">
      <div className="runs-list-header">
        <div>
          <button
            className="runs-list-back-button"
            onClick={() => navigate('/flows')}
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
            Volver a Flows
          </button>
          <h1 className="runs-list-title">Historial de Ejecuciones</h1>
        </div>
      </div>

      {!Array.isArray(runs) || runs.length === 0 ? (
        <div className="runs-list-empty">
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
          <p>No hay ejecuciones registradas</p>
        </div>
      ) : (
        <div className="runs-list-grid">
          {runs.map((run) => (
            <RunCard key={run.id} run={run} />
          ))}
        </div>
      )}
    </div>
  );
};

export default RunsList;

