import { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import ExecuteFlowModal from '../modals/ExecuteFlowModal';
import './ExecuteButton.css';

const ExecuteButton = () => {
  const { nodes, selectedFlowId, executeFlow, validateLocal } = useEditorStore();
  const [showExecuteModal, setShowExecuteModal] = useState(false);

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
      alert(`❌ El flow no es válido:\n${validation.errors.join('\n')}`);
      return;
    }
    setShowExecuteModal(true);
  };

  const handleExecuteConfirm = async (timeoutSeconds = null) => {
    setShowExecuteModal(false);
    try {
      console.log('🚀 [ExecuteButton] Iniciando ejecución con timeout:', timeoutSeconds);
      const result = await executeFlow(timeoutSeconds);
      console.log('✅ [ExecuteButton] Resultado de ejecución:', result);
      
      if (result.success) {
        // Para flows persistidos, el backend retorna inmediatamente y el polling se inicia automáticamente
        // Navegar a la vista de runs para ver el progreso en tiempo real
        if (selectedFlowId && result.run?.id) {
          // Navegar directamente al detalle del run para ver el progreso
          setTimeout(() => {
            window.location.href = `/runs/${result.run.id}`;
          }, 500);
        } else if (selectedFlowId) {
          // Si no hay runId pero hay flowId, navegar a la lista de runs
          setTimeout(() => {
            window.location.href = `/runs?flowId=${selectedFlowId}`;
          }, 500);
        } else if (window.location.pathname !== '/runs') {
          // Para flows de prueba (in-memory), navegar a runs
          setTimeout(() => {
            window.location.href = '/runs';
          }, 500);
        }
      } else {
        alert(`❌ Error al ejecutar: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ [ExecuteButton] Error al ejecutar:', error);
      alert(`❌ Error al ejecutar: ${error.message}`);
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
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M8 5V19L19 12L8 5Z"
            fill="currentColor"
          />
        </svg>
        <span className="execute-button-text">Ejecutar</span>
      </button>
      <ExecuteFlowModal
        isOpen={showExecuteModal}
        onClose={() => setShowExecuteModal(false)}
        onConfirm={handleExecuteConfirm}
        defaultTimeout={300}
      />
    </>
  );
};

export default ExecuteButton;
