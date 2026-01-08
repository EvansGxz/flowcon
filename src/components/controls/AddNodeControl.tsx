import { useState } from 'react';
import { Plus } from 'lucide-react';
import './AddNodeControl.css';

interface AddNodeControlProps {
  onAddNode: () => void;
}

/**
 * Control para agregar nodos
 * Similar a CustomControls pero posicionado en la esquina superior derecha
 */
const AddNodeControl = ({ onAddNode }: AddNodeControlProps) => {
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
        <Plus size={18} />
        {showTooltip && (
          <div className="add-node-control-tooltip">Agregar Nodo</div>
        )}
      </button>
    </div>
  );
};

export default AddNodeControl;
