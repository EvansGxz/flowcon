/**
 * Servicio de contratos
 * GET /api/v1/contracts/version
 * GET /api/v1/contracts/schema
 */

import { apiGet } from './apiService';

interface ContractVersionResponse {
  version: string;
  schemaVersion?: string;
}

/**
 * Obtiene la versión del contrato del backend
 */
export async function getContractVersion(): Promise<ContractVersionResponse> {
  try {
    return await apiGet<ContractVersionResponse>('/contracts/version');
  } catch (error) {
    console.error('Error al obtener versión del contrato:', error);
    throw error;
  }
}

/**
 * Obtiene el JSON Schema del contrato del backend
 */
export async function getContractSchema(): Promise<Record<string, unknown>> {
  try {
    return await apiGet<Record<string, unknown>>('/contracts/schema');
  } catch (error) {
    console.error('Error al obtener schema del contrato:', error);
    throw error;
  }
}
