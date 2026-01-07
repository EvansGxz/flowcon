import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, X, ChevronRight } from 'lucide-react';
import { nodeRegistry, NodeCategory } from '../../nodes/definitions';
import { getCategoryMetadata } from '../../utils/categoryIcons';
import { getNodeIcon } from '../../utils/nodeIcons';
import './NodePalette.css';

const NodePalette = ({ onAddNode, isOpen, onClose, connectionFilter = null }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [shouldRender, setShouldRender] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const timeoutRef = useRef(null);

  // Manejar montaje y desmontaje con animación
  useEffect(() => {
    if (isOpen) {
      // Limpiar cualquier timeout pendiente
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      // Montar el componente
      setShouldRender(true);
      // Resetear estado de animación primero para asegurar estado inicial
      setIsAnimating(false);
      // Pequeño delay para asegurar que el DOM se haya renderizado
      // con el estado inicial (sin clase 'open') antes de activar la animación
      timeoutRef.current = setTimeout(() => {
        setIsAnimating(true);
        timeoutRef.current = null;
      }, 10); // Delay mínimo para que el navegador renderice el estado inicial
    } else {
      // Iniciar animación de salida
      setIsAnimating(false);
      // Esperar a que termine la animación antes de desmontar
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setShouldRender(false);
        timeoutRef.current = null;
      }, 300); // Duración de la animación
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isOpen]);

  // Cerrar al presionar Escape
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  const categories = Object.values(NodeCategory);
  const allDefinitions = nodeRegistry.getAll();

  // Obtener categorías con conteo de nodos y metadata
  const categoriesWithCount = categories.map((category) => {
    const count = allDefinitions.filter((def) => def.category === category).length;
    const metadata = getCategoryMetadata(category);
    return { category, count, ...metadata };
  }).filter((item) => item.count > 0);

  // Si hay un filtro de conexión, mostrar nodos directamente sin categorías
  // Si hay una categoría seleccionada, mostrar nodos de esa categoría
  // Si no, mostrar lista de categorías
  const showCategories = selectedCategory === null && !connectionFilter;

  // Filtrar nodos por categoría seleccionada o búsqueda
  let filteredNodes = [];
  if (showCategories) {
    // No mostrar nodos, solo categorías
    filteredNodes = [];
  } else {
    // Si hay un filtro de conexión, mostrar todos los nodos compatibles
    if (connectionFilter) {
      const { nodeId, handleId, handleType } = connectionFilter;
      filteredNodes = allDefinitions.filter((def) => {
        if (handleType === 'source') {
          // Si es un source handle (output), buscar nodos con inputs compatibles
          return def.inputs && def.inputs.length > 0;
        } else if (handleType === 'target') {
          // Si es un target handle (input), buscar nodos con outputs compatibles
          return def.outputs && def.outputs.length > 0;
        }
        return true;
      });
    } else {
      // Filtrar por categoría seleccionada
      filteredNodes = allDefinitions.filter((def) => def.category === selectedCategory);
    }
    
    // Si hay búsqueda, filtrar también por búsqueda
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filteredNodes = filteredNodes.filter((def) =>
        def.displayName.toLowerCase().includes(searchLower) ||
        def.description.toLowerCase().includes(searchLower) ||
        def.tags.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }
  }

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setSearchQuery(''); // Limpiar búsqueda al cambiar de categoría
  };

  const handleBackClick = () => {
    setSelectedCategory(null);
    setSearchQuery('');
  };

  const handleNodeClick = (definition) => {
    onAddNode(definition.typeId);
    // No cerrar el sidebar, solo agregar el nodo
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      <div className={`node-palette-overlay ${isAnimating ? 'visible' : ''}`} onClick={handleOverlayClick} />
      <div className={`node-palette-sidebar ${isAnimating ? 'open' : ''}`}>
        <div className="node-palette-header">
          {!showCategories && (
            <button className="node-palette-back" onClick={handleBackClick} title="Volver a categorías">
              <ChevronLeft size={20} />
            </button>
          )}
          <h3>
            {connectionFilter 
              ? (connectionFilter.handleType === 'source' ? 'Conectar desde' : 'Conectar a')
              : (showCategories ? 'Categorías' : selectedCategory)
            }
          </h3>
          <button className="node-palette-close" onClick={onClose} title="Cerrar">
            <X size={20} />
          </button>
        </div>

        {!showCategories && (
          <div className="node-palette-search">
            <input
              type="text"
              placeholder={connectionFilter ? "Buscar nodos compatibles..." : "Buscar nodos..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="node-palette-search-input"
            />
          </div>
        )}

        <div className="node-palette-content">
          {showCategories ? (
            <div className="node-palette-categories-list">
              {categoriesWithCount.map(({ category, count, icon, description, color }) => (
                <button
                  key={category}
                  className="node-palette-category-item"
                  onClick={() => handleCategoryClick(category)}
                >
                  <div className="node-palette-category-icon-wrapper" style={{ backgroundColor: `${color}20` }}>
                    <div className="node-palette-category-icon" style={{ color }}>
                      {icon}
                    </div>
                  </div>
                  <div className="node-palette-category-item-content">
                    <div className="node-palette-category-name">{category}</div>
                    <div className="node-palette-category-description">{description}</div>
                  </div>
                  <div className="node-palette-category-count">{count}</div>
                  <ChevronRight size={16} className="node-palette-category-arrow" />
                </button>
              ))}
            </div>
          ) : (
            <div className="node-palette-nodes-list">
              {filteredNodes.length === 0 ? (
                <div className="node-palette-empty">
                  {searchQuery ? 'No se encontraron nodos' : 'No hay nodos en esta categoría'}
                </div>
              ) : (
                filteredNodes.map((definition) => (
                  <div
                    key={definition.typeId}
                    className="node-palette-item"
                    onClick={() => handleNodeClick(definition)}
                  >
                    <div className="node-palette-item-icon-wrapper" style={{ backgroundColor: `${definition.color}20` }}>
                      <div className="node-palette-item-icon" style={{ color: definition.color }}>
                        {getNodeIcon(definition.icon, definition.color)}
                      </div>
                    </div>
                    <div className="node-palette-item-content">
                      <div className="node-palette-item-name">{definition.displayName}</div>
                      <div className="node-palette-item-description">{definition.description}</div>
                      <div className="node-palette-item-tags">
                        {definition.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="node-palette-tag">{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div className="node-palette-item-version">v{definition.version}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default NodePalette;
