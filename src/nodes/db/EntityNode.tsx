import { Handle, Position, type NodeProps, useEdges } from '@xyflow/react';
import { useState, useRef, useEffect, useMemo } from 'react';
import { Database, Plus, X, Edit2, Key, Lock, AlertCircle } from 'lucide-react';
import type { EntityNodeData, EntityAttribute, SQLDataType } from '../../types/database';
import './ERNodeStyles.css';

interface EntityNodeProps extends NodeProps {
  data: EntityNodeData;
}

const SQL_DATA_TYPES: SQLDataType[] = [
  'VARCHAR',
  'CHAR',
  'TEXT',
  'INTEGER',
  'BIGINT',
  'SMALLINT',
  'DECIMAL',
  'NUMERIC',
  'FLOAT',
  'DOUBLE',
  'BOOLEAN',
  'DATE',
  'TIME',
  'TIMESTAMP',
  'DATETIME',
  'BLOB',
  'JSON',
  'UUID',
];

const EntityNode = ({ data, selected, id }: EntityNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [entityName, setEntityName] = useState(data.entityName || 'Nueva Entidad');
  const [attributes, setAttributes] = useState<EntityAttribute[]>(data.attributes || []);
  const [editingAttributeId, setEditingAttributeId] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  // Obtener edges para determinar qué atributos tienen conexiones
  const edges = useEdges();
  
  // Calcular qué handles tienen conexiones
  const connectedHandles = useMemo(() => {
    const connected = new Set<string>();
    edges.forEach(edge => {
      if (edge.source === id && edge.sourceHandle) {
        connected.add(edge.sourceHandle);
      }
      if (edge.target === id && edge.targetHandle) {
        connected.add(edge.targetHandle);
      }
    });
    return connected;
  }, [edges, id]);

  useEffect(() => {
    if (isEditing && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditing]);

  const handleNameChange = (newName: string) => {
    setEntityName(newName);
    // Actualizar datos del nodo
    if (data.onChange) {
      data.onChange({
        ...data,
        entityName: newName,
      });
    }
  };

  const handleNameBlur = () => {
    setIsEditing(false);
    const finalName = entityName.trim() === '' ? 'Nueva Entidad' : entityName.trim();
    setEntityName(finalName);
    // Actualizar datos del nodo cuando se completa la edición
    if (data.onChange) {
      data.onChange({
        ...data,
        entityName: finalName,
        attributes,
      });
    }
  };

  const handleAddAttribute = () => {
    const newAttribute: EntityAttribute = {
      id: `attr_${Date.now()}`,
      name: 'nueva_columna',
      dataType: 'VARCHAR',
      nullable: true,
      primaryKey: false,
      unique: false,
    };
    const updatedAttributes = [...attributes, newAttribute];
    setAttributes(updatedAttributes);
    setEditingAttributeId(newAttribute.id);
    updateNodeData(updatedAttributes);
  };
  
  const updateNodeData = (updatedAttributes: EntityAttribute[]) => {
    if (data.onChange) {
      data.onChange({
        ...data,
        attributes: updatedAttributes,
        entityName,
      });
    }
  };

  const handleDeleteAttribute = (attributeId: string) => {
    const updatedAttributes = attributes.filter(attr => attr.id !== attributeId);
    setAttributes(updatedAttributes);
    updateNodeData(updatedAttributes);
  };

  const validateAttributeChanges = (attributeId: string, updates: Partial<EntityAttribute>, currentAttributes: EntityAttribute[]): Partial<EntityAttribute> => {
    const attribute = currentAttributes.find(attr => attr.id === attributeId);
    if (!attribute) return updates;

    const finalUpdates = { ...updates };

    // Validación 1: PRIMARY KEY no puede ser NULL
    if (updates.primaryKey === true || (updates.primaryKey === undefined && attribute.primaryKey)) {
      finalUpdates.nullable = false;
      if (data.onNotification && (updates.nullable === true || (updates.nullable === undefined && attribute.nullable))) {
        data.onNotification('Una llave primaria no puede ser NULL. Se ha establecido automáticamente como NOT NULL.', 'warning');
      }
    }

    // Validación 2: Si se desmarca PRIMARY KEY, verificar si hay otros PKs
    if (updates.primaryKey === false && attribute.primaryKey) {
      const otherPKs = currentAttributes.filter(attr => attr.id !== attributeId && attr.primaryKey);
      if (otherPKs.length === 0 && data.onNotification) {
        data.onNotification('Se ha eliminado la única llave primaria. Se recomienda tener al menos una PK.', 'warning');
      }
    }

    // Validación 3: Sugerencia para IDs que deberían ser INTEGER
    const attributeName = updates.name || attribute.name;
    const isLikelyId = /^id$|_id$|^pk_/i.test(attributeName);
    if (isLikelyId && updates.dataType && updates.dataType !== 'INTEGER' && updates.dataType !== 'BIGINT') {
      if (data.onNotification) {
        data.onNotification(`Se recomienda usar INTEGER o BIGINT para columnas de ID como "${attributeName}"`, 'info');
      }
    }

    // Validación 4: VARCHAR sin longitud especificada
    if ((updates.dataType === 'VARCHAR' || attribute.dataType === 'VARCHAR') && !updates.length && !attribute.length) {
      if (data.onNotification && (updates.dataType === 'VARCHAR' || updates.dataType === undefined)) {
        data.onNotification(`Se recomienda especificar una longitud para VARCHAR en "${attributeName || attribute.name}"`, 'info');
      }
    }

    // Validación 5: UNIQUE y PRIMARY KEY juntos (redundante pero válido)
    if (updates.unique === true && (updates.primaryKey === true || attribute.primaryKey)) {
      if (data.onNotification) {
        data.onNotification('Una llave primaria ya es única por defecto. El atributo UNIQUE es redundante.', 'info');
      }
    }

    return finalUpdates;
  };

  const handleAttributeChange = (attributeId: string, updates: Partial<EntityAttribute>) => {
    // Validar cambios antes de aplicarlos
    const validatedUpdates = validateAttributeChanges(attributeId, updates, attributes);
    
    const updatedAttributes = attributes.map(attr => 
      attr.id === attributeId ? { ...attr, ...validatedUpdates } : attr
    );
    setAttributes(updatedAttributes);
    // Propagar cambios inmediatamente al canvas para que se validen las relaciones
    updateNodeData(updatedAttributes);
  };

  const togglePrimaryKey = (attributeId: string) => {
    const attribute = attributes.find(attr => attr.id === attributeId);
    if (attribute) {
      // Si se marca como PK, desmarcar otros PKs
      const updatedAttributes = attributes.map(attr => {
        if (attr.id === attributeId) {
          return { ...attr, primaryKey: !attr.primaryKey };
        }
        if (attr.primaryKey && !attribute.primaryKey) {
          return { ...attr, primaryKey: false };
        }
        return attr;
      });
      setAttributes(updatedAttributes);
      updateNodeData(updatedAttributes);
    }
  };

  return (
    <div
      className={`er-node entity-node ${selected ? 'node-selected' : ''}`}
      style={{ minWidth: '250px' }}
    >
      {/* Header de la entidad */}
      <div className="er-node-header">
        <Database size={16} className="er-node-icon" />
        {isEditing ? (
          <input
            ref={nameInputRef}
            type="text"
            value={entityName}
            onChange={(e) => handleNameChange(e.target.value)}
            onBlur={handleNameBlur}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleNameBlur();
              }
            }}
            className="er-node-name-input"
          />
        ) : (
          <span 
            className="er-node-name"
            onDoubleClick={() => setIsEditing(true)}
          >
            {entityName}
          </span>
        )}
        <button
          className="er-node-edit-button"
          onClick={() => setIsEditing(true)}
          title="Editar nombre"
        >
          <Edit2 size={12} />
        </button>
      </div>

      {/* Lista de atributos */}
      <div className="er-node-attributes">
        {attributes.map((attribute) => (
          <div key={attribute.id} className="er-attribute">
            {editingAttributeId === attribute.id ? (
              <div className="er-attribute-editor">
                <input
                  type="text"
                  value={attribute.name}
                  onChange={(e) => {
                    const newName = e.target.value;
                    handleAttributeChange(attribute.id, { name: newName });
                    
                    // Validación: Sugerir INTEGER para IDs cuando se cambia el nombre
                    const isLikelyId = /^id$|_id$|^pk_/i.test(newName);
                    if (isLikelyId && attribute.dataType !== 'INTEGER' && attribute.dataType !== 'BIGINT' && data.onNotification) {
                      data.onNotification(`Se recomienda usar INTEGER o BIGINT para columnas de ID como "${newName}"`, 'info');
                    }
                  }}
                  onBlur={() => setEditingAttributeId(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setEditingAttributeId(null);
                    }
                  }}
                  className="er-attribute-name-input"
                  placeholder="nombre_columna"
                />
                <select
                  value={attribute.dataType}
                  onChange={(e) => {
                    const newDataType = e.target.value as SQLDataType;
                    handleAttributeChange(attribute.id, { dataType: newDataType });
                    
                    // Validación: Sugerir INTEGER para IDs
                    const isLikelyId = /^id$|_id$|^pk_/i.test(attribute.name);
                    if (isLikelyId && newDataType !== 'INTEGER' && newDataType !== 'BIGINT' && data.onNotification) {
                      data.onNotification(`Se recomienda usar INTEGER o BIGINT para columnas de ID como "${attribute.name}"`, 'info');
                    }
                    
                    // Validación: VARCHAR sin longitud
                    if (newDataType === 'VARCHAR' && !attribute.length && data.onNotification) {
                      data.onNotification(`Se recomienda especificar una longitud para VARCHAR en "${attribute.name}"`, 'info');
                    }
                  }}
                  className="er-attribute-type-select"
                >
                  {SQL_DATA_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {attribute.dataType === 'VARCHAR' || attribute.dataType === 'CHAR' ? (
                  <input
                    type="number"
                    value={attribute.length || ''}
                    onChange={(e) => {
                      const lengthValue = e.target.value ? parseInt(e.target.value) : undefined;
                      handleAttributeChange(attribute.id, { length: lengthValue });
                      
                      // Validación: Longitud mínima recomendada
                      if (lengthValue !== undefined && lengthValue < 1 && data.onNotification) {
                        data.onNotification('La longitud debe ser mayor a 0', 'warning');
                      }
                    }}
                    className="er-attribute-length-input"
                    placeholder="length"
                  />
                ) : null}
                <div className="er-attribute-options">
                  <label className="er-attribute-checkbox">
                    <input
                      type="checkbox"
                      checked={attribute.primaryKey}
                      onChange={() => togglePrimaryKey(attribute.id)}
                    />
                    PK
                  </label>
                  <label className="er-attribute-checkbox">
                    <input
                      type="checkbox"
                      checked={attribute.unique}
                      onChange={(e) => handleAttributeChange(attribute.id, { unique: e.target.checked })}
                    />
                    UQ
                  </label>
                  <label className="er-attribute-checkbox">
                    <input
                      type="checkbox"
                      checked={attribute.nullable}
                      onChange={(e) => {
                        // Si es PRIMARY KEY, no permitir que sea NULL
                        if (attribute.primaryKey && e.target.checked) {
                          if (data.onNotification) {
                            data.onNotification('Una llave primaria no puede ser NULL.', 'warning');
                          }
                          return; // No hacer el cambio
                        }
                        handleAttributeChange(attribute.id, { nullable: e.target.checked });
                      }}
                      disabled={attribute.primaryKey} // Deshabilitar si es PK
                    />
                    NULL
                  </label>
                </div>
                <button
                  className="er-attribute-delete-button"
                  onClick={() => handleDeleteAttribute(attribute.id)}
                  title="Eliminar atributo"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div 
                className="er-attribute-display"
                onDoubleClick={() => setEditingAttributeId(attribute.id)}
              >
                <div className="er-attribute-icons">
                  {attribute.primaryKey && (
                    <div title="Primary Key">
                      <Key size={12} className="er-attribute-icon er-attribute-icon-pk" />
                    </div>
                  )}
                  {attribute.unique && (
                    <div title="Unique">
                      <Lock size={12} className="er-attribute-icon er-attribute-icon-uq" />
                    </div>
                  )}
                  {!attribute.nullable && (
                    <div title="Not Null">
                      <AlertCircle size={12} className="er-attribute-icon er-attribute-icon-nn" />
                    </div>
                  )}
                </div>
                <span className="er-attribute-name">
                  {attribute.name}
                </span>
                <span className="er-attribute-type">
                  {attribute.dataType}
                  {attribute.length && `(${attribute.length})`}
                </span>
                {/* Handle para cada atributo - Source (derecha) */}
                <Handle
                  type="source"
                  position={Position.Right}
                  id={`attr_${attribute.id}`}
                  className={`er-attribute-handle ${connectedHandles.has(`attr_${attribute.id}`) ? 'er-attribute-handle-connected' : ''}`}
                  style={{
                    top: '50%',
                    transform: 'translateY(-50%)',
                    right: '-12px',
                  }}
                />
                {/* Handle para cada atributo - Target (izquierda) */}
                <Handle
                  type="target"
                  position={Position.Left}
                  id={`attr_${attribute.id}`}
                  className={`er-attribute-handle ${connectedHandles.has(`attr_${attribute.id}`) ? 'er-attribute-handle-connected' : ''}`}
                  style={{
                    top: '50%',
                    transform: 'translateY(-50%)',
                    left: '-12px',
                  }}
                />
              </div>
            )}
          </div>
        ))}
        <button
          className="er-add-attribute-button"
          onClick={handleAddAttribute}
          title="Agregar atributo"
        >
          <Plus size={14} />
          <span>Agregar columna</span>
        </button>
      </div>

    </div>
  );
};

export default EntityNode;
