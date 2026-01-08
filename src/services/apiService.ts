/**
 * Servicio centralizado para API v1
 * Todos los endpoints deben usar /api/v1/
 * Incluye automáticamente el header X-Project-Id según REDMIND_Projects_System.md
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.103.10:8000';
const API_VERSION = 'v1';
const API_PREFIX = `/api/${API_VERSION}`;

interface ApiError extends Error {
  code?: string;
  status?: number;
  path?: string;
  nodeId?: string;
  detail?: unknown;
  handled?: boolean;
}

/**
 * Obtiene el access_token de localStorage
 */
function getAccessToken(): string | null {
  try {
    return localStorage.getItem('redmind_access_token');
  } catch (e) {
    console.error('Error al obtener access_token de localStorage:', e);
    return null;
  }
}

/**
 * Obtiene el project_id actual del store o localStorage
 * Usa localStorage como fuente principal para evitar dependencias circulares
 * El store actualiza localStorage cuando cambia el proyecto
 */
function getCurrentProjectId(): string | null {
  try {
    return localStorage.getItem('redmind_currentProjectId');
  } catch (e) {
    console.error('Error al obtener project_id de localStorage:', e);
    return null;
  }
}

/**
 * Realiza una petición HTTP al API v1
 * Incluye automáticamente los headers Authorization y X-Project-Id según REDMIND_API_Frontend_Developer_Guide.md
 */
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  requireProjectId: boolean = true,
  requireAuth: boolean = true
): Promise<Response> {
  const url = `${API_BASE_URL}${API_PREFIX}${endpoint}`;
  
  // Obtener token y project_id
  const token = getAccessToken();
  const projectId = getCurrentProjectId();
  
  // Construir headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as HeadersInit),
  };
  
  // Agregar Authorization header si es requerido y el token está disponible
  // Endpoints de autenticación no requieren token
  const skipAuthEndpoints = ['/auth/register', '/auth/token'];
  const shouldIncludeAuth = requireAuth && 
                           token && 
                           !skipAuthEndpoints.some(skip => endpoint.startsWith(skip));
  
  if (shouldIncludeAuth) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  
  // Agregar X-Project-Id si está disponible
  // Algunos endpoints como /health y /projects no requieren project_id
  // /flows puede omitir project_id si requireProjectId=false (para obtener todos los flows)
  const skipProjectIdEndpoints = ['/health', '/projects', '/auth'];
  const shouldIncludeProjectId = requireProjectId && 
                                 projectId && 
                                 !skipProjectIdEndpoints.some(skip => endpoint.startsWith(skip));
  
  if (shouldIncludeProjectId) {
    (headers as Record<string, string>)['X-Project-Id'] = projectId;
  }

  const response = await fetch(url, {
    ...options,
    method: options.method || 'GET',
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData: { detail?: unknown; message?: string; code?: string; path?: string; nodeId?: string };
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { detail: errorText || `HTTP error! status: ${response.status}` };
    }
    
    // Extraer mensaje de error del backend
    // El backend puede retornar: { detail: "mensaje" } o { detail: { error: "mensaje" } }
    let errorMessage = `HTTP error! status: ${response.status}`;
    if (errorData.detail) {
      if (typeof errorData.detail === 'string') {
        errorMessage = errorData.detail;
      } else if (typeof errorData.detail === 'object' && errorData.detail !== null) {
        const detail = errorData.detail as { error?: string; message?: string };
        if (detail.error) {
          errorMessage = detail.error;
        } else if (detail.message) {
          errorMessage = detail.message;
        }
      }
    } else if (errorData.message) {
      errorMessage = errorData.message;
    }
    
    // Manejar error 401 (token expirado o inválido)
    // Solo redirigir si NO es un endpoint de autenticación (login/register)
    const isAuthEndpoint = endpoint.startsWith('/auth/register') || endpoint.startsWith('/auth/token');
    if (response.status === 401 && requireAuth && !isAuthEndpoint) {
      // Limpiar token y redirigir a login
      localStorage.removeItem('redmind_access_token');
      localStorage.removeItem('redmind_user');
      
      // Solo redirigir si no estamos ya en /auth
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    }
    
    // Crear error con información estructurada
    // NOTA: El navegador mostrará automáticamente errores HTTP (401, 400, etc.) en la consola.
    // Esto es comportamiento normal del navegador y no se puede evitar.
    // Los errores esperados (401, 400, 422) se manejan silenciosamente sin logs adicionales.
    const error = new Error(errorMessage) as ApiError;
    error.code = errorData.code;
    error.status = response.status;
    error.path = errorData.path;
    error.nodeId = errorData.nodeId;
    error.detail = errorData.detail;
    // Marcar como error manejado para evitar que se propague como error no manejado
    error.handled = true;
    throw error;
  }

  return response;
}

/**
 * Realiza una petición GET
 */
export async function apiGet<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  requireProjectId: boolean = true,
  requireAuth: boolean = true
): Promise<T> {
  const response = await apiRequest(endpoint, { ...options, method: 'GET' }, requireProjectId, requireAuth);
  return response.json();
}

/**
 * Realiza una petición POST
 */
export async function apiPost<T = unknown>(
  endpoint: string,
  data: unknown,
  options: RequestInit = {},
  requireProjectId: boolean = true,
  requireAuth: boolean = true
): Promise<T> {
  const response = await apiRequest(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data),
  }, requireProjectId, requireAuth);
  return response.json();
}

/**
 * Realiza una petición PUT
 */
export async function apiPut<T = unknown>(
  endpoint: string,
  data: unknown,
  options: RequestInit = {},
  requireProjectId: boolean = true,
  requireAuth: boolean = true
): Promise<T> {
  const response = await apiRequest(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data),
  }, requireProjectId, requireAuth);
  return response.json();
}

/**
 * Realiza una petición DELETE
 */
export async function apiDelete<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
  requireProjectId: boolean = true,
  requireAuth: boolean = true
): Promise<T | null> {
  const response = await apiRequest(endpoint, { ...options, method: 'DELETE' }, requireProjectId, requireAuth);
  if (response.status === 204 || response.status === 200) {
    return null;
  }
  return response.json();
}

export { API_BASE_URL, API_VERSION, API_PREFIX };
