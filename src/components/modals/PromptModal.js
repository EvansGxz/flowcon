import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import './PromptModal.css';

const PromptModal = ({ isOpen, onClose, onConfirm, title, message, defaultValue = '', placeholder = '' }) => {
  // Asegurar que el modal está dentro del ThemeContext
  useTheme();
  
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm(inputValue);
    }
    onClose();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleConfirm();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="prompt-modal-overlay" onClick={onClose}>
      <div className="prompt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="prompt-modal-header">
          <h2 className="prompt-modal-title">{title || 'Ingresar valor'}</h2>
        </div>
        <div className="prompt-modal-body">
          {message && <p className="prompt-modal-message">{message}</p>}
          <input
            type="text"
            className="prompt-modal-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            autoFocus
          />
        </div>
        <div className="prompt-modal-actions">
          <button className="prompt-modal-button cancel" onClick={onClose}>
            Cancelar
          </button>
          <button className="prompt-modal-button confirm" onClick={handleConfirm}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptModal;
