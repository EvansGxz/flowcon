/**
 * Servicio de health check
 * GET /api/v1/health
 * Según REDMIND_Semana2_Backend_Completo_v1_API.pdf
 */

import { apiGet } from './apiService';
import type { HealthCheck } from '../types';

interface HealthResponse {
  status: string;
  version?: string;
  timestamp?: string;
  api_version?: string;
}

/**
 * Verifica el estado de conexión con el backend
 */
export async function checkHealth(): Promise<HealthCheck> {
  try {
    // Health check no requiere project_id ni autenticación
    const result = await apiGet<HealthResponse>('/health', {}, false, false);
    // El backend puede retornar: { status: 'ok', version: '...', timestamp: '...' }
    return {
      status: result.status === 'ok' ? 'connected' : 'offline',
      version: result.version,
    };
  } catch (error) {
    const apiError = error as { message?: string };
    console.error('Error al verificar health:', error);
    return {
      status: 'offline',
      error: apiError.message || 'Error desconocido',
    };
  }
}
