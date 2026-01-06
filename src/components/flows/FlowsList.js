import { useEffect, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import FlowCard from './FlowCard';
import './FlowsList.css';

const FlowsList = () => {
  const navigate = useNavigate();
  const { flows, loadFlows, checkConnection, connectionStatus } = useEditorStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      setError(null);
      try {
        await checkConnection();
        await loadFlows();
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [checkConnection, loadFlows]);

  const handleCreateNew = () => {
    // Generar un nuevo UUID para el workflow
    const newWorkflowId = uuidv4();
    navigate(`/workflow/${newWorkflowId}`);
  };

  if (loading) {
    return (
      <div className="flows-list-container">
        <div className="flows-list-loading">Cargando flows...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flows-list-container">
        <div className="flows-list-error">
          <p>Error al cargar flows: {error}</p>
          <button onClick={() => window.location.reload()}>Reintentar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flows-list-container">
      <div className="flows-list-header">
        <div>
          <h1 className="flows-list-title">Flows</h1>
          <p className="flows-list-subtitle">
            Estado de conexión: <span className={`connection-status ${connectionStatus}`}>{connectionStatus}</span>
          </p>
        </div>
        <button className="flows-list-create-button" onClick={handleCreateNew}>
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

      {flows.length === 0 ? (
        <div className="flows-list-empty">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M15 3H6C4.89543 3 4 3.89543 4 5V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V8L15 3Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M15 3V8H20"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p>No hay flows guardados</p>
          <p className="flows-list-empty-note">
            Nota: El backend no expone lista de flows en Semana 2. Crea un nuevo flow para comenzar.
          </p>
          <button className="flows-list-create-button" onClick={handleCreateNew}>
            Crear tu primer flow
          </button>
        </div>
      ) : (
        <div className="flows-list-grid">
          {flows.map((flow, index) => {
            // Usar id, flow_id, o index como fallback para la key
            const flowId = flow.id || flow.flow_id || `flow-${index}`;
            return <FlowCard key={flowId} flow={flow} />;
          })}
        </div>
      )}
    </div>
  );
};

export default FlowsList;

