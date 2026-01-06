import { useEffect } from 'react';
import { FileText, ChevronRight, X } from 'lucide-react';
import './ExamplesModal.css';

const EXAMPLES = [
  {
    id: 'hello-agent',
    name: 'Hello Agent',
    description: 'Workflow básico con trigger manual, agente y respuesta',
    icon: <FileText size={24} />,
  },
  {
    id: 'route-intent',
    name: 'Route Intent',
    description: 'Workflow con condiciones y múltiples rutas de respuesta',
    icon: <ChevronRight size={24} />,
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
            <X size={16} />
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
                <ChevronRight size={20} className="example-arrow" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamplesModal;

