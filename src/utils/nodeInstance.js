import { ulid } from 'ulid';
import { nodeRegistry } from '../nodes/definitions/registry';

/**
 * Crea una instancia de nodo en el workflow
 * @param {string} typeId - ID del tipo de nodo (ej: "ap.agent")
 * @param {Object} position - Posición {x, y}
 * @param {Object} config - Configuración del nodo (opcional)
 * @param {Object} overrides - Valores que sobrescriben defaults (opcional)
 * @returns {Object} Instancia de nodo lista para React Flow
 */
export function createNodeInstance(typeId, position, config = {}, overrides = {}) {
  const definition = nodeRegistry.get(typeId);

  if (!definition) {
    throw new Error(`Tipo de nodo no encontrado: ${typeId}`);
  }

  // Combinar configuración: defaults -> config -> overrides
  const finalConfig = {
    ...definition.getDefaultConfig(),
    ...config,
    ...overrides,
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
      ...overrides.data, // Permite sobrescribir data adicional
    },
  };
}

/**
 * Obtiene la definición de un nodo desde su instancia
 */
export function getNodeDefinition(node) {
  return nodeRegistry.get(node.data?.typeId);
}

/**
 * Migra un nodo a la última versión si es necesario
 */
export function migrateNodeIfNeeded(node) {
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

