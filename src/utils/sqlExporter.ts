/**
 * Utilidades para exportar e importar esquemas SQL
 * Soporta PostgreSQL, SQLite y SQL Server
 */

import type { EntityNodeData, EntityAttribute, SQLDataType, SQLDialect } from '../types/database';
import type { Node, Edge } from '@xyflow/react';

/**
 * Mapea tipos de datos genéricos a tipos específicos del dialecto SQL
 */
function mapDataTypeToDialect(dataType: SQLDataType, dialect: SQLDialect, length?: number): string {
  const lengthStr = length ? `(${length})` : '';
  
  switch (dialect) {
    case 'postgresql':
      switch (dataType) {
        case 'VARCHAR':
          return `VARCHAR${lengthStr || '(255)'}`;
        case 'CHAR':
          return `CHAR${lengthStr || '(1)'}`;
        case 'TEXT':
          return 'TEXT';
        case 'INTEGER':
          return 'INTEGER';
        case 'BIGINT':
          return 'BIGINT';
        case 'SMALLINT':
          return 'SMALLINT';
        case 'DECIMAL':
          return 'DECIMAL';
        case 'NUMERIC':
          return 'NUMERIC';
        case 'FLOAT':
          return 'REAL';
        case 'DOUBLE':
          return 'DOUBLE PRECISION';
        case 'BOOLEAN':
          return 'BOOLEAN';
        case 'DATE':
          return 'DATE';
        case 'TIME':
          return 'TIME';
        case 'TIMESTAMP':
          return 'TIMESTAMP';
        case 'DATETIME':
          return 'TIMESTAMP';
        case 'BLOB':
          return 'BYTEA';
        case 'JSON':
          return 'JSONB';
        case 'UUID':
          return 'UUID';
        default:
          return dataType;
      }
    
    case 'sqlite':
      switch (dataType) {
        case 'VARCHAR':
        case 'CHAR':
        case 'TEXT':
          return 'TEXT';
        case 'INTEGER':
        case 'BIGINT':
        case 'SMALLINT':
          return 'INTEGER';
        case 'DECIMAL':
        case 'NUMERIC':
        case 'FLOAT':
        case 'DOUBLE':
          return 'REAL';
        case 'BOOLEAN':
          return 'INTEGER'; // SQLite usa INTEGER para booleanos (0 o 1)
        case 'DATE':
        case 'TIME':
        case 'TIMESTAMP':
        case 'DATETIME':
          return 'TEXT'; // SQLite almacena fechas como texto
        case 'BLOB':
          return 'BLOB';
        case 'JSON':
          return 'TEXT'; // SQLite almacena JSON como texto
        case 'UUID':
          return 'TEXT';
        default:
          return 'TEXT';
      }
    
    case 'sqlserver':
      switch (dataType) {
        case 'VARCHAR':
          return `VARCHAR${lengthStr || '(255)'}`;
        case 'CHAR':
          return `CHAR${lengthStr || '(1)'}`;
        case 'TEXT':
          return 'NVARCHAR(MAX)';
        case 'INTEGER':
          return 'INT';
        case 'BIGINT':
          return 'BIGINT';
        case 'SMALLINT':
          return 'SMALLINT';
        case 'DECIMAL':
          return 'DECIMAL(18, 2)';
        case 'NUMERIC':
          return 'NUMERIC(18, 2)';
        case 'FLOAT':
          return 'FLOAT';
        case 'DOUBLE':
          return 'FLOAT';
        case 'BOOLEAN':
          return 'BIT';
        case 'DATE':
          return 'DATE';
        case 'TIME':
          return 'TIME';
        case 'TIMESTAMP':
        case 'DATETIME':
          return 'DATETIME2';
        case 'BLOB':
          return 'VARBINARY(MAX)';
        case 'JSON':
          return 'NVARCHAR(MAX)'; // SQL Server almacena JSON como texto
        case 'UUID':
          return 'UNIQUEIDENTIFIER';
        default:
          return dataType;
      }
    
    default:
      return dataType;
  }
}

/**
 * Escapa nombres de tablas y columnas según el dialecto
 */
function escapeIdentifier(name: string, dialect: SQLDialect): string {
  switch (dialect) {
    case 'postgresql':
      return `"${name}"`;
    case 'sqlite':
      return `"${name}"`;
    case 'sqlserver':
      return `[${name}]`;
    default:
      return name;
  }
}

/**
 * Genera la definición de una columna SQL
 */
