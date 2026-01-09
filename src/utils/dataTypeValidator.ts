/**
 * Utilidades para validar compatibilidad de tipos de datos SQL
 */

import type { SQLDataType } from '../types/database';

// Grupos de tipos compatibles
const COMPATIBLE_TYPE_GROUPS: Record<string, SQLDataType[]> = {
  // Enteros
  integers: ['INTEGER', 'BIGINT', 'SMALLINT'],
  // Decimales
  decimals: ['DECIMAL', 'NUMERIC', 'FLOAT', 'DOUBLE'],
  // Texto
  text: ['VARCHAR', 'CHAR', 'TEXT'],
  // Fechas
  dates: ['DATE', 'TIME', 'TIMESTAMP', 'DATETIME'],
  // Booleanos
  booleans: ['BOOLEAN'],
  // Binarios
  binaries: ['BLOB'],
  // JSON
  json: ['JSON'],
  // UUID
  uuid: ['UUID'],
};

/**
 * Verifica si dos tipos de datos SQL son compatibles para relaciones
 */
export function areDataTypesCompatible(
  sourceType: SQLDataType,
  targetType: SQLDataType
): { compatible: boolean; reason?: string } {
  // Mismo tipo siempre es compatible
  if (sourceType === targetType) {
    return { compatible: true };
  }

  // Buscar en qué grupos están los tipos
  let sourceGroup: string | null = null;
  let targetGroup: string | null = null;

  for (const [group, types] of Object.entries(COMPATIBLE_TYPE_GROUPS)) {
    if (types.includes(sourceType)) {
      sourceGroup = group;
    }
    if (types.includes(targetType)) {
      targetGroup = group;
    }
  }

  // Si están en el mismo grupo, son compatibles
  if (sourceGroup && targetGroup && sourceGroup === targetGroup) {
    return { compatible: true };
  }

  // Casos especiales de compatibilidad
  // INTEGER puede ser compatible con DECIMAL/NUMERIC (puede haber pérdida de precisión)
  if (
    (sourceType === 'INTEGER' || sourceType === 'BIGINT' || sourceType === 'SMALLINT') &&
    (targetType === 'DECIMAL' || targetType === 'NUMERIC' || targetType === 'FLOAT' || targetType === 'DOUBLE')
  ) {
    return {
      compatible: true,
      reason: 'Los tipos enteros pueden relacionarse con tipos decimales, pero puede haber pérdida de precisión',
    };
  }

  // VARCHAR puede ser compatible con TEXT (generalmente compatible)
  if (
    (sourceType === 'VARCHAR' || sourceType === 'CHAR') &&
    targetType === 'TEXT'
  ) {
    return { compatible: true };
  }

  if (
    sourceType === 'TEXT' &&
    (targetType === 'VARCHAR' || targetType === 'CHAR')
  ) {
    return { compatible: true };
  }

  // No son compatibles
  return {
    compatible: false,
    reason: `Los tipos ${sourceType} y ${targetType} no son compatibles para relaciones. Los tipos deben ser del mismo grupo o compatibles.`,
  };
}

/**
 * Obtiene un mensaje de advertencia o error según la compatibilidad
 */
export function getDataTypeCompatibilityMessage(
  sourceType: SQLDataType,
  targetType: SQLDataType,
  sourceName: string,
  targetName: string
): { type: 'error' | 'warning'; message: string } {
  const result = areDataTypesCompatible(sourceType, targetType);

  if (result.compatible) {
    // Si hay una razón (advertencia), retornar warning
    if (result.reason) {
      return {
        type: 'warning',
        message: `Advertencia: ${result.reason}\nRelación: ${sourceName} (${sourceType}) → ${targetName} (${targetType})`,
      };
    }
    // Si son completamente compatibles sin advertencias, no debería llamarse esta función
    // Pero por seguridad, retornamos un warning genérico (aunque esto no debería ocurrir)
    return {
      type: 'warning',
      message: `Relación válida: ${sourceName} (${sourceType}) → ${targetName} (${targetType})`,
    };
  }

  return {
    type: 'error' as const,
    message: `Error: ${result.reason || `Los tipos ${sourceType} y ${targetType} no son compatibles`}\nNo se puede relacionar ${sourceName} (${sourceType}) con ${targetName} (${targetType})`,
  };
}
