import { NodeDefinition } from './NodeDefinition';
import { NodeCategory, PortType } from './types';

/**
 * Registry central de definiciones de nodos
 * Equivalente al catálogo de nodos de n8n
 */
class NodeDefinitionRegistry {
  private definitions: Map<string, NodeDefinition> = new Map();

  /**
   * Registra una definición de nodo
   */
  register(definition: NodeDefinition): void {
    if (!(definition instanceof NodeDefinition)) {
      throw new Error('La definición debe ser una instancia de NodeDefinition');
    }
    this.definitions.set(definition.typeId, definition);
  }

  /**
   * Obtiene una definición por typeId
   */
  get(typeId: string): NodeDefinition | undefined {
    return this.definitions.get(typeId);
  }

  /**
   * Obtiene todas las definiciones
   */
  getAll(): NodeDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Obtiene definiciones por categoría
   */
  getByCategory(category: string): NodeDefinition[] {
    return this.getAll().filter((def) => def.category === category);
  }

  /**
   * Busca definiciones por tags
   */
  searchByTags(tags: string[]): NodeDefinition[] {
    const tagSet = new Set(tags);
    return this.getAll().filter((def) =>
      def.tags.some((tag) => tagSet.has(tag))
    );
  }

  /**
   * Busca definiciones por texto (displayName, description, tags)
   */
  search(query: string): NodeDefinition[] {
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
    icon: 'hand',
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
        ui: { widget: 'textarea', placeholder: 'Mensaje de entrada', rows: 3 },
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
    icon: 'globe',
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
        ui: { widget: 'textarea', placeholder: '/webhook', rows: 3 },
      },
    ],
    defaults: {
      method: 'POST',
      path: '/webhook',
    },
  })
);

// Trigger Input (nuevo en v1.0.2)
nodeRegistry.register(
  new NodeDefinition({
    typeId: 'ap.trigger.input',
    version: 1,
    displayName: 'Input Trigger',
    name: 'trigger_input',
    description: 'Valida y estructura datos de entrada (punto de entrada del flujo)',
    category: NodeCategory.TRIGGER,
    tags: ['trigger', 'input', 'validation'],
    icon: 'download',
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
        name: 'schema',
        label: 'Schema',
        type: 'json',
        required: false,
        default: {},
        ui: { widget: 'code', rows: 8, placeholder: '{"required": ["field1", "field2"]}' },
      },
    ],
    defaults: {
      schema: {},
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
    icon: 'bot',
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
        ui: { widget: 'select', placeholder: '', rows: 1 },
      },
      {
        name: 'instructions',
        label: 'Instrucciones',
        type: 'string',
        required: true,
        default: '',
        ui: { widget: 'textarea', rows: 5, placeholder: '' },
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
    icon: 'shuffle',
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
        ui: { widget: 'select', placeholder: '', rows: 1 },
      },
      {
        name: 'rules',
        label: 'Reglas',
        type: 'json',
        required: true,
        default: [],
        ui: { widget: 'code', rows: 8, placeholder: '' },
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
    icon: 'save',
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
        name: 'mode',
        label: 'Modo',
        type: 'enum',
        required: true,
        default: 'load',
        options: ['load', 'save'],
        ui: { widget: 'select', placeholder: '', rows: 1 },
      },
      {
        name: 'scope',
        label: 'Alcance',
        type: 'enum',
        required: true,
        default: 'conversation',
        options: ['conversation', 'run'],
        ui: { widget: 'select', placeholder: '', rows: 1 },
      },
      {
        name: 'backend',
        label: 'Backend',
        type: 'enum',
        required: true,
        default: 'postgres',
        options: ['postgres', 'memory'],
        ui: { widget: 'select', placeholder: '', rows: 1 },
      },
    ],
    defaults: {
      mode: 'load',
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
    icon: 'brain',
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
        ui: { widget: 'select', placeholder: '', rows: 1 },
      },
      {
        name: 'model',
        label: 'Modelo',
        type: 'string',
        required: true,
        default: '',
        ui: { widget: 'textarea', placeholder: '', rows: 3 },
      },
      {
        name: 'temperature',
        label: 'Temperature',
        type: 'number',
        required: false,
        default: 0.7,
        ui: { widget: 'number', placeholder: '', rows: 1 },
      },
      {
        name: 'prompt',
        label: 'Prompt',
        type: 'string',
        required: false,
        default: '',
        ui: { widget: 'textarea', rows: 5, placeholder: 'Prompt del modelo (puede venir de vars.prompt)' },
      },
    ],
    defaults: {
      provider: 'openai',
      model: '',
      temperature: 0.7,
      prompt: '',
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
    icon: 'radio',
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
        ui: { widget: 'select', placeholder: '', rows: 1 },
      },
      {
        name: 'url',
        label: 'URL',
        type: 'string',
        required: true,
        default: '',
        ui: { widget: 'textarea', placeholder: 'https://api.example.com/endpoint', rows: 3 },
      },
      {
        name: 'headers',
        label: 'Headers',
        type: 'json',
        required: false,
        default: {},
        ui: { widget: 'code', placeholder: '', rows: 8 },
      },
      {
        name: 'body',
        label: 'Body',
        type: 'json',
        required: false,
        default: null,
        ui: { widget: 'code', placeholder: '', rows: 8 },
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
    icon: 'database',
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
        ui: { widget: 'textarea', placeholder: '', rows: 3 },
      },
      {
        name: 'query',
        label: 'Query',
        type: 'string',
        required: true,
        default: '',
        ui: { widget: 'textarea', rows: 5, placeholder: '' },
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
    icon: 'messageSquare',
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
        ui: { widget: 'select', placeholder: '', rows: 1 },
      },
      {
        name: 'template',
        label: 'Plantilla',
        type: 'string',
        required: false,
        default: '',
        ui: { widget: 'textarea', rows: 5, placeholder: '' },
      },
    ],
    defaults: {
      format: 'text',
      template: '',
    },
  })
);

// Response End (nuevo en v1.0.2)
nodeRegistry.register(
  new NodeDefinition({
    typeId: 'ap.response.end',
    version: 1,
    displayName: 'End Response',
    name: 'response_end',
    description: 'Finaliza ejecución y establece output final',
    category: NodeCategory.OUTPUT,
    tags: ['response', 'end', 'output', 'final'],
    icon: 'checkCircle2',
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
        name: 'output',
        label: 'Output',
        type: 'json',
        required: false,
        default: {},
        ui: { widget: 'code', rows: 8, placeholder: '{"result": "success", "data": "{{variable}}"' },
      },
    ],
    defaults: {
      output: {},
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
    icon: 'radio',
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
        ui: { widget: 'textarea', placeholder: 'https://api.example.com/endpoint', rows: 3 },
      },
      {
        name: 'method',
        label: 'Método',
        type: 'enum',
        required: true,
        default: 'GET',
        options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        ui: { widget: 'select', placeholder: '', rows: 1 },
      },
      {
        name: 'headers',
        label: 'Headers',
        type: 'json',
        required: false,
        default: {},
        ui: { widget: 'code', placeholder: '', rows: 8 },
      },
      {
        name: 'body',
        label: 'Body',
        type: 'json',
        required: false,
        default: null,
        ui: { widget: 'code', placeholder: '', rows: 8 },
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
