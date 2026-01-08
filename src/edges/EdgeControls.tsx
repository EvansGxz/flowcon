import './EdgeControls.css';

interface EdgeControlsProps {
  id: string;
  labelX: number;
  labelY: number;
  onDelete: () => void;
  onAddNode: () => void;
  isVisible: boolean;
}

const EdgeControls = ({ 
  id, 
  labelX, 
  labelY, 
  onDelete, 
  onAddNode,
  isVisible 
}: EdgeControlsProps) => {
  return (
    <div
      className={`edge-controls-container ${isVisible ? 'visible' : ''}`}
      style={{
        position: 'absolute',
        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
        pointerEvents: 'all',
      }}
    >
      <button
        className="edge-control-button edge-add-button nodrag nopan"
        onClick={onAddNode}
        aria-label="Agregar nodo"
        title="Agregar nodo en medio"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M8 3V13M3 8H13"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        className="edge-control-button edge-delete-button nodrag nopan"
        onClick={onDelete}
        aria-label="Eliminar conexión"
        title="Eliminar conexión"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 4L4 12M4 4L12 12"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
};

export default EdgeControls;
