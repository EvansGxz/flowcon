/**
 * Servicio de validación remota
 * POST /api/v1/graphs/validate
 */

import { apiPost } from './apiService';
import type { GraphDefinition, ValidationResult } from '../types';

interface ValidationResponse {
  valid: boolean;
  errors?: string[];
  warnings?: string[];
}

/**
 * Valida un grafo en el servidor
 */
export async function validateGraphRemote(graphDefinition: GraphDefinition): Promise<ValidationResult> {
  try {
    const result = await apiPost<ValidationResponse>('/graphs/validate', graphDefinition);
    return {
      valid: result.valid || false,
      errors: result.errors || [],
    };
  } catch (error) {
    const apiError = error as { message?: string };
    console.error('Error al validar grafo remotamente:', error);
    return {
      valid: false,
      errors: [`Error de conexión: ${apiError.message || 'Error desconocido'}`],
    };
  }
}
