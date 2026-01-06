/**
 * Servicio de autenticación
 * Según REDMIND_API_Frontend_Developer_Guide.md v1.1
 * 
 * Endpoints:
 * - POST /api/v1/auth/register - Registro de usuario
 * - POST /api/v1/auth/token - Login / Obtener token
 * - GET /api/v1/auth/me - Perfil del usuario
 * - POST /api/v1/auth/refresh - Renovar token
 * - POST /api/v1/auth/logout - Cerrar sesión
 */

import { apiGet, apiPost } from './apiService';

const TOKEN_KEY = 'redmind_access_token';
const USER_KEY = 'redmind_user';

/**
 * Guarda el token en localStorage
 * @param {string} token - Access token
 */
export function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Obtiene el token de localStorage
 * @returns {string|null}
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Elimina el token de localStorage
 */
export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Guarda la información del usuario en localStorage
 * @param {Object} user - Información del usuario
 */
export function saveUser(user) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Obtiene la información del usuario de localStorage
 * @returns {Object|null}
 */
export function getUser() {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Registra un nuevo usuario
 * @param {Object} userData - {email: string, password: string, full_name?: string}
 * @returns {Promise<{id: string, email: string}>}
 */
export async function register(userData) {
  try {
    // El endpoint de registro no requiere autenticación ni project_id
    const response = await apiPost('/auth/register', userData, {}, false, false);
    return response;
  } catch (error) {
    // Mejorar mensaje de error para registro
    // No loggear errores esperados (400, 422 = validación)
    if (error.status === 400 || error.status === 422) {
      const regError = new Error(error.message || 'Error al registrar. Verifica que el email no esté ya registrado y que los datos sean válidos.');
      regError.status = error.status;
      throw regError;
    }
    // Solo loggear errores inesperados (500, errores de red, etc.)
    if (!error.status || error.status >= 500) {
      console.error('Error inesperado al registrar usuario:', error);
    }
    throw error;
  }
}

/**
 * Hace login y obtiene el token
 * @param {string} email - Email del usuario
 * @param {string} password - Contraseña
 * @returns {Promise<{access_token: string, token_type: string, expires_in: number}>}
 */
export async function login(email, password) {
  try {
    // El endpoint de login no requiere autenticación ni project_id
    const response = await apiPost(
      '/auth/token',
      {
        grant_type: 'password',
        email,
        password,
      },
      {},
      false,
      false
    );

    // Guardar el token
    if (response.access_token) {
      saveToken(response.access_token);
    }

    return response;
  } catch (error) {
    // Re-lanzar el error con mensaje mejorado
    // No loggear errores esperados (401 = credenciales inválidas)
    if (error.status === 401) {
      const authError = new Error('Credenciales inválidas. Por favor verifica tu email y contraseña.');
      authError.status = 401;
      throw authError;
    }
    // Solo loggear errores inesperados (500, errores de red, etc.)
    if (!error.status || error.status >= 500) {
      console.error('Error inesperado al hacer login:', error);
    }
    throw error;
  }
}

/**
 * Obtiene el perfil del usuario autenticado
 * @returns {Promise<{id: string, email: string, full_name: string, is_active: boolean, created_at: string}>}
 */
export async function getMe() {
  try {
    const response = await apiGet('/auth/me');
    
    // Guardar información del usuario
    if (response) {
      saveUser(response);
    }
    
    return response;
  } catch (error) {
    // Si el token es inválido, limpiar
    if (error.code === 401 || error.status === 401 || error.message?.includes('401')) {
      removeToken();
      // No loggear errores 401 esperados (token inválido/expirado)
    } else {
      // Solo loggear errores inesperados
      console.error('Error inesperado al obtener perfil:', error);
    }
    throw error;
  }
}

/**
 * Renueva el token de acceso
 * Según REDMIND_API_Frontend_Developer_Guide.md v1.1
 * El refresh_token es el access_token actual que quieres renovar
 * @param {string} refreshToken - El access_token actual (opcional, usa el token guardado si no se proporciona)
 * @returns {Promise<{access_token: string, token_type: string, expires_in: number}>}
 */
export async function refreshToken(refreshTokenParam = null) {
  try {
    const tokenToRefresh = refreshTokenParam || getToken();
    if (!tokenToRefresh) {
      throw new Error('No hay token para renovar');
    }

    // El endpoint de refresh requiere autenticación pero no project_id
    const response = await apiPost(
      '/auth/refresh',
      { refresh_token: tokenToRefresh },
      {},
      false,
      true // Requiere auth (el token actual se usa como refresh_token)
    );

    // Guardar el nuevo token
    if (response.access_token) {
      saveToken(response.access_token);
    }

    return response;
  } catch (error) {
    // Si el refresh falla, limpiar token y redirigir a login
    if (error.status === 401 || error.status === 400) {
      removeToken();
      // No loggear errores esperados (401, 400 = token inválido/expirado)
    } else {
      // Solo loggear errores inesperados
      if (!error.status || error.status >= 500) {
        console.error('Error inesperado al renovar token:', error);
      }
    }
    throw error;
  }
}

/**
 * Verifica si el usuario está autenticado
 * @returns {boolean}
 */
export function isAuthenticated() {
  return !!getToken();
}

/**
 * Cierra la sesión
 * Según REDMIND_API_Frontend_Developer_Guide.md v1.1
 * Llama al endpoint /auth/logout para revocar el token en el servidor
 * @returns {Promise<void>}
 */
export async function logout() {
  try {
    const token = getToken();
    if (token) {
      try {
        // Intentar revocar el token en el servidor
        // El endpoint de logout requiere autenticación pero no project_id
        await apiPost('/auth/logout', {}, {}, false, true);
      } catch (error) {
        // Si falla el logout en el servidor, continuar con la limpieza local
        // No loggear errores esperados (401 = token ya inválido/expirado)
        if (error.status !== 401 && (!error.status || error.status >= 500)) {
          console.error('Error inesperado al cerrar sesión en el servidor:', error);
        }
      }
    }
  } catch (error) {
    // Si hay algún error, continuar con la limpieza local
    if (!error.status || error.status >= 500) {
      console.error('Error inesperado al cerrar sesión:', error);
    }
  } finally {
    // Siempre limpiar el token localmente
    removeToken();
  }
}
