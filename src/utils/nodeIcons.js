/**
 * Iconos SVG para tipos de nodos
 */

export function getNodeIcon(iconString, color = '#6366f1') {
  // Si ya es un componente React (SVG), retornarlo
  if (typeof iconString !== 'string') {
    return iconString;
  }

  // Mapeo de emojis/strings a SVG
  const iconMap = {
    '👆': (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2V22M2 12H22" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="12" r="3" fill={color} />
      </svg>
    ),
    '🌐': (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
        <path d="M2 12H22M12 2C15 6 15 18 12 22M12 2C9 6 9 18 12 22" stroke={color} strokeWidth="2" />
      </svg>
    ),
    '🤖': (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="6" y="8" width="12" height="10" rx="2" fill={color} />
        <circle cx="9" cy="12" r="1.5" fill="white" />
        <circle cx="15" cy="12" r="1.5" fill="white" />
        <rect x="9" y="15" width="6" height="2" rx="1" fill="white" />
        <path d="M8 6V8M16 6V8" stroke={color} strokeWidth="2" strokeLinecap="round" />
        <path d="M10 20V22M14 20V22" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    '🔀': (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 3H4C3.45 3 3 3.45 3 4V8C3 8.55 3.45 9 4 9H8C8.55 9 9 8.55 9 8V4C9 3.45 8.55 3 8 3Z" fill={color} />
        <path d="M20 3H16C15.45 3 15 3.45 15 4V8C15 8.55 15.45 9 16 9H20C20.55 9 21 8.55 21 8V4C21 3.45 20.55 3 20 3Z" fill={color} />
        <path d="M8 15H4C3.45 15 3 15.45 3 16V20C3 20.55 3.45 21 4 21H8C8.55 21 9 20.55 9 20V16C9 15.45 8.55 15 8 15Z" fill={color} />
        <path d="M20 15H16C15.45 15 15 15.45 15 16V20C15 20.55 15.45 21 16 21H20C20.55 21 21 20.55 21 20V16C21 15.45 20.55 15 20 15Z" fill={color} />
        <path d="M7 7H17M7 17H17" stroke={color} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    '💾': (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3Z" stroke={color} strokeWidth="2" />
        <path d="M7 7H17V9H7V7ZM7 11H17V13H7V11ZM7 15H13V17H7V15Z" fill={color} />
      </svg>
    ),
    '🧠': (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8 2 5 5 5 9C5 11.5 6.5 13.5 8.5 14.5C8 15.5 7.5 16.5 7 17.5C6.5 18.5 7 20 8 20.5C9 21 10.5 20.5 11.5 19.5C12 19 12.5 18.5 13 18C13.5 18.5 14 19 14.5 19.5C15.5 20.5 17 21 18 20.5C19 20 19.5 18.5 19 17.5C18.5 16.5 18 15.5 17.5 14.5C19.5 13.5 21 11.5 21 9C21 5 18 2 14 2H12Z" fill={color} />
      </svg>
    ),
    '📡': (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" fill={color} />
        <path d="M2 17L12 22L22 17" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 12L12 17L22 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    '🗄️': (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
        <path d="M3 9H21M9 3V21" stroke={color} strokeWidth="2" />
      </svg>
    ),
    '💬': (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  };

  return iconMap[iconString] || (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
    </svg>
  );
}

