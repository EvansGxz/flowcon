import { PortDef } from './PortDef';
import { PropertyDef } from './PropertyDef';
import { NodeCategory } from './types';

/**
 * Definición completa de un tipo de nodo (estilo n8n)
 * Equivalente al "node base file" de n8n
 */
export class NodeDefinition {
  constructor({
    typeId,
    version = 1,
    displayName,
    name, // Nombre técnico (snake_case)
    description = '',
    category = NodeCategory.AGENT,
    tags = [],
    icon = '⚙️',
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
  }) {
    this.typeId = typeId; // Identidad única global (ej: "ap.agent")
    this.version = version;
    this.displayName = displayName;
    this.name = name || typeId.split('.').pop();
    this.description = description;
    this.category = category;
    this.tags = tags;
    this.icon = icon;
    this.color = color;
    this.inputs = inputs.map((p) => (p instanceof PortDef ? p : new PortDef(p)));
    this.outputs = outputs.map((p) => (p instanceof PortDef ? p : new PortDef(p)));
    this.properties = properties.map((p) => (p instanceof PropertyDef ? p : new PropertyDef(p)));
    this.credentials = credentials;
    this.defaults = defaults;
    this.migrate = migrate; // Funciones de migración: { 2: (v1Config) => v2Config }
    this.runtime = runtime;
    this.helpUrl = helpUrl;
  }

  /**
   * Obtiene el valor por defecto de una propiedad
   */
  getDefaultValue(propertyName) {
    if (this.defaults[propertyName] !== undefined) {
      return this.defaults[propertyName];
    }
    const prop = this.properties.find((p) => p.name === propertyName);
    return prop?.default;
  }

  /**
   * Valida una configuración completa del nodo
   */
  validateConfig(config) {
    const errors = [];
    const warnings = [];

    for (const prop of this.properties) {
      const value = config[prop.name];
      const validation = prop.validate(value);
      if (!validation.valid) {
        errors.push(validation.error);
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
  migrateConfig(config, fromVersion) {
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
  getDefaultConfig() {
    const config = {};
    for (const prop of this.properties) {
      config[prop.name] = this.getDefaultValue(prop.name);
    }
    return config;
  }
}

