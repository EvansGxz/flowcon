import { useState } from 'react';
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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M12 5V19M5 12H19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M5 12H19"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
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
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M8 3H5C3.89543 3 3 3.89543 3 5V8M21 8V5C21 3.89543 20.1046 3 19 3H16M16 21H19C20.1046 21 21 20.1046 21 19V16M3 16V19C3 20.1046 3.89543 21 5 21H8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
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
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="layout-spinner"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="32"
              strokeDashoffset="32"
            >
              <animate
                attributeName="stroke-dasharray"
                dur="2s"
                values="0 32;16 16;0 32;0 32"
                repeatCount="indefinite"
              />
              <animate
                attributeName="stroke-dashoffset"
                dur="2s"
                values="0;-16;-32;-32"
                repeatCount="indefinite"
              />
            </circle>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M3 3H10V10H3V3Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 3H21V10H14V3Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M14 14H21V21H14V14Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M3 14H10V21H3V14Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {showTooltip === 'layout' && (
          <div className="custom-control-tooltip">Auto Layout</div>
        )}
      </button>
    </div>
  );
};

export default CustomControls;

