/**
 * Servicio de validación remota
 * POST /api/v1/graphs/validate
 */

import { apiPost } from './apiService';

/**
 * Valida un grafo en el servidor
 * @param {Object} graphDefinition - GraphDefinition a validar
 * @returns {Promise<{valid: boolean, errors: string[], warnings?: string[]}>}
 */
export async function validateGraphRemote(graphDefinition) {
  try {
    const result = await apiPost('/graphs/validate', graphDefinition);
    return {
      valid: result.valid || false,
      errors: result.errors || [],
      warnings: result.warnings || [],
    };
  } catch (error) {
    console.error('Error al validar grafo remotamente:', error);
    return {
      valid: false,
      errors: [`Error de conexión: ${error.message}`],
      warnings: [],
    };
  }
}

