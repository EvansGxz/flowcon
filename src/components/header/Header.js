import { useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useTheme } from '../../context/ThemeContext';
import './Header.css';

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { selectedProjectId, projects, loadFlows, loadProjects } = useEditorStore();

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

  const selectedProject = projects?.find((p) => p.id === selectedProjectId);

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
            <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        );
      case 'abyss':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3C12 3 8 7 8 12C8 16 12 20 12 20C12 20 16 16 16 12C16 7 12 3 12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
          </svg>
        );
      case 'dark':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="header-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 17L12 22L22 17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 12L12 17L22 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="header-logo-text">REDMIND</span>
        </div>
        {selectedProject && (
          <div className="header-project">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="header-project-name">{selectedProject.name}</span>
          </div>
        )}
      </div>

      <div className="header-right">
        <button
          className="header-theme-toggle"
          onClick={toggleTheme}
          title={`Cambiar tema (${theme})`}
          aria-label="Cambiar tema"
        >
          {getThemeIcon()}
        </button>
      </div>
    </header>
  );
};

export default Header;
