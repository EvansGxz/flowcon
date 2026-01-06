/**
 * Iconos para tipos de nodos usando lucide-react
 */

import { Hand, Globe, Bot, Shuffle, Save, Brain, Radio, Database, MessageSquare, Settings, Circle, GitBranch, Download, CheckCircle2 } from 'lucide-react';

export function getNodeIcon(iconString, color = '#6366f1') {
  // Si ya es un componente React, retornarlo
  if (typeof iconString !== 'string') {
    return iconString;
  }

  // Mapeo de strings a iconos de lucide-react
  const iconMap = {
    'hand': <Hand size={20} color={color} />,
    'globe': <Globe size={20} color={color} />,
    'bot': <Bot size={20} color={color} />,
    'shuffle': <Shuffle size={20} color={color} />,
    'save': <Save size={20} color={color} />,
    'brain': <Brain size={20} color={color} />,
    'radio': <Radio size={20} color={color} />,
    'database': <Database size={20} color={color} />,
    'messageSquare': <MessageSquare size={20} color={color} />,
    'settings': <Settings size={20} color={color} />,
    'download': <Download size={20} color={color} />,
    'checkCircle2': <CheckCircle2 size={20} color={color} />,
    // Compatibilidad con emojis antiguos (deprecated)
    '👆': <Hand size={20} color={color} />,
    '🌐': <Globe size={20} color={color} />,
    '🤖': <Bot size={20} color={color} />,
    '🔀': <GitBranch size={20} color={color} />,
    '💾': <Save size={20} color={color} />,
    '🧠': <Brain size={20} color={color} />,
    '📡': <Radio size={20} color={color} />,
    '🗄️': <Database size={20} color={color} />,
    '💬': <MessageSquare size={20} color={color} />,
    '📥': <Download size={20} color={color} />,
    '🏁': <CheckCircle2 size={20} color={color} />,
  };

  return iconMap[iconString] || <Circle size={20} color={color} />;
}