function generateColumnDefinition(
  attribute: EntityAttribute,
  dialect: SQLDialect
): string {
  const columnName = escapeIdentifier(attribute.name, dialect);
  const dataType = mapDataTypeToDialect(attribute.dataType, dialect, attribute.length);
  
  const parts: string[] = [columnName, dataType];
  
  // Primary Key
  if (attribute.primaryKey) {
    if (dialect === 'postgresql' || dialect === 'sqlite') {
      parts.push('PRIMARY KEY');
    } else if (dialect === 'sqlserver') {
      parts.push('PRIMARY KEY');
    }
  }
  
  // NOT NULL
  if (!attribute.nullable && !attribute.primaryKey) {
    parts.push('NOT NULL');
  }
  
  // UNIQUE
  if (attribute.unique && !attribute.primaryKey) {
    parts.push('UNIQUE');
  }
  
  // DEFAULT
  if (attribute.defaultValue) {
    parts.push(`DEFAULT ${attribute.defaultValue}`);
  }
  
  return parts.join(' ');
}

/**
 * Genera CREATE TABLE statement para una entidad
 */
function generateCreateTable(
  entityName: string,
  attributes: EntityAttribute[],
  dialect: SQLDialect
): string {
  const tableName = escapeIdentifier(entityName, dialect);
  const columns = attributes.map(attr => generateColumnDefinition(attr, dialect));
  
  // En PostgreSQL y SQL Server, las PRIMARY KEY se pueden definir al final
  if (dialect === 'postgresql' || dialect === 'sqlserver') {
    const pkColumns = attributes.filter(attr => attr.primaryKey);
    if (pkColumns.length > 1) {
      // Múltiples columnas como PK - definir al final
      const pkDef = `PRIMARY KEY (${pkColumns.map(attr => escapeIdentifier(attr.name, dialect)).join(', ')})`;
      columns.push(pkDef);
    }
  }
  
  return `CREATE TABLE ${tableName} (\n  ${columns.join(',\n  ')}\n);`;
}

/**
 * Genera FOREIGN KEY constraints basados en las relaciones (edges)
 */
function generateForeignKeys(
  edges: Edge[],
  nodes: Node<EntityNodeData>[],
  dialect: SQLDialect
): string[] {
  const fkStatements: string[] = [];
  
  edges.forEach((edge, index) => {
    if (!edge.sourceHandle || !edge.targetHandle) return;
    
    const sourceAttrId = edge.sourceHandle.replace('attr_', '');
    const targetAttrId = edge.targetHandle.replace('attr_', '');
    
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode) return;
    
    const sourceData = sourceNode.data as EntityNodeData;
    const targetData = targetNode.data as EntityNodeData;
    
    const sourceAttribute = sourceData.attributes?.find(attr => attr.id === sourceAttrId);
    const targetAttribute = targetData.attributes?.find(attr => attr.id === targetAttrId);
    
    if (!sourceAttribute || !targetAttribute) return;
    
    const sourceTable = escapeIdentifier(sourceData.entityName, dialect);
    const targetTable = escapeIdentifier(targetData.entityName, dialect);
    const sourceColumn = escapeIdentifier(sourceAttribute.name, dialect);
    const targetColumn = escapeIdentifier(targetAttribute.name, dialect);
    
    const fkName = `fk_${sourceData.entityName}_${sourceAttribute.name}_${index}`;
    const fkNameEscaped = escapeIdentifier(fkName, dialect);
    
    let fkStatement = '';
    if (dialect === 'postgresql') {
      fkStatement = `ALTER TABLE ${sourceTable} ADD CONSTRAINT ${fkNameEscaped} FOREIGN KEY (${sourceColumn}) REFERENCES ${targetTable}(${targetColumn});`;
    } else if (dialect === 'sqlite') {
      // SQLite no soporta ALTER TABLE ADD CONSTRAINT, se debe hacer en CREATE TABLE
      // Por ahora, generamos un comentario
      fkStatement = `-- FOREIGN KEY: ${sourceTable}.${sourceColumn} -> ${targetTable}.${targetColumn}`;
    } else if (dialect === 'sqlserver') {
      fkStatement = `ALTER TABLE ${sourceTable} ADD CONSTRAINT ${fkNameEscaped} FOREIGN KEY (${sourceColumn}) REFERENCES ${targetTable}(${targetColumn});`;
    }
    
    if (fkStatement) {
      fkStatements.push(fkStatement);
    }
  });
  
  return fkStatements;
}

/**
 * Exporta el esquema ER a SQL CREATE statements
 */
