/**
 * Servicio de validación remota
 * POST /graphs/validate
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://192.168.103.10:8000';

/**
 * Valida un grafo en el servidor
 * @param {Object} graphDefinition - GraphDefinition a validar
 * @returns {Promise<{valid: boolean, errors: string[]}>}
 */
export async function validateGraphRemote(graphDefinition) {
  try {
    const response = await fetch(`${API_BASE_URL}/graphs/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(graphDefinition),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
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

