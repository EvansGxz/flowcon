/**
 * Servicio de health check
 * GET /api/v1/health
 * Según REDMIND_Semana2_Backend_Completo_v1_API.pdf
 */

import { apiGet } from './apiService';

/**
 * Verifica el estado de conexión con el backend
 * @returns {Promise<{status: string, version?: string, timestamp?: string, api_version?: string}>}
 */
export async function checkHealth() {
  try {
    // Health check no requiere project_id ni autenticación
    const result = await apiGet('/health', {}, false, false);
    // El backend puede retornar: { status: 'ok', version: '...', timestamp: '...' }
    return {
      status: result.status === 'ok' ? 'connected' : 'offline',
      ...result,
    };
  } catch (error) {
    console.error('Error al verificar health:', error);
    return {
      status: 'offline',
      error: error.message,
    };
  }
}

