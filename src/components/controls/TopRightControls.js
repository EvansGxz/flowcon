import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useEditorStore } from '../../store/editorStore';
import JsonModal from '../modals/JsonModal';
import ExamplesModal from '../modals/ExamplesModal';
import './TopRightControls.css';

/**
 * Controles del panel superior derecho
 * Incluye: Agregar Nodo, Toggle Theme, Exportar/Importar/Validar
 */
const TopRightControls = ({ onAddNode, onModalStateChange }) => {
  const { theme, setTheme } = useTheme();
  const { exportGraph, importGraph, validateLocal, nodeViewMode, setNodeViewMode, loadExample } = useEditorStore();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [isExamplesModalOpen, setExamplesModalOpen] = useState(false);
  const [isJsonModalOpen, setJsonModalOpen] = useState(false);
  const [jsonMode, setJsonMode] = useState('export');
  const [validationResult, setValidationResult] = useState(null);
  
  const themeMenuRef = useRef(null);
  const exportMenuRef = useRef(null);
  const viewMenuRef = useRef(null);

  // Notificar al padre cuando cualquier modal esté abierto
  useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(isExamplesModalOpen || isJsonModalOpen);
    }
  }, [isExamplesModalOpen, isJsonModalOpen, onModalStateChange]);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    if (!showThemeMenu && !showExportMenu && !showViewMenu) return;

    const handleClickOutside = (event) => {
      const target = event.target;
      
      // Verificar si el clic fue fuera del menú de tema
      if (showThemeMenu && themeMenuRef.current) {
        const isClickInside = themeMenuRef.current.contains(target);
        if (!isClickInside) {
          setShowThemeMenu(false);
        }
      }
      
      // Verificar si el clic fue fuera del menú de exportar
      if (showExportMenu && exportMenuRef.current) {
        const isClickInside = exportMenuRef.current.contains(target);
        if (!isClickInside) {
          setShowExportMenu(false);
        }
      }
      
      // Verificar si el clic fue fuera del menú de vista
      if (showViewMenu && viewMenuRef.current) {
        const isClickInside = viewMenuRef.current.contains(target);
        if (!isClickInside) {
          setShowViewMenu(false);
        }
      }
    };

    // Usar un pequeño delay para evitar que se cierre inmediatamente al abrir
    const timeoutId = setTimeout(() => {
      // Usar capture phase para capturar el evento antes de que llegue a otros elementos
      document.addEventListener('mousedown', handleClickOutside, true);
      document.addEventListener('click', handleClickOutside, true);
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [showThemeMenu, showExportMenu, showViewMenu]);

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

  const handleValidate = () => {
    const result = validateLocal();
    setValidationResult(result);
    setShowExportMenu(false);
    
    // Los errores se mostrarán en el popup de validación
  };

  const handleJsonImport = (jsonString) => {
    const result = importGraph(jsonString);
    if (result.success) {
      setJsonModalOpen(false);
    }
    // Si hay errores, se mostrarán en el modal
    return result;
  };

  const handleLoadExample = async (exampleName) => {
    const result = await loadExample(exampleName);
    if (!result.success) {
      setValidationResult(result);
    }
  };

  return (
    <>
      <div className="top-right-controls">
        {/* Agregar Nodo */}
        <button
          className="top-right-control-button"
          onClick={onAddNode}
          aria-label="Agregar nodo"
          title="Agregar nodo"
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
        </button>

        {/* View Mode Selector */}
        <div className="top-right-control-wrapper" ref={viewMenuRef}>
          <button
            className="top-right-control-button"
            onClick={() => setShowViewMenu(!showViewMenu)}
            aria-label="Modo de vista"
            title="Modo de vista"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              {nodeViewMode === 'icon' ? (
                <path
                  d="M3 7C3 5.89543 3.89543 5 5 5H19C20.1046 5 21 5.89543 21 7V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : nodeViewMode === 'compact' ? (
                <>
                  <path
                    d="M3 7C3 5.89543 3.89543 5 5 5H19C20.1046 5 21 5.89543 21 7V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7 12H17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              ) : (
                <>
                  <path
                    d="M3 7C3 5.89543 3.89543 5 5 5H19C20.1046 5 21 5.89543 21 7V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7 12H17M7 8H17M7 16H17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}
            </svg>
          </button>
          {showViewMenu && (
            <div className="top-right-control-menu">
              <button
                className={`top-right-control-menu-item ${nodeViewMode === 'icon' ? 'active' : ''}`}
                onClick={() => {
                  setNodeViewMode('icon');
                  setShowViewMenu(false);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
                  <path
                    d="M3 7C3 5.89543 3.89543 5 5 5H19C20.1046 5 21 5.89543 21 7V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Solo Icono
              </button>
              <button
                className={`top-right-control-menu-item ${nodeViewMode === 'compact' ? 'active' : ''}`}
                onClick={() => {
                  setNodeViewMode('compact');
                  setShowViewMenu(false);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
                  <path
                    d="M3 7C3 5.89543 3.89543 5 5 5H19C20.1046 5 21 5.89543 21 7V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7 12H17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Completo
              </button>
              <button
                className={`top-right-control-menu-item ${nodeViewMode === 'informative' ? 'active' : ''}`}
                onClick={() => {
                  setNodeViewMode('informative');
                  setShowViewMenu(false);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
                  <path
                    d="M3 7C3 5.89543 3.89543 5 5 5H19C20.1046 5 21 5.89543 21 7V17C21 18.1046 20.1046 19 19 19H5C3.89543 19 3 18.1046 3 17V7Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7 12H17M7 8H17M7 16H17"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Informativo
              </button>
            </div>
          )}
        </div>

        {/* Toggle Theme */}
        <div className="top-right-control-wrapper" ref={themeMenuRef}>
          <button
            className="top-right-control-button"
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            aria-label="Tema"
            title="Tema"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              {theme === 'light' ? (
                <path
                  d="M12 3V4M12 20V21M4 12H3M6.31412 6.31412L5.5 5.5M17.6859 6.31412L18.5 5.5M6.31412 17.69L5.5 18.5M17.6859 17.69L18.5 18.5M21 12H20M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : theme === 'abyss' ? (
                <path
                  d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ) : (
                <path
                  d="M3 3H21V21H3V3ZM7 7H17V17H7V7Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
            </svg>
          </button>
          {showThemeMenu && (
            <div className="top-right-control-menu">
              <button
                className={`top-right-control-menu-item ${theme === 'light' ? 'active' : ''}`}
                onClick={() => {
                  setTheme('light');
                  setShowThemeMenu(false);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
                  <path
                    d="M12 3V4M12 20V21M4 12H3M6.31412 6.31412L5.5 5.5M17.6859 6.31412L18.5 5.5M6.31412 17.69L5.5 18.5M17.6859 17.69L18.5 18.5M21 12H20M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Light
              </button>
              <button
                className={`top-right-control-menu-item ${theme === 'abyss' ? 'active' : ''}`}
                onClick={() => {
                  setTheme('abyss');
                  setShowThemeMenu(false);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
                  <path
                    d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Abyss
              </button>
              <button
                className={`top-right-control-menu-item ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => {
                  setTheme('dark');
                  setShowThemeMenu(false);
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
                  <path
                    d="M3 3H21V21H3V3ZM7 7H17V17H7V7Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Dark Theme
              </button>
            </div>
          )}
        </div>

        {/* Cargar Ejemplos */}
        <button
          className="top-right-control-button"
          onClick={() => setExamplesModalOpen(true)}
          aria-label="Cargar ejemplo"
          title="Cargar ejemplo"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
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
            <path
              d="M16 13H8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 17H8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M10 9H9H8"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Exportar/Importar/Validar */}
        <div className="top-right-control-wrapper" ref={exportMenuRef}>
          <button
            className="top-right-control-button"
            onClick={() => setShowExportMenu(!showExportMenu)}
            aria-label="Opciones"
            title="Opciones"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="5" r="1" fill="currentColor" />
              <circle cx="12" cy="12" r="1" fill="currentColor" />
              <circle cx="12" cy="19" r="1" fill="currentColor" />
            </svg>
          </button>
          {showExportMenu && (
            <div className="top-right-control-menu">
              <button
                className="top-right-control-menu-item"
                onClick={handleExport}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
                  <path
                    d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M7 10L12 15L17 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 15V3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Exportar
              </button>
              <button
                className="top-right-control-menu-item"
                onClick={handleImport}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
                  <path
                    d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M17 10L12 5L7 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 5V15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Importar
              </button>
              <button
                className="top-right-control-menu-item"
                onClick={handleValidate}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
                  <path
                    d="M20 6L9 17L4 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Validar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Ejemplos */}
      <ExamplesModal
        isOpen={isExamplesModalOpen}
        onClose={() => setExamplesModalOpen(false)}
        onSelectExample={handleLoadExample}
      />

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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
          <ul>
            {validationResult.errors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
};

export default TopRightControls;

