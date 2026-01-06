import { useEffect, useState } from 'react';
import { useEditorStore } from '../../store/editorStore';
import './CredentialsList.css';

const CredentialsList = () => {
  const { checkConnection, connectionStatus } = useEditorStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      try {
        await checkConnection();
      } catch (err) {
        console.error('Error al verificar conexión:', err);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, [checkConnection]);

  if (loading) {
    return (
      <div className="credentials-list-container">
        <div className="credentials-list-loading">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="credentials-list-container">
      <div className="credentials-list-header">
        <div>
          <h1 className="credentials-list-title">Credenciales</h1>
          <p className="credentials-list-subtitle">
            Estado de conexión: <span className={`connection-status ${connectionStatus}`}>{connectionStatus}</span>
          </p>
        </div>
      </div>

      <div className="credentials-list-empty">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 15C15.866 15 19 11.866 19 8C19 4.13401 15.866 1 12 1C8.13401 1 5 4.13401 5 8C5 11.866 8.13401 15 12 15Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8.21 13.89L7 23L12 20L17 23L15.79 13.88"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <p>Gestión de Credenciales</p>
        <p className="credentials-list-empty-note">Próximamente</p>
      </div>
    </div>
  );
};

export default CredentialsList;
