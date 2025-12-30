import { useState } from 'react';
import './AddNodeControl.css';

/**
 * Control para agregar nodos
 * Similar a CustomControls pero posicionado en la esquina superior derecha
 */
const AddNodeControl = ({ onAddNode }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="add-node-control">
      <button
        className="add-node-control-button"
        onClick={onAddNode}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        aria-label="Agregar nodo"
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
        {showTooltip && (
          <div className="add-node-control-tooltip">Agregar Nodo</div>
        )}
      </button>
    </div>
  );
};

export default AddNodeControl;

