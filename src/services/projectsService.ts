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
import type { Project, Flow } from '../types';

interface ProjectData {
  name: string;
  description?: string;
}

/**
 * Obtiene la lista de proyectos
 * No requiere project_id según REDMIND_Projects_System.md
 */
export async function getProjects(): Promise<Project[]> {
  try {
    // Los proyectos requieren autenticación pero no project_id
    return await apiGet<Project[]>('/projects', {}, false, true); // false = no requiere project_id, true = requiere auth
  } catch (error) {
    // No loggear errores esperados (401 = no autenticado)
    const apiError = error as { status?: number };
    if (!apiError.status || apiError.status >= 500) {
      console.error('Error inesperado al obtener proyectos:', error);
    }
    throw error;
  }
}

/**
 * Obtiene un proyecto por ID
 * No requiere project_id en header según REDMIND_API_Frontend_Developer_Guide.md
 */
export async function getProject(projectId: string): Promise<Project> {
  try {
    // Obtener proyecto requiere autenticación pero no project_id en header
    return await apiGet<Project>(`/projects/${projectId}`, {}, false, true);
  } catch (error) {
    // No loggear errores esperados (404 = proyecto no encontrado)
    const apiError = error as { status?: number };
    if (!apiError.status || apiError.status >= 500) {
      console.error('Error inesperado al obtener proyecto:', error);
    }
    throw error;
  }
}

/**
 * Obtiene los flujos de un proyecto
 */
export async function getProjectFlows(projectId: string): Promise<Flow[]> {
  try {
    return await apiGet<Flow[]>(`/projects/${projectId}/flows`);
  } catch (error) {
    console.error('Error al obtener flujos del proyecto:', error);
    throw error;
  }
}

/**
 * Crea un nuevo proyecto
 * No requiere project_id según REDMIND_API_Frontend_Developer_Guide.md
 */
export async function createProject(projectData: ProjectData): Promise<Project> {
  try {
    // Crear proyecto requiere autenticación pero no project_id
    return await apiPost<Project>('/projects', projectData, {}, false, true); // false = no requiere project_id, true = requiere auth
  } catch (error) {
    // No loggear errores esperados (400 = datos inválidos)
    const apiError = error as { status?: number };
    if (!apiError.status || apiError.status >= 500) {
      console.error('Error inesperado al crear proyecto:', error);
    }
    throw error;
  }
}

/**
 * Actualiza un proyecto
 * No requiere project_id en header según REDMIND_API_Frontend_Developer_Guide.md v1.1
 */
export async function updateProject(projectId: string, projectData: Partial<ProjectData>): Promise<Project> {
  try {
    // Actualizar proyecto requiere autenticación pero no project_id en header
    return await apiPut<Project>(`/projects/${projectId}`, projectData, {}, false, true);
  } catch (error) {
    // No loggear errores esperados (400, 404 = datos inválidos o proyecto no encontrado)
    const apiError = error as { status?: number };
    if (!apiError.status || apiError.status >= 500) {
      console.error('Error inesperado al actualizar proyecto:', error);
    }
    throw error;
  }
}

/**
 * Elimina un proyecto
 * No requiere project_id en header según REDMIND_API_Frontend_Developer_Guide.md v1.1
 * ⚠️ Importante: Al eliminar un proyecto, todos los flows y runs asociados se eliminan en cascada.
 */
export async function deleteProject(projectId: string): Promise<{ message: string } | null> {
  try {
    // Eliminar proyecto requiere autenticación pero no project_id en header
    return await apiDelete<{ message: string } | null>(`/projects/${projectId}`, {}, false, true);
  } catch (error) {
    // No loggear errores esperados (404 = proyecto no encontrado)
    const apiError = error as { status?: number };
    if (!apiError.status || apiError.status >= 500) {
      console.error('Error inesperado al eliminar proyecto:', error);
    }
    throw error;
  }
}
