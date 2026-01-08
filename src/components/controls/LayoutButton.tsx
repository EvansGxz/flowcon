import { useState } from 'react';
import { LayoutGrid, Loader2 } from 'lucide-react';
import { Panel } from '@xyflow/react';
import './LayoutButton.css';

interface LayoutButtonProps {
  onLayout: () => Promise<void>;
}

const LayoutButton = ({ onLayout }: LayoutButtonProps) => {
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
            <Loader2 size={18} className="layout-icon-spinner animate-spin" />
          ) : (
            <LayoutGrid size={18} className="layout-icon" />
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
