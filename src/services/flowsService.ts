/**
 * Servicio de flows
 * Según REDMIND_Semana2_Backend_Completo_v1_API.pdf
 * POST /api/v1/flows - Guardar flow (create/update)
 * GET /api/v1/flows/{id} - Obtener flow
 * 
 * Nota: El backend no expone GET /api/v1/flows (lista) en Semana 2
 * Se asume que el frontend mantendrá una lista local o se implementará después
 */

import { apiGet, apiPost, apiPut } from './apiService';
import type { Flow, GraphDefinition } from '../types';

interface FlowData {
  name: string;
  graph?: GraphDefinition;
  description?: string;
  projectId?: string;
}

/**
 * Obtiene un flow por ID
 * GET /api/v1/flows/{id}
 */
export async function getFlow(flowId: string): Promise<Flow> {
  try {
    return await apiGet<Flow>(`/flows/${flowId}`);
  } catch (error) {
    // No loguear errores 404 (flow no encontrado) - es un caso esperado
    // Solo loguear errores inesperados (500, network, etc.)
    const apiError = error as { status?: number };
    if (apiError.status !== 404 && apiError.status !== 400) {
      console.error('Error al obtener flow:', error);
    }
    throw error;
  }
}

/**
 * Crea un nuevo flow
 * POST /api/v1/flows
 */
export async function createFlow(flowData: FlowData): Promise<Flow> {
  try {
    return await apiPost<Flow>('/flows', flowData);
  } catch (error) {
    console.error('Error al crear flow:', error);
    throw error;
  }
}

/**
 * Actualiza un flow existente
 * PUT /api/v1/flows/{flow_id}
 */
export async function updateFlow(flowId: string, flowData: FlowData): Promise<Flow> {
  try {
    return await apiPut<Flow>(`/flows/${flowId}`, flowData);
  } catch (error) {
    console.error('Error al actualizar flow:', error);
    throw error;
  }
}

/**
 * Guarda un flow (create o update según si tiene id)
 * Usa POST para crear nuevo flow o PUT para actualizar existente
 */
export async function saveFlow(flowId: string | null, flowData: FlowData): Promise<Flow> {
  try {
    // Si hay flowId, usar PUT para actualizar
    if (flowId && flowId !== 'default') {
      return await updateFlow(flowId, flowData);
    } else {
      // Si no hay flowId, usar POST para crear nuevo
      return await createFlow(flowData);
    }
  } catch (error) {
    console.error('Error al guardar flow:', error);
    throw error;
  }
}

/**
 * Obtiene la lista de flows guardados
 * GET /api/v1/flows
 * El header X-Project-Id es opcional:
 * - Si se proporciona: lista flows del proyecto
 * - Si no se proporciona: lista todos los flows del usuario
 */
export async function getFlows(projectId: string | null = null): Promise<Flow[]> {
  try {
    if (projectId) {
      // Si se proporciona projectId, incluirlo en el header X-Project-Id
      // Temporalmente establecer el projectId en localStorage para que apiRequest lo use
      const originalProjectId = localStorage.getItem('redmind_currentProjectId');
      localStorage.setItem('redmind_currentProjectId', projectId);
      try {
        const result = await apiGet<{ runs?: Flow[] } | Flow[]>('/flows', {}, true, true);
        // El backend puede retornar {runs: [...]} o directamente un array
        if (Array.isArray(result)) {
          return result;
        }
        return (result as { runs?: Flow[] }).runs || [];
      } finally {
        // Restaurar el projectId original
        if (originalProjectId) {
          localStorage.setItem('redmind_currentProjectId', originalProjectId);
        } else {
          localStorage.removeItem('redmind_currentProjectId');
        }
      }
    } else {
      // No incluir X-Project-Id header cuando projectId es null
      // Guardar el projectId actual temporalmente y limpiarlo
      const originalProjectId = localStorage.getItem('redmind_currentProjectId');
      
      if (originalProjectId) {
        localStorage.removeItem('redmind_currentProjectId');
      }
      
      try {
        const result = await apiGet<{ runs?: Flow[] } | Flow[]>('/flows', {}, false, true);
        // El backend puede retornar {runs: [...]} o directamente un array
        if (Array.isArray(result)) {
          return result;
        }
        return (result as { runs?: Flow[] }).runs || [];
      } finally {
        // Restaurar el projectId original
        if (originalProjectId) {
          localStorage.setItem('redmind_currentProjectId', originalProjectId);
        }
      }
    }
  } catch (error) {
    console.error('Error al obtener flows:', error);
    throw error;
  }
}

/**
 * Elimina un flow
 * NOTA: El backend no expone DELETE en Semana 2
 * Esta función se mantiene para compatibilidad
 */
export async function deleteFlow(flowId: string): Promise<void> {
  try {
    // Por ahora lanzar error hasta que el backend exponga DELETE /api/v1/flows/{id}
    throw new Error('DELETE /api/v1/flows/{id} no está disponible en el backend Semana 2');
  } catch (error) {
    console.error('Error al eliminar flow:', error);
    throw error;
  }
}
