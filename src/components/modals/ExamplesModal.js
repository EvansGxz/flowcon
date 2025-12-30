import { useEffect } from 'react';
import './ExamplesModal.css';

const EXAMPLES = [
  {
    id: 'hello-agent',
    name: 'Hello Agent',
    description: 'Workflow básico con trigger manual, agente y respuesta',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 1H5C3.89 1 3 1.89 3 3V21C3 22.11 3.89 23 5 23H19C20.11 23 21 22.11 21 21V9H21ZM19 21H5V3H13V9H19V21Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    id: 'route-intent',
    name: 'Route Intent',
    description: 'Workflow con condiciones y múltiples rutas de respuesta',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M9 18L15 12L9 6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

const ExamplesModal = ({ isOpen, onClose, onSelectExample }) => {
  // Cerrar modal con Escape
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelect = (exampleId) => {
    onSelectExample(exampleId);
    onClose();
  };

  return (
    <div className="examples-modal-overlay" onClick={onClose}>
      <div className="examples-modal" onClick={(e) => e.stopPropagation()}>
        <div className="examples-modal-header">
          <h3>Cargar Ejemplo</h3>
          <button className="examples-modal-close" onClick={onClose} aria-label="Cerrar">
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

        <div className="examples-modal-content">
          <div className="examples-list">
            {EXAMPLES.map((example) => (
              <button
                key={example.id}
                className="example-card"
                onClick={() => handleSelect(example.id)}
              >
                <div className="example-icon">{example.icon}</div>
                <div className="example-info">
                  <div className="example-name">{example.name}</div>
                  <div className="example-description">{example.description}</div>
                </div>
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="example-arrow"
                >
                  <path
                    d="M9 18L15 12L9 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamplesModal;

