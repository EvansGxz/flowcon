import './EmptyState.css';

interface EmptyStateProps {
  onAddNode: () => void;
}

const EmptyState = ({ onAddNode }: EmptyStateProps) => {
  return (
    <div className="empty-state" onClick={onAddNode}>
      <div className="empty-state-content">
        <div className="empty-state-icon">
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 17L12 22L22 17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 12L12 17L22 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <p className="empty-state-description">
          Haz clic aquí para agregar tu primer nodo y comenzar a construir tu workflow
        </p>
      </div>
    </div>
  );
};

export default EmptyState;
