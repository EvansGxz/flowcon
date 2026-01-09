import { useState, useRef, useEffect } from 'react';
import { Database, Sun, Moon, Cloud, Rose, Cherry } from 'lucide-react';
import { useTheme, type Theme } from '../../context/ThemeContext';
import './ERTopRightControls.css';

interface ERTopRightControlsProps {
  onAddTable: () => void;
}

const ERTopRightControls = ({ onAddTable }: ERTopRightControlsProps) => {
  const { theme, setTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú de tema al hacer clic fuera
  useEffect(() => {
    if (!showThemeMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      
      if (showThemeMenu && themeMenuRef.current && target) {
        const isClickInside = themeMenuRef.current.contains(target);
        if (!isClickInside) {
          setShowThemeMenu(false);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true);
      document.addEventListener('click', handleClickOutside, true);
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('click', handleClickOutside, true);
    };
  }, [showThemeMenu]);

  return (
    <div className="er-top-right-controls">
      {/* Agregar Tabla */}
      <button
        className="er-top-right-control-button"
        onClick={onAddTable}
        aria-label="Agregar tabla"
        title="Agregar tabla"
      >
        <Database size={18} />
      </button>

      {/* Toggle Theme */}
      <div className="er-top-right-control-wrapper" ref={themeMenuRef}>
        <button
          className="er-top-right-control-button"
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
          <div className="er-top-right-control-menu">
            <button
              className={`er-top-right-control-menu-item ${theme === 'light' ? 'active' : ''}`}
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
              className={`er-top-right-control-menu-item ${theme === 'blossom' ? 'active' : ''}`}
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
              className={`er-top-right-control-menu-item ${theme === 'abyss' ? 'active' : ''}`}
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
              className={`er-top-right-control-menu-item ${theme === 'dark' ? 'active' : ''}`}
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
              className={`er-top-right-control-menu-item ${theme === 'midnight-sakura' ? 'active' : ''}`}
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
    </div>
  );
};

export default ERTopRightControls;
