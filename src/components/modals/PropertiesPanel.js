import { useState, useEffect } from 'react';
import { useEditorStore } from '../../store/editorStore';
import { getNodeDefinition } from '../../utils/nodeInstance';
import './PropertiesPanel.css';

const PropertiesPanel = ({ isOpen, onClose, nodeId }) => {
  const { nodes, updateNodeConfig } = useEditorStore();
  const nodesArray = Array.isArray(nodes) ? nodes : [];
  const selectedNode = nodeId ? nodesArray.find((n) => n.id === nodeId) : null;
  const definition = selectedNode ? getNodeDefinition(selectedNode) : null;
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (selectedNode) {
      setFormData(selectedNode.data?.config || {});
    }
  }, [selectedNode, nodeId]);

  // Cerrar modal con Escape o al hacer clic fuera
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen || !selectedNode || !definition) {
    return null;
  }

  const handleChange = (propertyName, value) => {
    const newFormData = { ...formData, [propertyName]: value };
    setFormData(newFormData);
    if (nodeId) {
      updateNodeConfig(nodeId, { [propertyName]: value });
    }
  };

  const renderPropertyInput = (property) => {
    const value = formData[property.name] ?? property.default ?? '';

    switch (property.ui.widget) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleChange(property.name, e.target.value)}
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
            value={value}
            onChange={(e) => handleChange(property.name, Number(e.target.value))}
            className="properties-input"
            placeholder={property.ui.placeholder}
          />
        );

      case 'checkbox':
        return (
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => handleChange(property.name, e.target.checked)}
            className="properties-checkbox"
          />
        );

      case 'code':
        return (
          <textarea
            value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
            onChange={(e) => {
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
            value={value}
            onChange={(e) => handleChange(property.name, e.target.value)}
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
        {definition.properties.length === 0 ? (
          <div className="properties-panel-empty">Este nodo no tiene propiedades configurables</div>
        ) : (
          definition.properties.map((property) => (
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

