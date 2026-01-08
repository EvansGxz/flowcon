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

interface User {
  id: string;
  email: string;
  full_name?: string;
  is_active?: boolean;
  created_at?: string;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface RegisterData {
  email: string;
  password: string;
  full_name?: string;
}

/**
 * Guarda el token en localStorage
 */
export function saveToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Obtiene el token de localStorage
 */
export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Elimina el token de localStorage
 */
export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

/**
 * Guarda la información del usuario en localStorage
 */
export function saveUser(user: User): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

/**
 * Obtiene la información del usuario de localStorage
 */
export function getUser(): User | null {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
}

/**
 * Registra un nuevo usuario
 */
export async function register(userData: RegisterData): Promise<User> {
  try {
    // El endpoint de registro no requiere autenticación ni project_id
    const response = await apiPost<User>('/auth/register', userData, {}, false, false);
    return response;
  } catch (error) {
    // Mejorar mensaje de error para registro
    // No loggear errores esperados (400, 422 = validación)
    const apiError = error as { status?: number; message?: string };
    if (apiError.status === 400 || apiError.status === 422) {
      const regError = new Error(apiError.message || 'Error al registrar. Verifica que el email no esté ya registrado y que los datos sean válidos.') as Error & { status?: number };
      regError.status = apiError.status;
      throw regError;
    }
    // Solo loggear errores inesperados (500, errores de red, etc.)
    if (!apiError.status || apiError.status >= 500) {
      console.error('Error inesperado al registrar usuario:', error);
    }
    throw error;
  }
}

/**
 * Hace login y obtiene el token
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  try {
    // El endpoint de login no requiere autenticación ni project_id
    const response = await apiPost<LoginResponse>(
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
    const apiError = error as { status?: number };
    if (apiError.status === 401) {
      const authError = new Error('Credenciales inválidas. Por favor verifica tu email y contraseña.') as Error & { status?: number };
      authError.status = 401;
      throw authError;
    }
    // Solo loggear errores inesperados (500, errores de red, etc.)
    if (!apiError.status || apiError.status >= 500) {
      console.error('Error inesperado al hacer login:', error);
    }
    throw error;
  }
}

/**
 * Obtiene el perfil del usuario autenticado
 */
export async function getMe(): Promise<User> {
  try {
    const response = await apiGet<User>('/auth/me');
    
    // Guardar información del usuario
    if (response) {
      saveUser(response);
    }
    
    return response;
  } catch (error) {
    // Si el token es inválido, limpiar
    const apiError = error as { code?: number; status?: number; message?: string };
    if (apiError.code === 401 || apiError.status === 401 || apiError.message?.includes('401')) {
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
 */
export async function refreshToken(refreshTokenParam: string | null = null): Promise<LoginResponse> {
  try {
    const tokenToRefresh = refreshTokenParam || getToken();
    if (!tokenToRefresh) {
      throw new Error('No hay token para renovar');
    }

    // El endpoint de refresh requiere autenticación pero no project_id
    const response = await apiPost<LoginResponse>(
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
    const apiError = error as { status?: number };
    if (apiError.status === 401 || apiError.status === 400) {
      removeToken();
      // No loggear errores esperados (401, 400 = token inválido/expirado)
    } else {
      // Solo loggear errores inesperados
      if (!apiError.status || apiError.status >= 500) {
        console.error('Error inesperado al renovar token:', error);
      }
    }
    throw error;
  }
}

/**
 * Verifica si el usuario está autenticado
 */
export function isAuthenticated(): boolean {
  return !!getToken();
}

/**
 * Cierra la sesión
 * Según REDMIND_API_Frontend_Developer_Guide.md v1.1
 * Llama al endpoint /auth/logout para revocar el token en el servidor
 */
export async function logout(): Promise<void> {
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
        const apiError = error as { status?: number };
        if (apiError.status !== 401 && (!apiError.status || apiError.status >= 500)) {
          console.error('Error inesperado al cerrar sesión en el servidor:', error);
        }
      }
    }
  } catch (error) {
    // Si hay algún error, continuar con la limpieza local
    const apiError = error as { status?: number };
    if (!apiError.status || apiError.status >= 500) {
      console.error('Error inesperado al cerrar sesión:', error);
    }
  } finally {
    // Siempre limpiar el token localmente
    removeToken();
  }
}
