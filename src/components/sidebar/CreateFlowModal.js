import { useState } from 'react';
import './CreateFlowModal.css';

const CreateFlowModal = ({ isOpen, onClose, onCreate, projectName }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('El nombre del flujo es requerido');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await onCreate({
        name: name.trim(),
        description: description.trim() || undefined,
      });

      if (result.success) {
        setName('');
        setDescription('');
        onClose();
      } else {
        setError(result.error || 'Error al crear el flujo');
      }
    } catch (err) {
      setError(err.message || 'Error al crear el flujo');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setName('');
      setDescription('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content create-flow-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Nuevo Flujo</h2>
          <button className="modal-close" onClick={handleClose} disabled={loading}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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

        {projectName && (
          <div className="modal-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Proyecto: <strong>{projectName}</strong></span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="flow-name" className="form-label">
              Nombre del Flujo <span className="required">*</span>
            </label>
            <input
              id="flow-name"
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Mi Flujo"
              required
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="flow-description" className="form-label">
              Descripción
            </label>
            <textarea
              id="flow-description"
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del flujo (opcional)"
              rows="3"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="form-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="modal-button modal-button-secondary"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="modal-button modal-button-primary"
              disabled={loading || !name.trim()}
            >
              {loading ? 'Creando...' : 'Crear Flujo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFlowModal;

