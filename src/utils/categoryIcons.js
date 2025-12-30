/**
 * Iconos SVG y descripciones para categorías de nodos
 */

export const categoryMetadata = {
  Trigger: {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 5.14V19.14L19 12.14L8 5.14Z" fill="currentColor" />
      </svg>
    ),
    description: 'Inicia el flujo de trabajo',
    color: '#10b981',
  },
  Agent: {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="8" width="12" height="10" rx="2" fill="currentColor" />
        <circle cx="9" cy="12" r="1.5" fill="white" />
        <circle cx="15" cy="12" r="1.5" fill="white" />
        <rect x="9" y="15" width="6" height="2" rx="1" fill="white" />
        <path d="M8 6V8M16 6V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 20V22M14 20V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    description: 'Agentes de IA y herramientas',
    color: '#a855f7',
  },
  Tool: {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.7 19L13.6 9.9C14.5 7.6 14 4.9 12.1 3C10.1 1 7.1 0.6 4.7 1.7L9 6L6 9L1.6 4.7C0.4 7.1 0.9 10.1 2.9 12.1C4.8 14 7.5 14.5 9.8 13.6L18.9 22.7C19.3 23.1 19.9 23.1 20.3 22.7L22.6 20.4C23.1 20 23.1 19.3 22.7 19Z" fill="currentColor" />
      </svg>
    ),
    description: 'Herramientas y utilidades',
    color: '#3b82f6',
  },
  Memory: {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19Z" fill="currentColor" />
        <path d="M7 7H17V9H7V7ZM7 11H17V13H7V11ZM7 15H13V17H7V15Z" fill="currentColor" />
      </svg>
    ),
    description: 'Almacenamiento y memoria',
    color: '#8b5cf6',
  },
  Router: {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    description: 'Ruteo y condiciones',
    color: '#f59e0b',
  },
  Action: {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.7 19L13.6 9.9C14.5 7.6 14 4.9 12.1 3C10.1 1 7.1 0.6 4.7 1.7L9 6L6 9L1.6 4.7C0.4 7.1 0.9 10.1 2.9 12.1C4.8 14 7.5 14.5 9.8 13.6L18.9 22.7C19.3 23.1 19.9 23.1 20.3 22.7L22.6 20.4C23.1 20 23.1 19.3 22.7 19Z" fill="currentColor" />
      </svg>
    ),
    description: 'Acciones y operaciones',
    color: '#3b82f6',
  },
  Transform: {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" />
        <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    description: 'Transformación de datos',
    color: '#6366f1',
  },
  Output: {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    description: 'Salidas y respuestas',
    color: '#06b6d4',
  },
};

export function getCategoryMetadata(category) {
  return categoryMetadata[category] || {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    description: 'Categoría de nodos',
    color: '#6366f1',
  };
}

