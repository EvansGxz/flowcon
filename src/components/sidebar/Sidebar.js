import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ChevronLeft, ChevronRight, ChevronDown, LogOut, Key } from 'lucide-react';
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
      icon: <Key size={16} />,
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
            {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
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
                  <Home size={16} />
                </div>
                <span className={`sidebar-category-name ${isExpanded ? 'visible' : 'hidden'}`}>
                  Proyectos
                </span>
                {isExpanded && (
                  <ChevronDown 
                    size={14}
                    className={`sidebar-dropdown-arrow ${projectsExpanded ? 'expanded' : ''}`}
                  />
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
                        <Home size={14} />
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
                <ChevronDown 
                  size={14}
                  className={`sidebar-user-arrow ${showUserMenu ? 'expanded' : ''}`}
                />
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
                    <LogOut size={16} />
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

