import { NodeDefinition } from './NodeDefinition';
import { NodeCategory, PortType } from './types';

/**
 * Registry central de definiciones de nodos
 * Equivalente al catálogo de nodos de n8n
 */
class NodeDefinitionRegistry {
  constructor() {
    this.definitions = new Map();
  }

  /**
   * Registra una definición de nodo
   */
  register(definition) {
    if (!(definition instanceof NodeDefinition)) {
      throw new Error('La definición debe ser una instancia de NodeDefinition');
    }
    this.definitions.set(definition.typeId, definition);
  }

  /**
   * Obtiene una definición por typeId
   */
  get(typeId) {
    return this.definitions.get(typeId);
  }

  /**
   * Obtiene todas las definiciones
   */
  getAll() {
    return Array.from(this.definitions.values());
  }

  /**
   * Obtiene definiciones por categoría
   */
  getByCategory(category) {
    return this.getAll().filter((def) => def.category === category);
  }

  /**
   * Busca definiciones por tags
   */
  searchByTags(tags) {
    const tagSet = new Set(tags);
    return this.getAll().filter((def) =>
      def.tags.some((tag) => tagSet.has(tag))
    );
  }

  /**
   * Busca definiciones por texto (displayName, description, tags)
   */
  search(query) {
    const lowerQuery = query.toLowerCase();
    return this.getAll().filter(
      (def) =>
        def.displayName.toLowerCase().includes(lowerQuery) ||
        def.description.toLowerCase().includes(lowerQuery) ||
        def.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
    );
  }
}

// Instancia singleton del registry
export const nodeRegistry = new NodeDefinitionRegistry();

/**
 * Definiciones de nodos predefinidas
 */

// Trigger Manual
nodeRegistry.register(
  new NodeDefinition({
    typeId: 'ap.trigger.manual',
    version: 1,
    displayName: 'Manual Trigger',
    name: 'manual_trigger',
    description: 'Entrada para pruebas locales',
    category: NodeCategory.TRIGGER,
    tags: ['trigger', 'manual', 'test'],
    icon: '👆',
    color: '#10b981',
    inputs: [],
    outputs: [
      {
        id: 'out',
        type: PortType.MAIN,
        label: 'Output',
        multiple: false,
        dataType: 'json',
      },
    ],
    properties: [
      {
        name: 'message',
        label: 'Mensaje',
        type: 'string',
        required: true,
        default: '',
        ui: { widget: 'textarea', placeholder: 'Mensaje de entrada' },
      },
    ],
    defaults: {
      message: '',
    },
  })
);

// Trigger Webhook
nodeRegistry.register(
  new NodeDefinition({
    typeId: 'ap.trigger.webhook',
    version: 1,
    displayName: 'Webhook Trigger',
    name: 'webhook_trigger',
    description: 'Inicia el flujo cuando se recibe una petición HTTP',
    category: NodeCategory.TRIGGER,
    tags: ['trigger', 'webhook', 'http'],
    icon: '🌐',
    color: '#10b981',
    inputs: [],
    outputs: [
      {
        id: 'out',
        type: PortType.MAIN,
        label: 'Output',
        multiple: false,
        dataType: 'json',
      },
    ],
    properties: [
      {
        name: 'method',
        label: 'Método HTTP',
        type: 'enum',
        required: true,
        default: 'POST',
        options: ['GET', 'POST', 'PUT', 'DELETE'],
      },
      {
        name: 'path',
        label: 'Ruta',
        type: 'string',
        required: true,
        default: '/webhook',
        ui: { widget: 'textarea', placeholder: '/webhook' },
      },
    ],
    defaults: {
      method: 'POST',
      path: '/webhook',
    },
  })
);

// Agent Core (según contrato REDMIND)
nodeRegistry.register(
  new NodeDefinition({
    typeId: 'ap.agent.core',
    version: 1,
    displayName: 'Agent Core',
    name: 'agent_core',
    description: 'Decisión semántica (intent/params)',
    category: NodeCategory.AGENT,
    tags: ['agent', 'core', 'intent'],
    icon: '🤖',
    color: '#a855f7',
    inputs: [
      {
        id: 'in',
        type: PortType.MAIN,
        label: 'Input',
        multiple: false,
        dataType: 'json',
      },
    ],
    outputs: [
      {
        id: 'out',
        type: PortType.MAIN,
        label: 'Output',
        multiple: false,
        dataType: 'json',
      },
    ],
    properties: [
      {
        name: 'strategy',
        label: 'Estrategia',
        type: 'enum',
        required: true,
        default: 'reactive',
        options: ['reactive'],
        ui: { widget: 'select' },
      },
      {
        name: 'instructions',
        label: 'Instrucciones',
        type: 'string',
        required: true,
        default: '',
        ui: { widget: 'textarea', rows: 5 },
      },
    ],
    defaults: {
      strategy: 'reactive',
      instructions: '',
    },
  })
);

