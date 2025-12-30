/**
 * Definición de una propiedad de configuración de un nodo
 */
export class PropertyDef {
  constructor({
    name,
    label,
    type = 'string',
    required = false,
    default: defaultValue = undefined,
    description = '',
    ui = {},
    validation = null,
    options = [], // Para tipo enum
  }) {
    this.name = name;
    this.label = label;
    this.type = type;
    this.required = required;
    this.default = defaultValue;
    this.description = description;
    this.ui = {
      widget: ui.widget || this._getDefaultWidget(type),
      placeholder: ui.placeholder || '',
      rows: ui.rows || 3, // Para textarea
      ...ui,
    };
    this.validation = validation;
    this.options = options; // Para enum/select
  }

  _getDefaultWidget(type) {
    const widgetMap = {
      string: 'textarea',
      number: 'number',
      boolean: 'checkbox',
      enum: 'select',
      json: 'code',
      code: 'code',
    };
    return widgetMap[type] || 'textarea';
  }

  /**
   * Valida un valor según la definición de la propiedad
   */
  validate(value) {
    if (this.required && (value === undefined || value === null || value === '')) {
      return { valid: false, error: `${this.label} es requerido` };
    }

    if (this.validation && typeof this.validation === 'function') {
      return this.validation(value);
    }

    // Validaciones básicas por tipo
    if (this.type === 'number' && value !== undefined && isNaN(Number(value))) {
      return { valid: false, error: `${this.label} debe ser un número` };
    }

    if (this.type === 'enum' && this.options.length > 0) {
      if (!this.options.includes(value)) {
        return { valid: false, error: `${this.label} debe ser uno de: ${this.options.join(', ')}` };
      }
    }

    return { valid: true };
  }
}

