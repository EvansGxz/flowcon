import { useState } from 'react';
import { Panel } from '@xyflow/react';
import './LayoutButton.css';

const LayoutButton = ({ onLayout }) => {
  const [isLayouting, setIsLayouting] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleLayout = async () => {
    setIsLayouting(true);
    try {
      await onLayout();
    } finally {
      setIsLayouting(false);
    }
  };

  return (
    <Panel position="bottom-left">
      <div className="layout-button-wrapper">
        <button
          className="layout-button-icon-only"
          onClick={handleLayout}
          disabled={isLayouting}
          aria-label="Aplicar layout automático"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {isLayouting ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="layout-icon-spinner"
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
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="layout-icon"
            >
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
        </button>
        {showTooltip && (
          <div className="layout-tooltip">
            {isLayouting ? 'Aplicando layout...' : 'Auto Layout'}
          </div>
        )}
      </div>
    </Panel>
  );
};

export default LayoutButton;
