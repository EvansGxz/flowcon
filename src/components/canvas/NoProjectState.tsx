import { useNavigate } from 'react-router-dom';
import './NoProjectState.css';

const NoProjectState = () => {
  const navigate = useNavigate();

  return (
    <div className="no-project-state">
      <div className="no-project-state-content">
        <div className="no-project-state-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="no-project-state-title">No hay proyecto seleccionado</h2>
        <p className="no-project-state-description">
          Para usar el editor, primero debes seleccionar un proyecto o crear uno nuevo.
        </p>
        <div className="no-project-state-actions">
          <button
            className="no-project-state-button primary"
            onClick={() => navigate('/projects')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Ir a Proyectos
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoProjectState;
