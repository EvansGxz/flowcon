import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, X, ChevronRight, Database } from 'lucide-react';
import './NodePalette.css';
import './ERPalette.css';

interface ERPaletteProps {
  onAddEntity: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const ERPalette = ({ onAddEntity, isOpen, onClose }: ERPaletteProps) => {
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Manejar montaje y desmontaje con animación
  useEffect(() => {
    if (isOpen) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setShouldRender(true);
      setIsAnimating(false);
      const timeout = setTimeout(() => {
        setIsAnimating(true);
      }, 10);
      timeoutRef.current = timeout;
    } else {
      setIsAnimating(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      const timeout = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      timeoutRef.current = timeout;
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen]);

  if (!shouldRender) return null;

  const handleAddEntity = () => {
    onAddEntity();
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className={`node-palette-overlay ${isAnimating ? 'open' : ''}`}
          onClick={onClose}
        />
      )}

      {/* Panel lateral */}
      <div className={`node-palette ${isAnimating ? 'open' : ''}`}>
        <div className="node-palette-header">
          <h2 className="node-palette-title">Agregar Tabla</h2>
          <button
            className="node-palette-close"
            onClick={onClose}
            aria-label="Cerrar paleta"
          >
            <X size={20} />
          </button>
        </div>

        <div className="node-palette-content">
          <div className="er-palette-section">
            <div className="er-palette-item" onClick={handleAddEntity}>
              <div className="er-palette-item-icon">
                <Database size={24} />
              </div>
              <div className="er-palette-item-info">
                <div className="er-palette-item-name">Nueva Tabla</div>
                <div className="er-palette-item-description">
                  Crea una nueva entidad/tabla para tu diagrama ER
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ERPalette;
