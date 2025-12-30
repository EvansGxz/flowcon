/**
 * Definición de un puerto (handle) de un nodo
 */
export class PortDef {
  constructor({
    id,
    type = 'main',
    label = '',
    multiple = false,
    required = false,
    dataType = 'any',
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
  canConnectTo(targetPort) {
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

