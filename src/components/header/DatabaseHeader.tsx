import { useState, useRef, useEffect, MouseEvent } from 'react';
import { Download, Upload, Database, ChevronDown } from 'lucide-react';
import type { Node as ReactFlowNode, Edge } from '@xyflow/react';
import type { EntityNodeData, SQLDialect } from '../../types/database';
import { exportToSQL, importFromSQL } from '../../utils/sqlExporter';
import JsonModal from '../modals/JsonModal';
import AlertModal from '../modals/AlertModal';
import './DatabaseHeader.css';

interface DatabaseHeaderProps {
  nodes: ReactFlowNode<EntityNodeData>[];
  edges: Edge[];
  onImport: (nodes: ReactFlowNode<EntityNodeData>[], edges: Edge[]) => void;
  selectedDatabase?: string;
  databases?: string[];
  onDatabaseChange?: (databaseName: string) => void;
}

const DatabaseHeader = ({
  nodes,
  edges,
  onImport,
  selectedDatabase,
  databases = [],
  onDatabaseChange,
}: DatabaseHeaderProps) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isSqlModalOpen, setSqlModalOpen] = useState(false);
  const [sqlMode, setSqlMode] = useState<'export' | 'import'>('export');
  const [selectedDialect, setSelectedDialect] = useState<SQLDialect>('postgresql');
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
  }>({
    isOpen: false,
    message: '',
    type: 'info',
  });
  
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú de exportar al hacer clic fuera
  useEffect(() => {
    if (!showExportMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      
      if (showExportMenu && exportMenuRef.current && target) {
        const isClickInside = exportMenuRef.current.contains(target);
        if (!isClickInside) {
          setShowExportMenu(false);
        }
      }
    };

    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside as unknown as EventListener, true);
      document.addEventListener('click', handleClickOutside as unknown as EventListener, true);
    }, 10);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside as unknown as EventListener, true);
      document.removeEventListener('click', handleClickOutside as unknown as EventListener, true);
    };
  }, [showExportMenu]);

  const handleExport = (dialect: SQLDialect) => {
    setSelectedDialect(dialect);
    setSqlMode('export');
    setSqlModalOpen(true);
    setShowExportMenu(false);
  };

  const handleImport = () => {
    setSqlMode('import');
    setSqlModalOpen(true);
  };

  const handleSqlExport = () => {
    const sql = exportToSQL(nodes, edges, selectedDialect, selectedDatabase);
    return sql;
  };

  const handleSqlImport = (sqlString: string) => {
    try {
      const result = importFromSQL(sqlString, selectedDialect);
      if (result.nodes.length > 0) {
        onImport(result.nodes, result.edges);
        setAlertModal({
          isOpen: true,
          message: `Esquema importado correctamente. ${result.nodes.length} tabla(s) importada(s).`,
          type: 'success',
        });
        setSqlModalOpen(false);
      } else {
        setAlertModal({
          isOpen: true,
          message: 'No se encontraron tablas válidas en el SQL proporcionado.',
          type: 'warning',
        });
      }
    } catch (error) {
      setAlertModal({
        isOpen: true,
        message: `Error al importar SQL: ${error instanceof Error ? error.message : 'Error desconocido'}`,
        type: 'error',
      });
    }
  };

  return (
    <>
      <header className="database-header">
        <div className="database-header-left">
          <div className="database-header-logo">
            <Database size={20} />
            <span className="database-header-logo-text">Databases</span>
          </div>
          
          {databases.length > 0 && (
            <div className="database-header-select-wrapper">
              <select
                className="database-header-select"
                value={selectedDatabase || ''}
                onChange={(e) => onDatabaseChange?.(e.target.value)}
              >
                <option value="">Seleccionar base de datos</option>
                {databases.map((db) => (
                  <option key={db} value={db}>
                    {db}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="database-header-select-icon" />
            </div>
          )}
        </div>

        <div className="database-header-right">
          <div className="database-header-control-wrapper" ref={exportMenuRef}>
            <button
              className="database-header-control-button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              aria-label="Exportar"
              title="Exportar"
            >
              <Upload size={18} />
            </button>
            {showExportMenu && (
              <div className="database-header-export-menu">
                <button
                  className="database-header-export-menu-item"
                  onClick={() => handleExport('postgresql')}
                >
                  <Database size={16} />
                  <span>Exportar a PostgreSQL</span>
                </button>
                <button
                  className="database-header-export-menu-item"
                  onClick={() => handleExport('sqlite')}
                >
                  <Database size={16} />
                  <span>Exportar a SQLite</span>
                </button>
                <button
                  className="database-header-export-menu-item"
                  onClick={() => handleExport('sqlserver')}
                >
                  <Database size={16} />
                  <span>Exportar a SQL Server</span>
                </button>
              </div>
            )}
          </div>

          <button
            className="database-header-control-button"
            onClick={handleImport}
            aria-label="Importar SQL"
            title="Importar SQL"
          >
            <Download size={18} />
          </button>
        </div>
      </header>

      {/* Modal SQL */}
      {isSqlModalOpen && (
        <JsonModal
          mode={sqlMode}
          onClose={() => {
            setSqlModalOpen(false);
          }}
          onImport={handleSqlImport}
          initialJson={sqlMode === 'export' ? handleSqlExport() : ''}
          title={sqlMode === 'export' ? 'Exportar SQL' : 'Importar SQL'}
          contentType="sql"
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

export default DatabaseHeader;