// Condition Expr
nodeRegistry.register(
  new NodeDefinition({
    typeId: 'ap.condition.expr',
    version: 1,
    displayName: 'Condition Expression',
    name: 'condition_expr',
    description: 'Ruteo por expresión',
    category: NodeCategory.ROUTER,
    tags: ['condition', 'router', 'expr'],
    icon: '🔀',
    color: '#f59e0b',
    inputs: [
      {
        id: 'in',
        type: PortType.MAIN,
        label: 'Input',
        multiple: false,
        dataType: 'json',
      },
    ],
    outputs: [
      {
        id: 'out',
        type: PortType.MAIN,
        label: 'Output',
        multiple: true,
        dataType: 'json',
      },
    ],
    properties: [
      {
        name: 'engine',
        label: 'Motor',
        type: 'enum',
        required: true,
        default: 'jexl',
        options: ['jexl', 'jmespath'],
        ui: { widget: 'select' },
      },
      {
        name: 'rules',
        label: 'Reglas',
        type: 'json',
        required: true,
        default: [],
        ui: { widget: 'code', rows: 8 },
      },
    ],
    defaults: {
      engine: 'jexl',
      rules: [],
    },
  })
);

// Memory KV
nodeRegistry.register(
  new NodeDefinition({
    typeId: 'ap.memory.kv',
    version: 1,
    displayName: 'Memory KV',
    name: 'memory_kv',
    description: 'Cargar/guardar contexto',
    category: NodeCategory.AGENT,
    tags: ['memory', 'kv', 'storage', 'agent'],
    icon: '💾',
    color: '#8b5cf6',
    inputs: [
      {
        id: 'in',
        type: PortType.MAIN,
        label: 'Input',
        multiple: false,
        dataType: 'json',
      },
    ],
    outputs: [
      {
        id: 'out',
        type: PortType.MAIN,
        label: 'Output',
        multiple: false,
        dataType: 'json',
      },
    ],
    properties: [
      {
        name: 'scope',
        label: 'Alcance',
        type: 'enum',
        required: true,
        default: 'conversation',
        options: ['conversation', 'run'],
        ui: { widget: 'select' },
      },
      {
        name: 'backend',
        label: 'Backend',
        type: 'enum',
        required: true,
        default: 'postgres',
        options: ['postgres'],
        ui: { widget: 'select' },
      },
    ],
    defaults: {
      scope: 'conversation',
      backend: 'postgres',
    },
  })
);

// Model LLM
nodeRegistry.register(
  new NodeDefinition({
    typeId: 'ap.model.llm',
    version: 1,
    displayName: 'Model LLM',
    name: 'model_llm',
    description: 'LLM provider (placeholder)',
    category: NodeCategory.AGENT,
    tags: ['model', 'llm', 'ai'],
    icon: '🧠',
    color: '#6366f1',
    inputs: [
      {
        id: 'in',
        type: PortType.MAIN,
        label: 'Input',
        multiple: false,
        dataType: 'json',
      },
    ],
    outputs: [
      {
        id: 'out',
        type: PortType.MAIN,
        label: 'Output',
        multiple: false,
        dataType: 'json',
      },
    ],
    properties: [
      {
        name: 'provider',
        label: 'Proveedor',
        type: 'enum',
        required: true,
        default: 'openai',
        options: ['azure', 'openai', 'local'],
        ui: { widget: 'select' },
      },
      {
        name: 'model',
        label: 'Modelo',
        type: 'string',
        required: true,
        default: '',
        ui: { widget: 'textarea' },
      },
      {
        name: 'temperature',
        label: 'Temperature',
        type: 'number',
        required: false,
        default: 0.7,
        ui: { widget: 'number' },
      },
    ],
    defaults: {
      provider: 'openai',
      model: '',
      temperature: 0.7,
    },
  })
);

// Tool HTTP (actualizar ap.action.http también)
nodeRegistry.register(
  new NodeDefinition({
    typeId: 'ap.tool.http',
    version: 1,
    displayName: 'Tool HTTP',
    name: 'tool_http',
    description: 'Tool HTTP (placeholder)',
    category: NodeCategory.AGENT,
    tags: ['tool', 'http', 'api', 'agent'],
    icon: '📡',
    color: '#3b82f6',
    inputs: [
      {
        id: 'in',
        type: PortType.MAIN,
        label: 'Input',
        multiple: false,
        dataType: 'json',
      },
    ],
    outputs: [
      {
        id: 'out',
        type: PortType.MAIN,
        label: 'Output',
        multiple: false,
        dataType: 'json',
      },
      {
        id: 'error',
        type: PortType.ERROR,
        label: 'Error',
        multiple: false,
        dataType: 'error',
      },
    ],
    properties: [
      {
        name: 'method',
        label: 'Método',
        type: 'enum',
        required: true,
        default: 'GET',
        options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        ui: { widget: 'select' },
      },
      {
        name: 'url',
        label: 'URL',
        type: 'string',
        required: true,
        default: '',
        ui: { widget: 'textarea', placeholder: 'https://api.example.com/endpoint' },
      },
      {
        name: 'headers',
        label: 'Headers',
        type: 'json',
        required: false,
        default: {},
        ui: { widget: 'code' },
      },
      {
        name: 'body',
        label: 'Body',
        type: 'json',
        required: false,
        default: null,
        ui: { widget: 'code' },
      },
    ],
    defaults: {
      method: 'GET',
      url: '',
      headers: {},
      body: null,
    },
    runtime: {
      timeout: 30000,
      retries: 2,
      rateLimit: null,
    },
  })
);

