/**
 * Servicio de runs (ejecuciones)
 * Según REDMIND_Semana2_Backend_Completo_v1_API.pdf
 * POST /api/v1/runs/test - Ejecución in-memory (sin persistir)
 * POST /api/v1/runs - Ejecutar flow persistido
 * GET /api/v1/runs?flowId={id} - Historial de runs
 * POST /api/v1/runs/{id}/rerun - Re-ejecutar run
 */

import { apiGet, apiPost } from './apiService';

/**
 * Extrae el input del nodo trigger manual del grafo
 * @param {Object} graphDefinition - GraphDefinition
 * @returns {Object|null} - Input para el trigger o null si no hay trigger manual
 */
function extractInputFromGraph(graphDefinition) {
  if (!graphDefinition || !graphDefinition.nodes) {
    return null;
  }

  // Buscar el nodo start (trigger)
  const startNodeId = graphDefinition.start;
  const startNode = graphDefinition.nodes.find((n) => n.id === startNodeId);

  if (!startNode) {
    return null;
  }

  // Si es un trigger manual, extraer el mensaje de su config
  if (startNode.type === 'trigger.manual' && startNode.config) {
    return {
      message: startNode.config.message || '',
    };
  }

  // Para otros tipos de triggers, retornar objeto vacío o null según el caso
  return null;
}

/**
 * Ejecuta un flow de prueba in-memory (sin persistir)
 * POST /api/v1/runs/test
 * @param {Object} graphDefinition - GraphDefinition a ejecutar
 * @param {number|null} timeoutSeconds - Timeout opcional en segundos (default: 300)
 * @returns {Promise<{runId: string, status: string, trace: Array, error?: string}>}
 */
export async function executeFlowTest(graphDefinition, timeoutSeconds = null) {
  try {
    // Extraer input del trigger manual si existe
    const input = extractInputFromGraph(graphDefinition);
    
    const payload = {
      graph: graphDefinition,
    };
    
    // Agregar input solo si existe (el backend lo requiere para trigger.manual)
    if (input !== null) {
      payload.input = input;
    }
    
    // Agregar timeout_seconds si se proporciona
    if (timeoutSeconds !== null && timeoutSeconds !== undefined) {
      payload.timeout_seconds = timeoutSeconds;
    }
    
    console.log('🚀 [runsService] Ejecutando flow de prueba (test):', { payload });
    
    // POST /api/v1/runs/test no requiere autenticación según la documentación
    const result = await apiPost('/runs/test', payload, {}, false, false);
    console.log('✅ [runsService] Resultado de ejecución test:', result);
    return result;
  } catch (error) {
    console.error('❌ [runsService] Error al ejecutar flow de prueba:', error);
    throw error;
  }
}

/**
 * Ejecuta un flow persistido
 * POST /api/v1/runs
 * @param {string} flowId - ID del flow persistido a ejecutar
 * @param {Object} input - Input opcional para el trigger (si no se proporciona, se usa el del flow guardado)
 * @param {number|null} timeoutSeconds - Timeout opcional en segundos (default: 300)
 * @returns {Promise<{runId: string, status: string, trace: Array, error?: string}>}
 */
export async function executeFlow(flowId, input = null, timeoutSeconds = null) {
  try {
    const payload = { flow_id: flowId };
    
    // Si se proporciona input, agregarlo a la petición
    if (input !== null) {
      payload.input = input;
    }
    
    // Agregar timeout_seconds si se proporciona
    if (timeoutSeconds !== null && timeoutSeconds !== undefined) {
      payload.timeout_seconds = timeoutSeconds;
    }
    
    console.log('🚀 [runsService] Ejecutando flow persistido:', { flowId, payload });
    
    // POST /api/v1/runs requiere autenticación y X-Project-Id es opcional según la documentación
    // requireProjectId=true para incluir X-Project-Id si está disponible (es opcional pero se incluye si existe)
    // requireAuth=true porque requiere autenticación
    const result = await apiPost('/runs', payload, {}, true, true);
    console.log('✅ [runsService] Resultado de ejecución:', result);
    return result;
  } catch (error) {
    console.error('❌ [runsService] Error al ejecutar flow persistido:', error);
    throw error;
  }
}

/**
 * Obtiene la lista de runs de un flow
 * @param {string} flowId - ID del flow
 * @returns {Promise<Array<{id: string, flowId: string, status: string, createdAt: string, error?: string}>>}
 */
export async function getRuns(flowId) {
  try {
    return await apiGet(`/runs?flowId=${flowId}`);
  } catch (error) {
    console.error('Error al obtener runs:', error);
    throw error;
  }
}

/**
 * Obtiene un run por ID
 * @param {string} runId - ID del run
 * @returns {Promise<{id: string, flowId: string, status: string, trace: Array, createdAt: string, error?: string}>}
 */
export async function getRun(runId) {
  try {
    return await apiGet(`/runs/${runId}`);
  } catch (error) {
    console.error('Error al obtener run:', error);
    throw error;
  }
}

/**
 * Re-ejecuta un run
 * @param {string} runId - ID del run a re-ejecutar
 * @returns {Promise<{runId: string, status: string, trace: Array, error?: string}>}
 */
export async function rerunFlow(runId) {
  try {
    return await apiPost(`/runs/${runId}/rerun`);
  } catch (error) {
    console.error('Error al re-ejecutar flow:', error);
    throw error;
  }
}

/**
 * Cancela un run en ejecución
 * POST /api/v1/runs/{run_id}/cancel
 * @param {string} runId - ID del run a cancelar
 * @returns {Promise<{runId: string, status: string}>}
 */
export async function cancelRun(runId) {
  try {
    return await apiPost(`/runs/${runId}/cancel`, {});
  } catch (error) {
    console.error('Error al cancelar run:', error);
    throw error;
  }
}
