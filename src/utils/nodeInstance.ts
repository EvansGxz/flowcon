import { ulid } from 'ulid';
import { nodeRegistry } from '../nodes/definitions/registry';
import type { ReactFlowNode } from '../types';

interface Position {
  x: number;
  y: number;
}

/**
 * Crea una instancia de nodo en el workflow
 */
export function createNodeInstance(
  typeId: string,
  position: Position,
  config: Record<string, unknown> = {},
  overrides: { data?: Record<string, unknown> } = {}
): ReactFlowNode {
  const definition = nodeRegistry.get(typeId);

  if (!definition) {
    throw new Error(`Tipo de nodo no encontrado: ${typeId}`);
  }

  // Combinar configuración: defaults -> config -> overrides
  const finalConfig = {
    ...definition.getDefaultConfig(),
    ...config,
    ...(overrides.data?.config || {}),
  };

  // Validar configuración
  const validation = definition.validateConfig(finalConfig);
  if (!validation.valid) {
    console.warn(`Advertencias de validación para ${typeId}:`, validation.errors);
  }

  // Crear instancia con instanceId único usando ULID con prefijo "n_"
  const instanceId = `n_${ulid()}`;

  return {
    id: instanceId, // instanceId (ULID con prefijo "n_")
    type: definition.name, // Para React Flow component mapping
    position,
    data: {
      typeId, // typeId (identidad del tipo)
      version: definition.version,
      displayName: definition.displayName,
      config: finalConfig,
      status: 'idle', // Estado de ejecución
      ...(overrides.data || {}), // Permite sobrescribir data adicional
    },
  };
}

/**
 * Obtiene la definición de un nodo desde su instancia
 */
export function getNodeDefinition(node: ReactFlowNode) {
  return nodeRegistry.get(node.data?.typeId);
}

/**
 * Migra un nodo a la última versión si es necesario
 */
export function migrateNodeIfNeeded(node: ReactFlowNode): ReactFlowNode {
  const definition = nodeRegistry.get(node.data?.typeId);

  if (!definition) {
    return node;
  }

  const nodeVersion = node.data?.version || 1;
  if (nodeVersion < definition.version) {
    const migratedConfig = definition.migrateConfig(node.data.config || {}, nodeVersion);
    return {
      ...node,
      data: {
        ...node.data,
        version: definition.version,
        config: migratedConfig,
      },
    };
  }

  return node;
}
