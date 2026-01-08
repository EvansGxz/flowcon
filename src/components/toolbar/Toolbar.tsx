import { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import JsonModal from '../modals/JsonModal';
import AlertModal from '../modals/AlertModal';
import './Toolbar.css';

const Toolbar = () => {
  const { exportGraph, importGraph, validateLocal } = useEditorStore();
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonMode, setJsonMode] = useState<'export' | 'import'>('export');
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [alertModal, setAlertModal] = useState<{ isOpen: boolean; message: string; type: 'info' | 'success' | 'warning' | 'error' }>({ 
    isOpen: false, 
    message: '', 
    type: 'info' 
  });

  const handleExport = () => {
    setJsonMode('export');
    setIsJsonModalOpen(true);
  };

  const handleImport = () => {
    setJsonMode('import');
    setIsJsonModalOpen(true);
  };

  const handleValidate = () => {
    const result = validateLocal();
    setValidationResult(result);
    
    if (result.valid) {
      setAlertModal({ isOpen: true, message: 'El grafo es válido', type: 'success' });
    } else {
      setAlertModal({ 
        isOpen: true, 
        message: `Errores encontrados:\n${result.errors.join('\n')}`, 
        type: 'error' 
      });
    }
  };

  const handleJsonModalClose = () => {
    setIsJsonModalOpen(false);
    setValidationResult(null);
  };

  const handleJsonImport = (jsonString: string): { success: boolean; errors?: string[] } => {
    const result = importGraph(jsonString);
    if (result.success) {
      setAlertModal({ isOpen: true, message: 'Grafo importado correctamente', type: 'success' });
      setIsJsonModalOpen(false);
      return { success: true };
    } else {
      setAlertModal({ 
        isOpen: true, 
        message: `Error al importar:\n${(result.errors || []).join('\n')}`, 
        type: 'error' 
      });
      return { success: false, errors: result.errors };
    }
  };

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-section">
          <button className="toolbar-button" onClick={handleExport} title="Exportar grafo">
            Exportar
          </button>
          <button className="toolbar-button" onClick={handleImport} title="Importar grafo">
            Importar
          </button>
          <button className="toolbar-button" onClick={handleValidate} title="Validar grafo">
            Validar
          </button>
        </div>
        {validationResult && !validationResult.valid && (
          <div className="toolbar-validation-errors">
            <strong>Errores:</strong>
            <ul>
              {validationResult.errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {isJsonModalOpen && (
        <JsonModal
          mode={jsonMode}
          onClose={handleJsonModalClose}
          onImport={handleJsonImport}
          initialJson={jsonMode === 'export' ? exportGraph() : ''}
        />
      )}
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ isOpen: false, message: '', type: 'info' })}
        title={alertModal.type === 'error' ? 'Error' : alertModal.type === 'success' ? 'Éxito' : 'Información'}
        message={alertModal.message}
        type={alertModal.type}
      />
    </>
  );
};

export default Toolbar;
