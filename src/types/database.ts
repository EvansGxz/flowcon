/**
 * Tipos para diagramas Entidad-Relación
 */

import type { Node } from '@xyflow/react';

// Tipos de datos SQL comunes
export type SQLDataType = 
  | 'VARCHAR'
  | 'CHAR'
  | 'TEXT'
  | 'INTEGER'
  | 'BIGINT'
  | 'SMALLINT'
  | 'DECIMAL'
  | 'NUMERIC'
  | 'FLOAT'
  | 'DOUBLE'
  | 'BOOLEAN'
  | 'DATE'
  | 'TIME'
  | 'TIMESTAMP'
  | 'DATETIME'
  | 'BLOB'
  | 'JSON'
  | 'UUID';

// Atributo de una entidad
export interface EntityAttribute {
  id: string;
  name: string;
  dataType: SQLDataType;
  length?: number;
  nullable: boolean;
  primaryKey: boolean;
  unique: boolean;
  defaultValue?: string;
  foreignKey?: {
    entityId: string;
    attributeId: string;
  };
}

// Entidad en el diagrama ER
export interface Entity {
  id: string;
  name: string;
  attributes: EntityAttribute[];
  position: { x: number; y: number };
}

// Tipo de relación
export type RelationshipType = 
  | 'one-to-one'
  | 'one-to-many'
  | 'many-to-many';

// Relación entre entidades
export interface Relationship {
  id: string;
  name?: string;
  type: RelationshipType;
  sourceEntityId: string;
  targetEntityId: string;
  sourceAttributeId?: string;
  targetAttributeId?: string;
  cardinality?: {
    source: '1' | 'N' | '0..1' | '0..N';
    target: '1' | 'N' | '0..1' | '0..N';
  };
}

// Datos de nodo de entidad
export interface EntityNodeData extends Record<string, unknown> {
  type: 'entity';
  entityId: string;
  entityName: string;
  attributes: EntityAttribute[];
  onChange?: (data: EntityNodeData) => void;
  onNotification?: (message: string, type: 'warning' | 'info') => void;
}

// Datos de nodo de atributo (para atributos sueltos o en relaciones)
export interface AttributeNodeData extends Record<string, unknown> {
  type: 'attribute';
  attributeId: string;
  attributeName: string;
  dataType: SQLDataType;
  length?: number;
  nullable: boolean;
  primaryKey: boolean;
  unique: boolean;
}

// Datos de nodo de relación
export interface RelationshipNodeData extends Record<string, unknown> {
  type: 'relationship';
  relationshipId: string;
  relationshipName?: string;
  relationshipType: RelationshipType;
}

// Nodo de React Flow para entidad
export type ERNode = Node<EntityNodeData | AttributeNodeData | RelationshipNodeData>;

// Diagrama ER completo
export interface ERDiagram {
  entities: Entity[];
  relationships: Relationship[];
}

// Dialecto SQL soportado
export type SQLDialect = 'postgresql' | 'sqlite' | 'sqlserver';

// Base de datos
export interface Database {
  id: string;
  name: string;
  dialect: SQLDialect;
  tables: Entity[];
}

// Estructura completa de esquema de base de datos
export interface DatabaseSchema {
  databases: Database[];
}
