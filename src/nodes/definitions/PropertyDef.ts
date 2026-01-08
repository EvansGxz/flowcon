/**
 * Definición de una propiedad de configuración de un nodo
 */

import type { PropertyTypeValue, PropertyWidgetValue } from './types';

interface PropertyDefOptions {
  name: string;
  label: string;
  type?: PropertyTypeValue;
  required?: boolean;
  default?: unknown;
  description?: string;
  ui?: {
    widget?: PropertyWidgetValue;
    placeholder?: string;
    rows?: number;
  } | Partial<{
    widget: PropertyWidgetValue;
    placeholder: string;
    rows: number;
  }>;
  validation?: ((value: unknown) => { valid: boolean; error?: string }) | null;
  options?: string[]; // Para tipo enum
}

export class PropertyDef {
  name: string;
  label: string;
  type: PropertyTypeValue;
  required: boolean;
  default: unknown;
  description: string;
  ui: {
    widget: PropertyWidgetValue;
    placeholder: string;
    rows: number;
  };
  validation: ((value: unknown) => { valid: boolean; error?: string }) | null;
  options: string[];

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
  }: PropertyDefOptions) {
    this.name = name;
    this.label = label;
    this.type = type;
    this.required = required;
    this.default = defaultValue;
    this.description = description;
    const defaultWidget = ui.widget || this._getDefaultWidget(type);
    this.ui = {
      widget: defaultWidget,
      placeholder: ui.placeholder ?? '',
      rows: ui.rows ?? (defaultWidget === 'textarea' || defaultWidget === 'code' ? 3 : 1),
      ...ui,
    };
    this.validation = validation;
    this.options = options; // Para enum/select
  }

  private _getDefaultWidget(type: PropertyTypeValue): PropertyWidgetValue {
    const widgetMap: Record<PropertyTypeValue, PropertyWidgetValue> = {
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
  validate(value: unknown): { valid: boolean; error?: string } {
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
      if (!this.options.includes(value as string)) {
        return { valid: false, error: `${this.label} debe ser uno de: ${this.options.join(', ')}` };
      }
    }

    return { valid: true };
  }
}
