/**
 * Servicio de proyectos
 * Según REDMIND_API_Frontend_Developer_Guide.md v1.1
 * GET /api/v1/projects
 * POST /api/v1/projects
 * GET /api/v1/projects/:id
 * PUT /api/v1/projects/:id
 * DELETE /api/v1/projects/:id
 * GET /api/v1/projects/:id/flows
 */

import { apiGet, apiPost, apiPut, apiDelete } from './apiService';

/**
 * Obtiene la lista de proyectos
 * No requiere project_id según REDMIND_Projects_System.md
 * @returns {Promise<Array<{id: string, name: string, description?: string, flowCount: number, flows: Array, createdAt: string, updatedAt: string}>>}
 */
export async function getProjects() {
  try {
    // Los proyectos requieren autenticación pero no project_id
    return await apiGet('/projects', {}, false, true); // false = no requiere project_id, true = requiere auth
  } catch (error) {
    // No loggear errores esperados (401 = no autenticado)
    if (!error.status || error.status >= 500) {
      console.error('Error inesperado al obtener proyectos:', error);
    }
    throw error;
  }
}

/**
 * Obtiene un proyecto por ID
 * No requiere project_id en header según REDMIND_API_Frontend_Developer_Guide.md
 * @param {string} projectId - ID del proyecto
 * @returns {Promise<{id: string, name: string, description?: string, created_at: string}>}
 */
export async function getProject(projectId) {
  try {
    // Obtener proyecto requiere autenticación pero no project_id en header
    return await apiGet(`/projects/${projectId}`, {}, false, true);
  } catch (error) {
    // No loggear errores esperados (404 = proyecto no encontrado)
    if (!error.status || error.status >= 500) {
      console.error('Error inesperado al obtener proyecto:', error);
    }
    throw error;
  }
}

/**
 * Obtiene los flujos de un proyecto
 * @param {string} projectId - ID del proyecto
 * @returns {Promise<Array<{id: string, name: string, projectId: string, createdAt: string, updatedAt: string}>>}
 */
export async function getProjectFlows(projectId) {
  try {
    return await apiGet(`/projects/${projectId}/flows`);
  } catch (error) {
    console.error('Error al obtener flujos del proyecto:', error);
    throw error;
  }
}

/**
 * Crea un nuevo proyecto
 * No requiere project_id según REDMIND_API_Frontend_Developer_Guide.md
 * @param {Object} projectData - {name: string, description?: string}
 * @returns {Promise<{id: string, name: string, description?: string, created_at: string}>}
 */
export async function createProject(projectData) {
  try {
    // Crear proyecto requiere autenticación pero no project_id
    return await apiPost('/projects', projectData, {}, false, true); // false = no requiere project_id, true = requiere auth
  } catch (error) {
    // No loggear errores esperados (400 = datos inválidos)
    if (!error.status || error.status >= 500) {
      console.error('Error inesperado al crear proyecto:', error);
    }
    throw error;
  }
}

/**
 * Actualiza un proyecto
 * No requiere project_id en header según REDMIND_API_Frontend_Developer_Guide.md v1.1
 * @param {string} projectId - ID del proyecto
 * @param {Object} projectData - {name?: string, description?: string} (al menos uno debe estar presente)
 * @returns {Promise<{id: string, name: string, description?: string, created_at: string}>}
 */
export async function updateProject(projectId, projectData) {
  try {
    // Actualizar proyecto requiere autenticación pero no project_id en header
    return await apiPut(`/projects/${projectId}`, projectData, {}, false, true);
  } catch (error) {
    // No loggear errores esperados (400, 404 = datos inválidos o proyecto no encontrado)
    if (!error.status || error.status >= 500) {
      console.error('Error inesperado al actualizar proyecto:', error);
    }
    throw error;
  }
}

/**
 * Elimina un proyecto
 * No requiere project_id en header según REDMIND_API_Frontend_Developer_Guide.md v1.1
 * ⚠️ Importante: Al eliminar un proyecto, todos los flows y runs asociados se eliminan en cascada.
 * @param {string} projectId - ID del proyecto
 * @returns {Promise<{message: string}>}
 */
export async function deleteProject(projectId) {
  try {
    // Eliminar proyecto requiere autenticación pero no project_id en header
    return await apiDelete(`/projects/${projectId}`, {}, false, true);
  } catch (error) {
    // No loggear errores esperados (404 = proyecto no encontrado)
    if (!error.status || error.status >= 500) {
      console.error('Error inesperado al eliminar proyecto:', error);
    }
    throw error;
  }
}

