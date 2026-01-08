import { ReactNode } from 'react';

export interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: 'info' | 'success' | 'error' | 'warning';
}

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'default' | 'danger' | 'warning';
}

export interface PromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title?: string;
  message?: string;
  defaultValue?: string;
  placeholder?: string;
}

export interface JsonModalProps {
  mode: 'export' | 'import';
  onClose: () => void;
  onImport: (jsonString: string) => { success: boolean; errors?: string[] };
  initialJson?: string;
}

export interface ExecuteFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (timeoutSeconds: number | null) => void;
  defaultTimeout?: number;
}

export interface PropertiesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string | null;
}

export interface NodePaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNode: (typeId: string) => void;
  connectionFilter?: {
    nodeId: string;
    handleId: string;
    handleType: 'source' | 'target';
  } | null;
}

export interface ContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onAddNote: () => void;
}

export interface EmptyStateProps {
  onAddNode: () => void;
}

export interface NoProjectStateProps {
  // No props needed
}

export interface CustomControlsProps {
  onLayout: () => void;
}

export interface TopRightControlsProps {
  onAddNode: () => void;
  onModalStateChange: (isOpen: boolean) => void;
}

export interface FlowTabsProps {
  // No props needed, uses store
}

export interface ProtectedRouteProps {
  children: ReactNode;
}
