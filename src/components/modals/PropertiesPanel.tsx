import { useState, useEffect, useCallback, ChangeEvent, KeyboardEvent } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { getNodeDefinition } from '../../utils/nodeInstance';
import type { PropertyDef } from '../../nodes/definitions/PropertyDef';
import { listCredentials, type Credential } from '../../services/credentialsService';
import './PropertiesPanel.css';

interface PropertiesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string | null;
}

const PropertiesPanel = ({ isOpen, onClose, nodeId }: PropertiesPanelProps) => {
  const { nodes, updateNodeConfig } = useEditorStore();
  const nodesArray = Array.isArray(nodes) ? nodes : [];
  const selectedNode = nodeId ? nodesArray.find((n) => n.id === nodeId) : null;
  const definition = selectedNode ? getNodeDefinition(selectedNode) : null;
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [credentials, setCredentials] = useState<Credential[]>([]);

  useEffect(() => {
    if (selectedNode) {
      setFormData((selectedNode.data?.config as Record<string, unknown>) || {});
    }
  }, [selectedNode, nodeId]);

  // Cargar credenciales si el nodo tiene credential definitions
  useEffect(() => {
    if (definition && definition.credentials && definition.credentials.length > 0) {
      listCredentials()
        .then(setCredentials)
        .catch(() => setCredentials([]));
    }
  }, [definition]);

  // Cerrar modal con Escape o al hacer clic fuera
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape as unknown as EventListener);
    return () => document.removeEventListener('keydown', handleEscape as unknown as EventListener);
  }, [isOpen, onClose]);

  if (!isOpen || !selectedNode || !definition) {
    return null;
  }

  const handleChange = (propertyName: string, value: unknown) => {
    const newFormData = { ...formData, [propertyName]: value };
    setFormData(newFormData);
    if (nodeId) {
      updateNodeConfig(nodeId, { [propertyName]: value });
    }
  };

  const renderPropertyInput = (property: PropertyDef) => {
    const value = formData[property.name] ?? property.default ?? '';

    switch (property.ui.widget) {
      case 'select':
        return (
          <select
            value={value as string}
            onChange={(e: ChangeEvent<HTMLSelectElement>) => handleChange(property.name, e.target.value)}
            className="properties-input"
          >
            {property.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value as number}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(property.name, Number(e.target.value))}
            className="properties-input"
            placeholder={property.ui.placeholder}
          />
        );

      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={value as boolean}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange(property.name, e.target.checked)}
            className="properties-checkbox"
          />
        );

      case 'code':
        return (
          <textarea
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleChange(property.name, parsed);
              } catch {
                handleChange(property.name, e.target.value);
              }
            }}
            className="properties-textarea properties-code"
            rows={property.ui.rows || 5}
            placeholder={property.ui.placeholder}
          />
        );

      case 'textarea':
      default:
        return (
          <textarea
            value={value as string}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleChange(property.name, e.target.value)}
            className="properties-textarea"
            rows={property.ui.rows || 3}
            placeholder={property.ui.placeholder}
          />
        );
    }
  };

  return (
    <div className="properties-modal-overlay" onClick={onClose}>
      <div className="properties-modal" onClick={(e) => e.stopPropagation()}>
        <div className="properties-panel-header">
          <div>
            <h3>{definition.displayName}</h3>
            <div className="properties-panel-type">{selectedNode.data?.typeId}</div>
          </div>
          <button className="properties-modal-close" onClick={onClose} aria-label="Cerrar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M18 6L6 18M6 6L18 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

      <div className="properties-panel-content">
        {/* Selector de credencial */}
        {definition.credentials && definition.credentials.length > 0 && (
          <div className="properties-field properties-credential-section">
            <label className="properties-label">
              Credencial
              <span className="properties-required">*</span>
            </label>
            <div className="properties-description">
              Selecciona la credencial para este nodo. Crea credenciales en la seccion Credenciales.
            </div>
            <select
              value={(formData['credential_id'] as string) || ''}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => handleChange('credential_id', e.target.value)}
              className="properties-input"
            >
              <option value="">-- Seleccionar credencial --</option>
              {credentials
                .filter(c => {
                  // Filtrar por tipo compatible
                  const credDef = definition.credentials[0];
                  if (!credDef?.type) return true;
                  return c.credential_type === credDef.type || c.credential_type === 'openai' || c.credential_type === 'azure_openai';
                })
                .map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.credential_type})
                  </option>
                ))
              }
            </select>
          </div>
        )}

        {definition.properties.length === 0 && (!definition.credentials || definition.credentials.length === 0) ? (
          <div className="properties-panel-empty">Este nodo no tiene propiedades configurables</div>
        ) : (
          definition.properties.filter(p => p.name !== 'credential_id').map((property: PropertyDef) => (
            <div key={property.name} className="properties-field">
              <label className="properties-label">
                {property.label}
                {property.required && <span className="properties-required">*</span>}
              </label>
              {property.description && (
                <div className="properties-description">{property.description}</div>
              )}
              {renderPropertyInput(property)}
            </div>
          ))
        )}
      </div>
      <div className="properties-modal-footer">
        <button className="properties-modal-button" onClick={onClose}>
          Cerrar
        </button>
      </div>
    </div>
    </div>
  );
};

export default PropertiesPanel;