// Tool Postgres
nodeRegistry.register(
  new NodeDefinition({
    typeId: 'ap.tool.postgres',
    version: 1,
    displayName: 'Tool Postgres',
    name: 'tool_postgres',
    description: 'Tool DB read-only (placeholder)',
    category: NodeCategory.AGENT,
    tags: ['tool', 'postgres', 'database', 'agent'],
    icon: '🗄️',
    color: '#059669',
    inputs: [
      {
        id: 'in',
        type: PortType.MAIN,
        label: 'Input',
        multiple: false,
        dataType: 'json',
      },
    ],
    outputs: [
      {
        id: 'out',
        type: PortType.MAIN,
        label: 'Output',
        multiple: false,
        dataType: 'json',
      },
    ],
    properties: [
      {
        name: 'connectionRef',
        label: 'Referencia de Conexión',
        type: 'string',
        required: true,
        default: '',
        ui: { widget: 'textarea' },
      },
      {
        name: 'query',
        label: 'Query',
        type: 'string',
        required: true,
        default: '',
        ui: { widget: 'textarea', rows: 5 },
      },
    ],
    defaults: {
      connectionRef: '',
      query: '',
    },
  })
);

// Response Chat
nodeRegistry.register(
  new NodeDefinition({
    typeId: 'ap.response.chat',
    version: 1,
    displayName: 'Response Chat',
    name: 'response_chat',
    description: 'Salida al usuario',
    category: NodeCategory.OUTPUT,
    tags: ['response', 'chat', 'output'],
    icon: '💬',
    color: '#06b6d4',
    inputs: [
      {
        id: 'in',
        type: PortType.MAIN,
        label: 'Input',
        multiple: false,
        dataType: 'json',
      },
    ],
    outputs: [],
    properties: [
      {
        name: 'format',
        label: 'Formato',
        type: 'enum',
        required: true,
        default: 'text',
        options: ['text', 'json'],
        ui: { widget: 'select' },
      },
      {
        name: 'template',
        label: 'Plantilla',
        type: 'string',
        required: false,
        default: '',
        ui: { widget: 'textarea', rows: 5 },
      },
    ],
    defaults: {
      format: 'text',
      template: '',
    },
  })
);

// Action Node (mantener compatibilidad)
nodeRegistry.register(
  new NodeDefinition({
    typeId: 'ap.action.http',
    version: 1,
    displayName: 'HTTP Request',
    name: 'http_request',
    description: 'Envía una petición HTTP y retorna la respuesta',
    category: NodeCategory.AGENT,
    tags: ['action', 'http', 'api', 'request', 'agent'],
    icon: '📡',
    color: '#3b82f6',
    inputs: [
      {
        id: 'in',
        type: PortType.MAIN,
        label: 'Input',
        multiple: false,
        dataType: 'json',
      },
    ],
    outputs: [
      {
        id: 'out',
        type: PortType.MAIN,
        label: 'Output',
        multiple: false,
        dataType: 'json',
      },
      {
        id: 'error',
        type: PortType.ERROR,
        label: 'Error',
        multiple: false,
        dataType: 'error',
      },
    ],
    properties: [
      {
        name: 'url',
        label: 'URL',
        type: 'string',
        required: true,
        default: '',
        ui: { widget: 'textarea', placeholder: 'https://api.example.com/endpoint' },
      },
      {
        name: 'method',
        label: 'Método',
        type: 'enum',
        required: true,
        default: 'GET',
        options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        ui: { widget: 'select' },
      },
      {
        name: 'headers',
        label: 'Headers',
        type: 'json',
        required: false,
        default: {},
        ui: { widget: 'code' },
      },
      {
        name: 'body',
        label: 'Body',
        type: 'json',
        required: false,
        default: null,
        ui: { widget: 'code' },
      },
    ],
    defaults: {
      url: '',
      method: 'GET',
      headers: {},
      body: null,
    },
    runtime: {
      timeout: 30000,
      retries: 2,
      rateLimit: null,
    },
  })
);

