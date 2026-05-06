import { useState } from 'react';
import { Play } from 'lucide-react';
import { useEditorStore } from '../../store/editorStore';
import ExecuteFlowModal from '../modals/ExecuteFlowModal';
import AlertModal from '../modals/AlertModal';

import './ExecuteButton.css';

const ExecuteButton = () => {
  const { nodes, selectedFlowId, executeFlow, validateLocal } = useEditorStore();
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; message: string; type: 'error' | 'info' | 'success' | 'warning' }>({ 
    isOpen: false, 
    message: '', 
    type: 'error' 
  });

  // Verificar si hay un nodo Trigger Manual
  // El nodo puede tener typeId en data o el tipo puede ser 'manual_trigger'
  const hasManualTrigger = nodes.some((node) => {
    const typeId = node.data?.typeId;
    const nodeType = node.type;
    
    // Verificar por typeId (formato interno)
    if (typeId === 'ap.trigger.manual') {
      return true;
    }
    
    // Verificar por tipo React Flow (nombre del componente)
    if (nodeType === 'manual_trigger') {
      return true;
    }
    
    return false;
  });

  // Si no hay trigger manual, no mostrar el botón
  if (!hasManualTrigger) {
    return null;
  }

  const handleExecuteClick = () => {
    // Validar primero
    const validation = validateLocal();
    if (!validation.valid) {
      setAlertModal({ 
        isOpen: true, 
        message: `El flow no es válido:\n${validation.errors.join('\n')}`, 
        type: 'error' 
      });
      return;
    }
    setShowExecuteModal(true);
  };

  const handleExecuteConfirm = async (timeoutSeconds: number | null = null) => {
    setShowExecuteModal(false);
    try {
      console.log('[ExecuteButton] Iniciando ejecución con timeout:', timeoutSeconds);
      const result = await executeFlow(timeoutSeconds);
      console.log('[ExecuteButton] Resultado de ejecución:', result);
      
      if (result.success) {
        // Quedarse en el canvas -- el polling actualiza los nodos en tiempo real
        // El usuario puede ver el progreso directamente en el canvas
        console.log('[ExecuteButton] Ejecucion iniciada, polling activo en canvas');
      } else {
        setAlertModal({ 
          isOpen: true, 
          message: `Error al ejecutar: ${result.error}`, 
          type: 'error' 
        });
      }
    } catch (error) {
      console.error('[ExecuteButton] Error al ejecutar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setAlertModal({ 
        isOpen: true, 
        message: `Error al ejecutar: ${errorMessage}`, 
        type: 'error' 
      });
    }
  };

  return (
    <>
      <button 
        className="execute-button"
        onClick={handleExecuteClick}
        title="Ejecutar flow"
        aria-label="Ejecutar flow"
      >
        <Play size={20} />
        <span className="execute-button-text">Ejecutar</span>
      </button>
      <ExecuteFlowModal
        isOpen={showExecuteModal}
        onClose={() => setShowExecuteModal(false)}
        onConfirm={handleExecuteConfirm}
        defaultTimeout={300}
      />
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ isOpen: false, message: '', type: 'error' })}
        title="Error"
        message={alertModal.message}
        type={alertModal.type}
      />
    </>
  );
};

export default ExecuteButton;
