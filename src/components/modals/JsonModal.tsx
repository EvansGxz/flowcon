import { useState, useEffect, ChangeEvent, KeyboardEvent } from 'react';
import './JsonModal.css';

interface JsonModalProps {
  mode: 'export' | 'import';
  onClose: () => void;
  onImport?: (jsonString: string) => void | { success: boolean; errors?: string[] };
  initialJson?: string;
  title?: string;
  contentType?: 'json' | 'sql'; // Tipo de contenido: JSON o SQL
}

const JsonModal = ({ mode, onClose, onImport, initialJson = '', title, contentType = 'json' }: JsonModalProps) => {
  const [jsonText, setJsonText] = useState(initialJson);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setJsonText(initialJson);
    setError(null);
  }, [initialJson, mode]);

  // Cerrar modal con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape as unknown as EventListener);
    return () => document.removeEventListener('keydown', handleEscape as unknown as EventListener);
  }, [onClose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonText);
    // Feedback visual podría agregarse aquí
  };

  const handleImport = () => {
    if (!onImport) return;
    
    try {
      // Si es SQL, no validar como JSON
      if (contentType === 'sql') {
        onImport(jsonText);
        setError(null);
        return;
      }
      
      // Si onImport retorna un objeto con success, validar JSON primero
      if (mode === 'import' && typeof onImport === 'function') {
        const result = onImport(jsonText);
        // Si hay errores en el resultado, mostrarlos
        if (result && typeof result === 'object' && 'success' in result && !result.success && result.errors) {
          setError(result.errors.join('\n'));
        } else {
          setError(null);
        }
      } else {
        // Llamar directamente sin validar JSON (para SQL u otros formatos)
        onImport(jsonText);
        setError(null);
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Error desconocido';
      setError(`Error: ${errorMessage}`);
    }
  };

  const formatSQL = (sql: string): string => {
    // Formateador básico de SQL
    let formatted = sql
      // Agregar nueva línea después de punto y coma
      .replace(/;/g, ';\n')
      // Agregar nueva línea después de CREATE TABLE
      .replace(/CREATE TABLE/g, '\nCREATE TABLE')
      // Agregar nueva línea después de ALTER TABLE
      .replace(/ALTER TABLE/g, '\nALTER TABLE')
      // Agregar indentación para columnas dentro de CREATE TABLE
      .replace(/\(\s*([^)]+)\s*\)/g, (match, content) => {
        // Dividir por comas y agregar indentación
        const lines = content.split(',').map((line: string) => '  ' + line.trim());
        return '(\n' + lines.join(',\n') + '\n)';
      })
      // Limpiar líneas vacías múltiples
      .replace(/\n{3,}/g, '\n\n')
      .trim();
    
    return formatted;
  };

  const handleFormat = () => {
    try {
      if (contentType === 'sql') {
        // Formatear SQL
        const formatted = formatSQL(jsonText);
        setJsonText(formatted);
        setError(null);
      } else {
        // Formatear JSON
        const parsed = JSON.parse(jsonText);
        setJsonText(JSON.stringify(parsed, null, 2));
        setError(null);
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Error desconocido';
      setError(`No se puede formatear: ${errorMessage}`);
    }
  };

  return (
    <div className="json-modal-overlay" onClick={onClose}>
      <div className="json-modal" onClick={(e) => e.stopPropagation()}>
        <div className="json-modal-header">
          <h3>{title || (mode === 'export' ? 'Exportar Grafo' : 'Importar Grafo')}</h3>
          <button className="json-modal-close" onClick={onClose}>
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
        
        <div className="json-modal-content">
          {mode === 'export' && (
            <div className="json-modal-actions">
            <button className="json-modal-button" onClick={handleCopy}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '6px' }}>
                <path
                  d="M8 5.00005C7.01165 5.00005 6.49359 5.00005 6.09202 5.21799C5.71569 5.40973 5.40973 5.71569 5.21799 6.09202C5 6.49359 5 7.01165 5 8.00005V16C5 16.9884 5 17.5065 5.21799 17.908C5.40973 18.2843 5.71569 18.5903 6.09202 18.782C6.49359 19 7.01165 19 8 19H16C16.9884 19 17.5065 19 17.908 18.782C18.2843 18.5903 18.5903 18.2843 18.782 17.908C19 17.5065 19 16.9884 19 16V8.00005C19 7.01165 19 6.49359 18.782 6.09202C18.5903 5.71569 18.2843 5.40973 17.908 5.21799C17.5065 5.00005 16.9884 5.00005 16 5.00005H8Z"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M9 3C8.01165 3 7.49359 3 7.09202 3.21799C6.71569 3.40973 6.40973 3.71569 6.21799 4.09202C6 4.49359 6 5.01165 6 6V8H19V16C19 16.9884 19 17.5065 18.782 17.908C18.5903 18.2843 18.2843 18.5903 17.908 18.782C17.5065 19 16.9884 19 16 19"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
              Copiar
            </button>
            <button className="json-modal-button" onClick={handleFormat}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '6px' }}>
                <path
                  d="M4 7C4 6.06812 4 5.60218 4.15224 5.23463C4.35523 4.74458 4.74458 4.35523 5.23463 4.15224C5.60218 4 6.06812 4 7 4H17C17.9319 4 18.3978 4 18.7654 4.15224C19.2554 4.35523 19.6448 4.74458 19.8478 5.23463C20 5.60218 20 6.06812 20 7M4 7H20M4 7V17C4 17.9319 4 18.3978 4.15224 18.7654C4.35523 19.2554 4.74458 19.6448 5.23463 19.8478C5.60218 20 6.06812 20 7 20H17C17.9319 20 18.3978 20 18.7654 19.8478C19.2554 19.6448 19.6448 19.2554 19.8478 18.7654C20 18.3978 20 17.9319 20 17V7"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M8 12H16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              Formatear
            </button>
            </div>
          )}
          
          <textarea
            className={`json-modal-textarea ${error ? 'error' : ''}`}
            value={jsonText}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
              setJsonText(e.target.value);
              setError(null);
            }}
            readOnly={mode === 'export'}
            placeholder={mode === 'import' ? (contentType === 'sql' ? 'Pega el SQL aquí...' : 'Pega el JSON del grafo aquí...') : ''}
          />
          
          {error && (
            <div className="json-modal-error">{error}</div>
          )}
          
          {mode === 'import' && (
            <div className="json-modal-actions">
              <button className="json-modal-button json-modal-button-primary" onClick={handleImport}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '6px' }}>
                  <path
                    d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M17 10L12 5L7 10"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 5V15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Importar
              </button>
              <button className="json-modal-button" onClick={onClose}>
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JsonModal;
