import { PortDef } from './PortDef';
import { PropertyDef } from './PropertyDef';
import { NodeCategory, type NodeCategoryValue } from './types';

interface RuntimeConfig {
  timeout?: number;
  retries?: number;
  rateLimit?: number | null;
}

interface MigrateFunctions {
  [version: number]: (config: Record<string, unknown>) => Record<string, unknown>;
}

interface CredentialDef {
  type: string;
  required?: boolean;
}

interface NodeDefinitionOptions {
  typeId: string;
  version?: number;
  displayName: string;
  name?: string; // Nombre técnico (snake_case)
  description?: string;
  category?: NodeCategoryValue;
  tags?: string[];
  icon?: string;
  color?: string;
  inputs?: Array<PortDef | Partial<PortDef>>;
  outputs?: Array<PortDef | Partial<PortDef>>;
  properties?: Array<PropertyDef | Partial<PropertyDef>>;
  credentials?: CredentialDef[];
  defaults?: Record<string, unknown>;
  migrate?: MigrateFunctions;
  runtime?: RuntimeConfig;
  helpUrl?: string;
}

/**
 * Definición completa de un tipo de nodo (estilo n8n)
 * Equivalente al "node base file" de n8n
 */
export class NodeDefinition {
  typeId: string;
  version: number;
  displayName: string;
  name: string;
  description: string;
  category: NodeCategoryValue;
  tags: string[];
  icon: string;
  color: string;
  inputs: PortDef[];
  outputs: PortDef[];
  properties: PropertyDef[];
  credentials: CredentialDef[];
  defaults: Record<string, unknown>;
  migrate: MigrateFunctions;
  runtime: RuntimeConfig;
  helpUrl: string;

  constructor({
    typeId,
    version = 1,
    displayName,
    name, // Nombre técnico (snake_case)
    description = '',
    category = NodeCategory.AGENT,
    tags = [],
    icon = 'settings',
    color = '#6366f1',
    inputs = [],
    outputs = [],
    properties = [],
    credentials = [],
    defaults = {},
    migrate = {},
    runtime = {
      timeout: 30000,
      retries: 0,
      rateLimit: null,
    },
    helpUrl = '',
  }: NodeDefinitionOptions) {
    this.typeId = typeId; // Identidad única global (ej: "ap.agent")
    this.version = version;
    this.displayName = displayName;
    this.name = name || typeId.split('.').pop() || '';
    this.description = description;
    this.category = category;
    this.tags = tags;
    this.icon = icon;
    this.color = color;
    this.inputs = inputs.map((p) => (p instanceof PortDef ? p : new PortDef(p as Partial<PortDef> & { id: string })));
    this.outputs = outputs.map((p) => (p instanceof PortDef ? p : new PortDef(p as Partial<PortDef> & { id: string })));
    this.properties = properties.map((p) => (p instanceof PropertyDef ? p : new PropertyDef(p as Partial<PropertyDef> & { name: string; label: string })));
    this.credentials = credentials;
    this.defaults = defaults;
    this.migrate = migrate; // Funciones de migración: { 2: (v1Config) => v2Config }
    this.runtime = runtime;
    this.helpUrl = helpUrl;
  }

  /**
   * Obtiene el valor por defecto de una propiedad
   */
  getDefaultValue(propertyName: string): unknown {
    if (this.defaults[propertyName] !== undefined) {
      return this.defaults[propertyName];
    }
    const prop = this.properties.find((p) => p.name === propertyName);
    return prop?.default;
  }

  /**
   * Valida una configuración completa del nodo
   */
  validateConfig(config: Record<string, unknown> & { credentialRefs?: Record<string, string> }): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const prop of this.properties) {
      const value = config[prop.name];
      const validation = prop.validate(value);
      if (!validation.valid) {
        errors.push(validation.error || `${prop.label} es inválido`);
      }
    }

    // Validar credenciales requeridas
    for (const cred of this.credentials) {
      if (cred.required && !config.credentialRefs?.[cred.type]) {
        errors.push(`Credencial ${cred.type} es requerida`);
      }
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  /**
   * Migra una configuración de una versión anterior
   */
  migrateConfig(config: Record<string, unknown>, fromVersion: number): Record<string, unknown> {
    let migrated = { ...config };

    for (let v = fromVersion + 1; v <= this.version; v++) {
      if (this.migrate[v]) {
        migrated = this.migrate[v](migrated);
      }
    }

    return migrated;
  }

  /**
   * Obtiene la configuración por defecto completa
   */
  getDefaultConfig(): Record<string, unknown> {
    const config: Record<string, unknown> = {};
    for (const prop of this.properties) {
      config[prop.name] = this.getDefaultValue(prop.name);
    }
    return config;
  }
}
