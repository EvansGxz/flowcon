import { useTheme } from '../../context/ThemeContext';
import './AlertModal.css';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

const AlertModal = ({ isOpen, onClose, title, message, type = 'info' }: AlertModalProps) => {
  // Asegurar que el modal está dentro del ThemeContext
  useTheme();
  
  if (!isOpen) return null;

  return (
    <div className="alert-modal-overlay" onClick={onClose}>
      <div className="alert-modal" onClick={(e) => e.stopPropagation()}>
        <div className="alert-modal-header">
          <h2 className="alert-modal-title">{title || 'Información'}</h2>
        </div>
        <div className="alert-modal-body">
          <p className="alert-modal-message">{message}</p>
        </div>
        <div className="alert-modal-actions">
          <button className={`alert-modal-button ${type}`} onClick={onClose}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
