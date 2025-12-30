/**
 * Tipos base para el sistema de definiciones de nodos estilo n8n
 */

/**
 * Tipo de puerto (conectividad)
 */
export const PortType = {
  MAIN: 'main',        // Flujo principal de datos
  TOOL: 'tool',       // Herramientas/funciones
  CONTROL: 'control', // Control de flujo
  ERROR: 'error',     // Manejo de errores
};

/**
 * Categorías de nodos
 */
export const NodeCategory = {
  TRIGGER: 'Trigger',
  AGENT: 'Agent',
  TOOL: 'Tool',
  MEMORY: 'Memory',
  ROUTER: 'Router',
  ACTION: 'Action',
  TRANSFORM: 'Transform',
  OUTPUT: 'Output',
};

/**
 * Tipos de propiedades (configuración)
 */
export const PropertyType = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  ENUM: 'enum',
  JSON: 'json',
  CODE: 'code',
};

/**
 * Widgets UI para propiedades
 */
export const PropertyWidget = {
  TEXTAREA: 'textarea',
  SELECT: 'select',
  CODE: 'code',
  PASSWORD: 'password',
  NUMBER: 'number',
  CHECKBOX: 'checkbox',
};

/**
 * Estados de ejecución del nodo
 */
export const NodeStatus = {
  IDLE: 'idle',
  RUNNING: 'running',
  SUCCESS: 'success',
  ERROR: 'error',
  SKIPPED: 'skipped',
};

