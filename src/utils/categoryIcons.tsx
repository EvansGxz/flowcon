/**
 * Iconos y descripciones para categorías de nodos usando lucide-react
 */

import React from 'react';
import { Play, Bot, Zap, Database, GitBranch, Wrench, Shuffle, CheckCircle2, Circle } from 'lucide-react';

interface CategoryMetadata {
  icon: React.ReactElement;
  description: string;
  color: string;
}

export const categoryMetadata: Record<string, CategoryMetadata> = {
  Trigger: {
    icon: <Play size={20} />,
    description: 'Inicia el flujo de trabajo',
    color: '#10b981',
  },
  Agent: {
    icon: <Bot size={20} />,
    description: 'Agentes de IA y herramientas',
    color: '#a855f7',
  },
  Tool: {
    icon: <Wrench size={20} />,
    description: 'Herramientas y utilidades',
    color: '#3b82f6',
  },
  Memory: {
    icon: <Database size={20} />,
    description: 'Almacenamiento y memoria',
    color: '#8b5cf6',
  },
  Router: {
    icon: <GitBranch size={20} />,
    description: 'Ruteo y condiciones',
    color: '#f59e0b',
  },
  Action: {
    icon: <Zap size={20} />,
    description: 'Acciones y operaciones',
    color: '#3b82f6',
  },
  Transform: {
    icon: <Shuffle size={20} />,
    description: 'Transformación de datos',
    color: '#6366f1',
  },
  Output: {
    icon: <CheckCircle2 size={20} />,
    description: 'Salidas y respuestas',
    color: '#06b6d4',
  },
};

export function getCategoryMetadata(category: string): CategoryMetadata {
  return categoryMetadata[category] || {
    icon: <Circle size={20} />,
    description: 'Categoría de nodos',
    color: '#6366f1',
  };
}