export function exportToSQL(
  nodes: Node<EntityNodeData>[],
  edges: Edge[],
  dialect: SQLDialect,
  databaseName?: string
): string {
  const statements: string[] = [];
  
  // Comentario de encabezado
  statements.push(`-- SQL Export for ${dialect.toUpperCase()}`);
  if (databaseName) {
    statements.push(`-- Database: ${databaseName}`);
  }
  statements.push(`-- Generated at: ${new Date().toISOString()}`);
  statements.push('');
  
  // CREATE DATABASE (solo para PostgreSQL y SQL Server)
  if (databaseName && (dialect === 'postgresql' || dialect === 'sqlserver')) {
    if (dialect === 'postgresql') {
      statements.push(`CREATE DATABASE ${escapeIdentifier(databaseName, dialect)};`);
    } else if (dialect === 'sqlserver') {
      statements.push(`CREATE DATABASE ${escapeIdentifier(databaseName, dialect)};`);
    }
    statements.push('');
  }
  
  // CREATE TABLE statements
  nodes.forEach(node => {
    const entityData = node.data as EntityNodeData;
    if (entityData.type === 'entity' && entityData.attributes && entityData.attributes.length > 0) {
      const createTable = generateCreateTable(entityData.entityName, entityData.attributes, dialect);
      statements.push(createTable);
      statements.push('');
    }
  });
  
  // FOREIGN KEY constraints
  const fkStatements = generateForeignKeys(edges, nodes, dialect);
  if (fkStatements.length > 0) {
    statements.push('-- Foreign Key Constraints');
    fkStatements.forEach(fk => {
      statements.push(fk);
    });
  }
  
  return statements.join('\n');
}

/**
 * Parsea SQL CREATE TABLE statements (implementación básica)
 * Nota: Esta es una implementación simplificada. Para producción, considerar usar un parser SQL completo.
 */
export function importFromSQL(sql: string, dialect: SQLDialect): {
  nodes: Node<EntityNodeData>[];
  edges: Edge[];
} {
  // Implementación básica - solo para demostración
  // En producción, usar un parser SQL completo como node-sql-parser
  
  const nodes: Node<EntityNodeData>[] = [];
  const edges: Edge[] = [];
  
  // Buscar CREATE TABLE statements
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`\[]?(\w+)["`\]]?\s*\(([^;]+)\)/gi;
  let match;
  let nodeIndex = 0;
  
  while ((match = createTableRegex.exec(sql)) !== null) {
    const tableName = match[1];
    const columnsDef = match[2];
    
    // Parsear columnas (implementación simplificada)
    const attributes: EntityAttribute[] = [];
    const columnLines = columnsDef.split(',').map(line => line.trim()).filter(line => line);
    
    columnLines.forEach((line, colIndex) => {
      // Ignorar constraints al final
      if (line.toUpperCase().includes('PRIMARY KEY') && line.includes('(')) {
        return; // PK compuesta, se maneja después
      }
      if (line.toUpperCase().includes('FOREIGN KEY')) {
        return; // FK, se maneja después
      }
      
      const parts = line.trim().split(/\s+/);
      if (parts.length < 2) return;
      
      const columnName = parts[0].replace(/["`\[\]]/g, '');
      const dataType = parts[1].toUpperCase();
      
      const isPrimaryKey = line.toUpperCase().includes('PRIMARY KEY');
      const isUnique = line.toUpperCase().includes('UNIQUE') && !isPrimaryKey;
      const isNotNull = line.toUpperCase().includes('NOT NULL') || isPrimaryKey;
      
      // Mapear tipo de dato básico
      let mappedType: SQLDataType = 'VARCHAR';
      if (dataType.includes('INT')) mappedType = 'INTEGER';
      else if (dataType.includes('TEXT')) mappedType = 'TEXT';
      else if (dataType.includes('DECIMAL') || dataType.includes('NUMERIC')) mappedType = 'DECIMAL';
      else if (dataType.includes('FLOAT') || dataType.includes('REAL')) mappedType = 'FLOAT';
      else if (dataType.includes('BOOLEAN') || dataType.includes('BIT')) mappedType = 'BOOLEAN';
      else if (dataType.includes('DATE')) mappedType = 'DATE';
      else if (dataType.includes('TIMESTAMP') || dataType.includes('DATETIME')) mappedType = 'TIMESTAMP';
      else if (dataType.includes('JSON')) mappedType = 'JSON';
      else if (dataType.includes('UUID') || dataType.includes('UNIQUEIDENTIFIER')) mappedType = 'UUID';
      
      attributes.push({
        id: `attr_${nodeIndex}_${colIndex}`,
        name: columnName,
        dataType: mappedType,
        nullable: !isNotNull,
        primaryKey: isPrimaryKey,
        unique: isUnique,
      });
    });
    
    if (attributes.length > 0) {
      const node: Node<EntityNodeData> = {
        id: `entity_${nodeIndex}`,
        type: 'entity',
        position: { x: nodeIndex * 300, y: 0 },
        data: {
          type: 'entity',
          entityId: `entity_${nodeIndex}`,
          entityName: tableName,
          attributes,
        },
      };
      nodes.push(node);
      nodeIndex++;
    }
  }
  
  return { nodes, edges };
}
