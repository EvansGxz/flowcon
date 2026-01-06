import { useState, useRef, useEffect } from 'react';
import { Plus, LayoutGrid, LayoutList, FileText, Sun, Cloud, Moon, File, SquareSplitVertical, Cherry, Rose } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useEditorStore } from '../../store/editorStore';
import ExamplesModal from '../modals/ExamplesModal';
import './TopRightControls.css';

/**
 * Controles del panel superior derecho
 * Incluye: Agregar Nodo, Toggle Theme, Modo de Vista, Cargar Ejemplos
 */
const TopRightControls = ({ onAddNode, onModalStateChange }) => {
  const { theme, setTheme } = useTheme();
  const { nodeViewMode, setNodeViewMode, loadExample } = useEditorStore();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showViewMenu, setShowViewMenu] = useState(false);
  const [isExamplesModalOpen, setExamplesModalOpen] = useState(false);
  
  const themeMenuRef = useRef(null);
  const viewMenuRef = useRef(null);

  // Notificar al padre cuando cualquier modal esté abierto
  useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(isExamplesModalOpen);
    }
  }, [isExamplesModalOpen, onModalStateChange]);

  // Cerrar menús al hacer clic fuera
  useEffect(() => {
    if (!showThemeMenu && !showViewMenu) return;

    const handleClickOutside = (event) => {
      const target = event.target;
      
      // Verificar si el clic fue fuera del menú de tema
      if (showThemeMenu && themeMenuRef.current) {
        const isClickInside = themeMenuRef.current.contains(target);
        if (!isClickInside) {
          setShowThemeMenu(false);
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
  }, [showThemeMenu, showViewMenu]);

  const handleLoadExample = async (exampleName) => {
    await loadExample(exampleName);
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
          <Plus size={18} />
        </button>

        {/* View Mode Selector */}
        <div className="top-right-control-wrapper" ref={viewMenuRef}>
          <button
            className="top-right-control-button"
            onClick={() => setShowViewMenu(!showViewMenu)}
            aria-label="Modo de vista"
            title="Modo de vista"
          >
            <SquareSplitVertical size={18} />
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
                <LayoutGrid size={16} style={{ marginRight: '8px' }} />
                Solo Icono
              </button>
              <button
                className={`top-right-control-menu-item ${nodeViewMode === 'compact' ? 'active' : ''}`}
                onClick={() => {
                  setNodeViewMode('compact');
                  setShowViewMenu(false);
                }}
              >
                <LayoutList size={16} style={{ marginRight: '8px' }} />
                Completo
              </button>
              <button
                className={`top-right-control-menu-item ${nodeViewMode === 'informative' ? 'active' : ''}`}
                onClick={() => {
                  setNodeViewMode('informative');
                  setShowViewMenu(false);
                }}
              >
                <FileText size={16} style={{ marginRight: '8px' }} />
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
            {theme === 'light' ? (
              <Sun size={18} />
            ) : theme === 'blossom' ? (
              <Rose size={18} />
            ) : theme === 'abyss' ? (
              <Cloud size={18} />
            ) : theme === 'midnight-sakura' ? (
              <Cherry size={18} />
            ) : (
              <Moon size={18} />
            )}
          </button>
          {showThemeMenu && (
            <div className="top-right-control-menu">
              <button
                className={`top-right-control-menu-item ${theme === 'light' ? 'active' : ''}`}
                onClick={() => {
                  setTheme('light');
                  setShowThemeMenu(false);
                }}
                title="Light"
              >
                <Sun size={18} />
                Light
              </button>
              <button
                className={`top-right-control-menu-item ${theme === 'blossom' ? 'active' : ''}`}
                onClick={() => {
                  setTheme('blossom');
                  setShowThemeMenu(false);
                }}
                title="Blossom"
              >
                <Rose size={18} />
                Blossom
              </button>
              <button
                className={`top-right-control-menu-item ${theme === 'abyss' ? 'active' : ''}`}
                onClick={() => {
                  setTheme('abyss');
                  setShowThemeMenu(false);
                }}
                title="Abyss"
              >
                <Cloud size={18} />
                Abyss
              </button>
              <button
                className={`top-right-control-menu-item ${theme === 'dark' ? 'active' : ''}`}
                onClick={() => {
                  setTheme('dark');
                  setShowThemeMenu(false);
                }}
                title="Dark Theme"
              >
                <Moon size={18} />
                Dark
              </button>
              <button
                className={`top-right-control-menu-item ${theme === 'midnight-sakura' ? 'active' : ''}`}
                onClick={() => {
                  setTheme('midnight-sakura');
                  setShowThemeMenu(false);
                }}
                title="Midnight Sakura"
              >
                <Cherry size={18} />
                Midnight Sakura
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
          <File size={18} />
        </button>

      </div>

      {/* Modal de Ejemplos */}
      <ExamplesModal
        isOpen={isExamplesModalOpen}
        onClose={() => setExamplesModalOpen(false)}
        onSelectExample={handleLoadExample}
      />
    </>
  );
};

export default TopRightControls;

