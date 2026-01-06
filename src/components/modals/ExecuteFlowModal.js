import { useState } from 'react';
import './ExecuteFlowModal.css';

const ExecuteFlowModal = ({ isOpen, onClose, onConfirm, defaultTimeout = 300 }) => {
  const [timeoutSeconds, setTimeoutSeconds] = useState(defaultTimeout.toString());
  const [useCustomTimeout, setUseCustomTimeout] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    const timeout = useCustomTimeout && timeoutSeconds ? parseInt(timeoutSeconds, 10) : null;
    
    // Validar timeout
    if (useCustomTimeout) {
      const timeoutNum = parseInt(timeoutSeconds, 10);
      if (isNaN(timeoutNum) || timeoutNum < 10) {
        alert('El timeout debe ser al menos 10 segundos');
        return;
      }
      if (timeoutNum > 3600) {
        alert('El timeout no puede exceder 3600 segundos (1 hora)');
        return;
      }
    }
    
    onConfirm(timeout);
  };

  const handleTimeoutChange = (value) => {
    // Solo permitir números
    if (value === '' || /^\d+$/.test(value)) {
      setTimeoutSeconds(value);
    }
  };

  return (
    <div className="execute-flow-modal-overlay" onClick={onClose}>
      <div className="execute-flow-modal" onClick={(e) => e.stopPropagation()}>
        <div className="execute-flow-modal-header">
          <h2 className="execute-flow-modal-title">Ejecutar Flow</h2>
          <button className="execute-flow-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="execute-flow-modal-body">
          <div className="execute-flow-modal-section">
            <label className="execute-flow-modal-label">
              <input
                type="checkbox"
                checked={useCustomTimeout}
                onChange={(e) => setUseCustomTimeout(e.target.checked)}
              />
              <span>Configurar timeout personalizado</span>
            </label>
            <p className="execute-flow-modal-hint">
              Timeout por defecto: <strong>{defaultTimeout}s</strong> (5 minutos)
            </p>
          </div>

          {useCustomTimeout && (
            <div className="execute-flow-modal-section">
              <label className="execute-flow-modal-label">
                Timeout (segundos)
                <input
                  type="text"
                  className="execute-flow-modal-input"
                  value={timeoutSeconds}
                  onChange={(e) => handleTimeoutChange(e.target.value)}
                  placeholder={defaultTimeout.toString()}
                  min="10"
                  max="3600"
                />
              </label>
              <p className="execute-flow-modal-hint">
                Rango permitido: 10 - 3600 segundos
              </p>
            </div>
          )}

          <div className="execute-flow-modal-info">
            <p><strong>Recomendaciones:</strong></p>
            <ul>
              <li>Flows rápidos: 60s (1 minuto)</li>
              <li>Flows con LLM: 180s (3 minutos)</li>
              <li>Flows complejos: 600s (10 minutos)</li>
            </ul>
          </div>
        </div>
        <div className="execute-flow-modal-actions">
          <button className="execute-flow-modal-button cancel" onClick={onClose}>
            Cancelar
          </button>
          <button className="execute-flow-modal-button confirm" onClick={handleConfirm}>
            Ejecutar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExecuteFlowModal;
