import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated, getMe } from '../../services/authService';

/**
 * Componente que protege rutas requiriendo autenticación
 * Verifica el token al cargar y redirige a /auth si no está autenticado
 */
const ProtectedRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verificar si hay token
        if (!isAuthenticated()) {
          setIsAuth(false);
          setIsLoading(false);
          return;
        }

        // Verificar que el token sea válido llamando a /auth/me
        try {
          await getMe();
          setIsAuth(true);
        } catch (error) {
          // Token inválido o expirado
          setIsAuth(false);
        }
      } catch (error) {
        console.error('Error al verificar autenticación:', error);
        setIsAuth(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    // Mostrar un loader mientras se verifica
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100vh',
        color: 'var(--text-primary)'
      }}>
        <div>Cargando...</div>
      </div>
    );
  }

  if (!isAuth) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

export default ProtectedRoute;
