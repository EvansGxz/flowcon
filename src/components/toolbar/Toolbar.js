import { useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import JsonModal from '../modals/JsonModal';
import './Toolbar.css';

const Toolbar = () => {
  const { exportGraph, importGraph, validateLocal } = useEditorStore();
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const [jsonMode, setJsonMode] = useState('export'); // 'export' | 'import'
  const [validationResult, setValidationResult] = useState(null);

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
      alert('✅ El grafo es válido');
    } else {
      alert(`❌ Errores encontrados:\n${result.errors.join('\n')}`);
    }
  };

  const handleJsonModalClose = () => {
    setIsJsonModalOpen(false);
    setValidationResult(null);
  };

  const handleJsonImport = (jsonString) => {
    const result = importGraph(jsonString);
    if (result.success) {
      alert('✅ Grafo importado correctamente');
      setIsJsonModalOpen(false);
    } else {
      alert(`❌ Error al importar:\n${result.errors.join('\n')}`);
    }
  };

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-section">
          <button className="toolbar-button" onClick={handleExport} title="Exportar grafo">
            📥 Exportar
          </button>
          <button className="toolbar-button" onClick={handleImport} title="Importar grafo">
            📤 Importar
          </button>
          <button className="toolbar-button" onClick={handleValidate} title="Validar grafo">
            ✓ Validar
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
    </>
  );
};

export default Toolbar;

