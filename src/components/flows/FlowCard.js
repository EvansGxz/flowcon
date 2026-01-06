import { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../modals/ConfirmModal';
import AlertModal from '../modals/AlertModal';
import './FlowCard.css';
import { deleteFlow as deleteFlowService } from '../../services/flowsService';

const FlowCard = ({ flow }) => {
  const navigate = useNavigate();
  const { loadFlow, executeFlow, loadFlows } = useEditorStore();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, message: '', type: 'error' });

  const handleOpen = async () => {
    // Usar id o flow_id como fallback
    const flowId = flow.id || flow.flow_id;
    if (!flowId) {
      console.error('Flow no tiene ID válido');
      return;
    }
    const result = await loadFlow(flowId);
    if (result.success) {
      navigate(`/workflow/${flowId}`);
    }
  };

  const handleExecute = async () => {
    const result = await loadFlow(flow.id);
    if (result.success) {
      await executeFlow();
      // Navegar a runs con el flowId en la URL
      navigate(`/runs?flowId=${flow.id}`);
    }
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    setShowDeleteConfirm(false);
    try {
      await deleteFlowService(flow.id);
      await loadFlows();
    } catch (error) {
      setAlertModal({ isOpen: true, message: `Error al eliminar: ${error.message}`, type: 'error' });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flow-card">
      <div className="flow-card-header">
        <h3 className="flow-card-title">{flow.name}</h3>
        <button
          className="flow-card-delete"
          onClick={handleDelete}
          title="Eliminar flow"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
      <div className="flow-card-info">
        <div className="flow-card-date">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M8 2V6M16 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 3 21.1046 3 20V6C3 4.89543 3.89543 4 5 4Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {formatDate(flow.updated_at || flow.updatedAt || flow.created_at || flow.createdAt)}
        </div>
      </div>
      <div className="flow-card-actions">
        <button className="flow-card-button flow-card-button-primary" onClick={handleOpen}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M15 3H6C4.89543 3 4 3.89543 4 5V19C4 20.1046 4.89543 21 6 21H18C19.1046 21 20 20.1046 20 19V8L15 3Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M15 3V8H20"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Abrir
        </button>
        <button className="flow-card-button flow-card-button-secondary" onClick={handleExecute}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M8 5V19L19 12L8 5Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Ejecutar
        </button>
      </div>
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar Flow"
        message={`¿Estás seguro de eliminar el flow "${flow.name}"?`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ isOpen: false, message: '', type: 'error' })}
        title="Error"
        message={alertModal.message}
        type={alertModal.type}
      />
    </div>
  );
};

export default FlowCard;

