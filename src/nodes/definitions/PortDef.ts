/**
 * Definición de un puerto (handle) de un nodo
 */

import type { PortTypeValue } from './types';

export class PortDef {
  id: string;
  type: PortTypeValue;
  label: string;
  multiple: boolean;
  required: boolean;
  dataType: string;

  constructor({
    id,
    type = 'main',
    label = '',
    multiple = false,
    required = false,
    dataType = 'any',
  }: {
    id: string;
    type?: PortTypeValue;
    label?: string;
    multiple?: boolean;
    required?: boolean;
    dataType?: string;
  }) {
    this.id = id;
    this.type = type;
    this.label = label;
    this.multiple = multiple; // Permite múltiples conexiones
    this.required = required;
    this.dataType = dataType; // Tipo de dato que acepta/envía
  }

  /**
   * Valida si este puerto puede conectarse con otro
   */
  canConnectTo(targetPort: PortDef): boolean {
    // Validaciones básicas
    if (this.type === 'error' && targetPort.type !== 'error') {
      return false;
    }
    if (this.type === 'control' && targetPort.type !== 'control') {
      return false;
    }
    // Validación de tipos de datos (si están definidos)
    if (this.dataType !== 'any' && targetPort.dataType !== 'any') {
      return this.dataType === targetPort.dataType;
    }
    return true;
  }
}
