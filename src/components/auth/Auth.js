import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register, login, getMe } from '../../services/authService';
import './Auth.css';

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estado del formulario
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Limpiar error al escribir
    if (error) setError(null);
  };

  const validateForm = () => {
    if (isLogin) {
      if (!formData.email || !formData.password) {
        setError('Por favor completa todos los campos');
        return false;
      }
    } else {
      if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
        setError('Por favor completa todos los campos');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Las contraseñas no coinciden');
        return false;
      }
      if (formData.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Login según REDMIND_API_Frontend_Developer_Guide.md
        await login(formData.email, formData.password);
        
        // Obtener información del usuario
        await getMe();
        
        // Redirigir a proyectos
        navigate('/projects');
      } else {
        // Registro según REDMIND_API_Frontend_Developer_Guide.md
        await register({
          email: formData.email,
          password: formData.password,
          full_name: formData.fullName || undefined,
        });
        
        // Cambiar a modo login después del registro
        setIsLogin(true);
        setFormData({
          fullName: '',
          email: formData.email, // Mantener el email
          password: '',
          confirmPassword: '',
        });
        setError(null);
        // Mostrar mensaje de éxito
        alert('Registro exitoso. Por favor inicia sesión.');
      }
    } catch (err) {
      // Manejar errores del backend
      let errorMessage = 'Ocurrió un error. Por favor intenta de nuevo.';
      
      // El error ya viene con el mensaje correcto desde authService
      if (err.message) {
        errorMessage = err.message;
      } else if (err.status === 401) {
        errorMessage = 'Credenciales inválidas. Por favor verifica tu email y contraseña.';
      } else if (err.status === 400 || err.status === 422) {
        // Intentar extraer mensaje del detalle
        if (err.detail) {
          if (typeof err.detail === 'string') {
            errorMessage = err.detail;
          } else if (typeof err.detail === 'object') {
            errorMessage = err.detail.error || err.detail.message || JSON.stringify(err.detail);
          }
        } else {
          errorMessage = 'Datos inválidos. Por favor verifica la información ingresada.';
        }
      } else if (err.status === 500) {
        errorMessage = 'Error del servidor. Por favor intenta más tarde.';
      }
      
      setError(errorMessage);
      // No loggear errores esperados (401, 400, 422 son errores de negocio normales)
      // Solo loggear errores inesperados (500, errores de red, etc.)
      if (!err.status || err.status >= 500) {
        console.error('Error inesperado en autenticación:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setFormData({
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    });
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-title">{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</h1>
          <p className="auth-subtitle">
            {isLogin
              ? 'Ingresa tus credenciales para continuar'
              : 'Crea una cuenta para comenzar'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="auth-form-group">
              <label htmlFor="fullName">Nombre Completo</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Ej: Juan Pérez"
                required={!isLogin}
                disabled={loading}
              />
            </div>
          )}

          <div className="auth-form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="tu@correo.com"
              required
              disabled={loading}
            />
          </div>

          <div className="auth-form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="••••••••"
              required
              disabled={loading}
            />
          </div>

          {!isLogin && (
            <div className="auth-form-group">
              <label htmlFor="confirmPassword">Confirmar Contraseña</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="••••••••"
                required={!isLogin}
                disabled={loading}
              />
            </div>
          )}

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="auth-submit-button" disabled={loading}>
            {loading ? 'Procesando...' : isLogin ? 'Iniciar Sesión' : 'Registrarse'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? '¿No tienes una cuenta? ' : '¿Ya tienes una cuenta? '}
            <button type="button" onClick={toggleMode} className="auth-toggle-button">
              {isLogin ? 'Registrarse' : 'Iniciar Sesión'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
