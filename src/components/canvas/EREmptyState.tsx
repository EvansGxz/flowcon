import { Database } from 'lucide-react';
import './EmptyState.css';

interface EREmptyStateProps {
  onAddNode: () => void;
}

const EREmptyState = ({ onAddNode }: EREmptyStateProps) => {
  return (
    <div className="empty-state" onClick={onAddNode}>
      <div className="empty-state-content">
        <div className="empty-state-icon">
          <Database size={80} />
        </div>
        <p className="empty-state-description">
          Haz clic aquí para agregar tu primera tabla y comenzar a diseñar tu diagrama entidad-relación
        </p>
      </div>
    </div>
  );
};

export default EREmptyState;
