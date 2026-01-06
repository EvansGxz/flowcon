/**
 * Servicio de contratos
 * GET /api/v1/contracts/version
 * GET /api/v1/contracts/schema
 */

import { apiGet } from './apiService';

/**
 * Obtiene la versión del contrato del backend
 * @returns {Promise<{version: string, schemaVersion?: string}>}
 */
export async function getContractVersion() {
  try {
    return await apiGet('/contracts/version');
  } catch (error) {
    console.error('Error al obtener versión del contrato:', error);
    throw error;
  }
}

/**
 * Obtiene el JSON Schema del contrato del backend
 * @returns {Promise<Object>}
 */
export async function getContractSchema() {
  try {
    return await apiGet('/contracts/schema');
  } catch (error) {
    console.error('Error al obtener schema del contrato:', error);
    throw error;
  }
}

