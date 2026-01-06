import { useState } from 'react';
import { Plus, Minus, Maximize2, VectorSquare, Loader2 } from 'lucide-react';
import { useReactFlow } from '@xyflow/react';
import './CustomControls.css';

/**
 * Controles personalizados para React Flow
 * Incluye zoom in, zoom out, fit view, y auto layout
 */
const CustomControls = ({ onLayout }) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const [isLayouting, setIsLayouting] = useState(false);
  const [showTooltip, setShowTooltip] = useState(null);

  const handleLayout = async () => {
    setIsLayouting(true);
    try {
      await onLayout();
    } finally {
      setIsLayouting(false);
    }
  };

  const handleFitView = () => {
    fitView({ duration: 300, padding: 0.2 });
  };

  const handleZoomIn = () => {
    zoomIn({ duration: 300 });
  };

  const handleZoomOut = () => {
    zoomOut({ duration: 300 });
  };

  return (
    <div className="custom-controls">
      {/* Zoom In */}
      <button
        className="custom-control-button"
        onClick={handleZoomIn}
        onMouseEnter={() => setShowTooltip('zoom-in')}
        onMouseLeave={() => setShowTooltip(null)}
        aria-label="Zoom in"
      >
        <Plus size={18} />
        {showTooltip === 'zoom-in' && (
          <div className="custom-control-tooltip">Zoom In</div>
        )}
      </button>

      {/* Zoom Out */}
      <button
        className="custom-control-button"
        onClick={handleZoomOut}
        onMouseEnter={() => setShowTooltip('zoom-out')}
        onMouseLeave={() => setShowTooltip(null)}
        aria-label="Zoom out"
      >
        <Minus size={18} />
        {showTooltip === 'zoom-out' && (
          <div className="custom-control-tooltip">Zoom Out</div>
        )}
      </button>

      {/* Fit View */}
      <button
        className="custom-control-button"
        onClick={handleFitView}
        onMouseEnter={() => setShowTooltip('fit-view')}
        onMouseLeave={() => setShowTooltip(null)}
        aria-label="Fit view"
      >
        <Maximize2 size={18} />
        {showTooltip === 'fit-view' && (
          <div className="custom-control-tooltip">Fit View</div>
        )}
      </button>

      {/* Auto Layout */}
      <button
        className="custom-control-button"
        onClick={handleLayout}
        disabled={isLayouting}
        onMouseEnter={() => !isLayouting && setShowTooltip('layout')}
        onMouseLeave={() => setShowTooltip(null)}
        aria-label="Auto Layout"
      >
        {isLayouting ? (
          <Loader2 size={18} className="layout-spinner animate-spin" />
        ) : (
          <VectorSquare size={18} />
        )}
        {showTooltip === 'layout' && (
          <div className="custom-control-tooltip">Auto Layout</div>
        )}
      </button>
    </div>
  );
};

export default CustomControls;

