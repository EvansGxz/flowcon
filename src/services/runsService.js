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
    
    console.log('[runsService] Ejecutando flow de prueba (test):', { payload });
    
    // POST /api/v1/runs/test no requiere autenticación según la documentación
    const result = await apiPost('/runs/test', payload, {}, false, false);
    console.log('[runsService] Resultado de ejecución test:', result);
    return result;
  } catch (error) {
    console.error('[runsService] Error al ejecutar flow de prueba:', error);
    throw error;
  }
}

/**
 * Ejecuta un flow persistido
 * POST /api/v1/runs
 * 
 * Este endpoint retorna inmediatamente con runId y status "running".
 * La ejecución del flow continúa en background. El frontend debe hacer
 * polling a GET /api/v1/runs/{run_id} para obtener el progreso.
 * 
 * Requiere autenticación y header X-Project-Id.
 * 
 * @param {string} flowId - ID del flow persistido a ejecutar
 * @param {Object} input - Input requerido para el trigger (objeto vacío {} si no hay input)
 * @param {number|null} timeoutSeconds - Timeout opcional en segundos (default: 300)
 * @returns {Promise<{runId: string, status: string}>} - Retorna solo runId y status inmediatamente
 */
export async function executeFlow(flowId, input = {}, timeoutSeconds = null) {
  try {
    const projectId = localStorage.getItem('redmind_currentProjectId');
    console.log('[runsService] POST /runs - Ejecutando flow persistido:', { 
      flowId, 
      input, 
      timeoutSeconds,
      projectId 
    });
    
    // El backend requiere flow_id, input y opcionalmente timeout_seconds
    const payload = {
      flow_id: flowId,
      input: input || {} // Asegurar que siempre hay un objeto (aunque esté vacío)
    };
    
    // Agregar timeout_seconds si se proporciona
    if (timeoutSeconds !== null && timeoutSeconds !== undefined) {
      payload.timeout_seconds = timeoutSeconds;
    }
    
    console.log('[runsService] POST /runs payload:', payload);
    console.log('[runsService] Headers que se enviarán: X-Project-Id:', projectId || 'NO ENVIADO');
    
    // POST /api/v1/runs requiere autenticación y header X-Project-Id
    // requireProjectId=true para incluir X-Project-Id (requerido según nuevo contrato)
    // requireAuth=true porque requiere autenticación
    const result = await apiPost('/runs', payload, {}, true, true);
    console.log('[runsService] POST /runs response:', result);
    console.log('[runsService] Run creado - runId:', result.runId, 'status:', result.status);
    
    // El backend retorna solo {runId, status} inmediatamente
    // El trace completo se obtiene con GET /runs/{runId}
    return result;
  } catch (error) {
    console.error('[runsService] Error al ejecutar flow persistido:', error);
    console.error('[runsService] Error details:', {
      message: error.message,
      status: error.status,
      detail: error.detail
    });
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
    const projectId = localStorage.getItem('redmind_currentProjectId');
    console.log('[runsService] GET /runs?flowId=', flowId);
    console.log('[runsService] projectId desde localStorage:', projectId);
    console.log('[runsService] URL completa:', `/api/v1/runs?flowId=${flowId}`);
    console.log('[runsService] Headers que se enviarán: X-Project-Id:', projectId || 'NO ENVIADO');
    
    const result = await apiGet(`/runs?flowId=${flowId}`);
    console.log('[runsService] GET /runs response:', result);
    console.log('[runsService] runs array length:', result.runs?.length || 0);
    if (result.runs && result.runs.length > 0) {
      console.log('[runsService] Primer run:', result.runs[0]);
    }
    // El backend retorna {runs: [...]}, extraer el array
    // Normalizar los runs para que tengan 'id' además de 'run_id' para compatibilidad
    const runs = (result.runs || []).map(run => ({
      ...run,
      id: run.run_id || run.id, // Asegurar que siempre hay 'id'
    }));
    return runs;
  } catch (error) {
    console.error('[runsService] Error al obtener runs:', error);
    console.error('[runsService] Error details:', {
      message: error.message,
      status: error.status,
      detail: error.detail
    });
    throw error;
  }
}

/**
 * Obtiene un run por ID
 * @param {string} runId - ID del run
 * @returns {Promise<{id: string, runId: string, flow_id: string, status: string, trace: Array, started_at: string, ended_at: string, execution_mode: string, result: any}>}
 */
export async function getRun(runId) {
  try {
    console.log('[runsService] GET /runs/', runId);
    const result = await apiGet(`/runs/${runId}`);
    console.log('[runsService] GET /runs/{id} response:', result);
    
    // Normalizar el run: el backend retorna runId, pero también necesitamos id para compatibilidad
    const normalizedRun = {
      ...result,
      id: result.runId || result.id || runId, // Asegurar que siempre hay 'id'
      run_id: result.runId || result.run_id || runId, // También mantener run_id
    };
    console.log('[runsService] Run normalizado:', normalizedRun);
    return normalizedRun;
  } catch (error) {
    console.error('[runsService] Error al obtener run:', error);
    console.error('[runsService] Error details:', {
      message: error.message,
      status: error.status,
      detail: error.detail
    });
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
