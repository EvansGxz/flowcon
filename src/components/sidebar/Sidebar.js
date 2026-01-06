import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useEditorStore } from '../../store/editorStore';
import { getUser, logout } from '../../services/authService';
import './Sidebar.css';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [projectsExpanded, setProjectsExpanded] = useState(false);
  const { projects, loadProjects, selectedProjectId } = useEditorStore();
  const [user, setUser] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Detectar categoría activa basada en la ruta
  const getActiveCategory = () => {
    if (location.pathname === '/projects' || location.pathname.startsWith('/projects')) {
      return 'proyectos';
    }
    if (location.pathname === '/credentials' || location.pathname.startsWith('/credentials')) {
      return 'credenciales';
    }
    // Por defecto, si está en workflow o runs, considerar proyectos
    if (location.pathname.startsWith('/workflow') || location.pathname.startsWith('/runs')) {
      return 'proyectos';
    }
    return null;
  };

  const activeCategory = getActiveCategory();

  // Cargar proyectos al montar
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  // Cargar información del usuario
  useEffect(() => {
    const userData = getUser();
    setUser(userData);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      // Si falla el logout, redirigir de todas formas
      navigate('/auth');
    }
  };

  // Expandir proyectos si estamos en la ruta de proyectos
  useEffect(() => {
    if (location.pathname === '/projects' || location.pathname.startsWith('/projects')) {
      setProjectsExpanded(true);
    }
  }, [location.pathname]);

  // Categorías del sidebar - Solo Proyectos y Credenciales (Flujos se oculta)
  const categories = [
    {
      id: 'credenciales',
      name: 'Credenciales',
      path: '/credentials',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
  ];

  const handleProjectClick = (projectId) => {
    navigate(`/projects/${projectId}/flows`);
  };

  // Agregar clase al body para controlar el margen del contenido
  useEffect(() => {
    const appElement = document.querySelector('.App');
    if (appElement) {
      if (isExpanded) {
        appElement.classList.add('sidebar-expanded');
        appElement.classList.remove('sidebar-collapsed');
      } else {
        appElement.classList.add('sidebar-collapsed');
        appElement.classList.remove('sidebar-expanded');
        // Colapsar proyectos cuando el sidebar se colapsa
        setProjectsExpanded(false);
      }
    }
  }, [isExpanded]);

  // Colapsar proyectos cuando se navega fuera de /projects
  useEffect(() => {
    if (location.pathname !== '/projects' && !location.pathname.startsWith('/projects/')) {
      setProjectsExpanded(false);
    }
  }, [location.pathname]);

  return (
    <>
      <div className={`sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="sidebar-header">
          <button
            className="sidebar-toggle"
            onClick={() => setIsExpanded(!isExpanded)}
            aria-label={isExpanded ? 'Colapsar sidebar' : 'Expandir sidebar'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              {isExpanded ? (
                <path
                  d="M15 18L9 12L15 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : (
                <path
                  d="M9 18L15 12L9 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
          </button>
          <div className={`sidebar-title-wrapper ${isExpanded ? 'visible' : 'hidden'}`}>
            <h2 className="sidebar-title">Navegación</h2>
          </div>
        </div>

        <div className="sidebar-content">
          {/* Proyectos como dropdown */}
          <div className="sidebar-categories">
            <div className="sidebar-dropdown">
              <button
                className={`sidebar-category ${activeCategory === 'proyectos' ? 'active' : ''}`}
                onClick={() => {
                  setProjectsExpanded(!projectsExpanded);
                  if (!projectsExpanded) {
                    navigate('/projects');
                  }
                }}
                title={isExpanded ? 'Proyectos' : 'Proyectos'}
              >
                <div className="sidebar-category-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <span className={`sidebar-category-name ${isExpanded ? 'visible' : 'hidden'}`}>
                  Proyectos
                </span>
                {isExpanded && (
                  <svg
                    className={`sidebar-dropdown-arrow ${projectsExpanded ? 'expanded' : ''}`}
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 9L12 15L18 9"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
              {isExpanded && projectsExpanded && (
                <div className="sidebar-dropdown-content">
                  {projects && projects.length > 0 ? (
                    projects.map((project) => (
                      <button
                        key={project.id}
                        className={`sidebar-project-item ${selectedProjectId === project.id ? 'active' : ''}`}
                        onClick={() => handleProjectClick(project.id)}
                        title={project.name}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="sidebar-project-name">{project.name}</span>
                      </button>
                    ))
                  ) : (
                    <div className="sidebar-dropdown-empty">
                      <span>No hay proyectos</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Otras categorías */}
            {categories.map((category) => (
              <button
                key={category.id}
                className={`sidebar-category ${activeCategory === category.id ? 'active' : ''}`}
                onClick={() => navigate(category.path)}
                title={isExpanded ? category.name : category.name}
              >
                <div className="sidebar-category-icon">{category.icon}</div>
                <span className={`sidebar-category-name ${isExpanded ? 'visible' : 'hidden'}`}>
                  {category.name}
                </span>
              </button>
            ))}
          </div>

          {/* User Menu al final del sidebar */}
          <div className="sidebar-user-menu">
            <button
              className="sidebar-user-button"
              onClick={() => {
                // Si el sidebar está colapsado, expandirlo primero
                if (!isExpanded) {
                  setIsExpanded(true);
                  // Esperar un momento para que se expanda antes de mostrar el menú
                  setTimeout(() => {
                    setShowUserMenu(true);
                  }, 300);
                } else {
                  // Si está expandido, solo toggle del menú
                  setShowUserMenu(!showUserMenu);
                }
              }}
              aria-label="Menú de usuario"
            >
              <div className="sidebar-user-avatar">
                {user?.full_name ? (
                  user.full_name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)
                ) : (
                  user?.email?.[0]?.toUpperCase() || 'U'
                )}
              </div>
              {isExpanded && (
                <span className="sidebar-user-name">
                  {user?.full_name || user?.email || 'Usuario'}
                </span>
              )}
              {isExpanded && (
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className={`sidebar-user-arrow ${showUserMenu ? 'expanded' : ''}`}
                >
                  <path
                    d="M6 9L12 15L18 9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>

            {showUserMenu && (
              <>
                <div className="sidebar-user-menu-overlay" onClick={() => setShowUserMenu(false)} />
                <div className={`sidebar-user-menu-dropdown ${isExpanded ? '' : 'collapsed'}`}>
                  <div className="sidebar-user-menu-info">
                    <div className="sidebar-user-menu-email">{user?.email}</div>
                    {user?.full_name && (
                      <div className="sidebar-user-menu-name">{user.full_name}</div>
                    )}
                  </div>
                  <div className="sidebar-user-menu-divider" />
                  <button
                    className="sidebar-user-menu-item"
                    onClick={handleLogout}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M16 17L21 12L16 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M21 12H9"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

