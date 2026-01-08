import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'light' | 'blossom' | 'abyss' | 'dark' | 'midnight-sakura';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  isDark: boolean;
  isLight: boolean;
  isAbyss: boolean;
  isDarkTheme: boolean;
  isBlossom: boolean;
  isMidnightSakura: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Intentar obtener el tema guardado en localStorage
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme as Theme) || 'light';
  });

  // Inicializar el tema inmediatamente al montar el componente
  useEffect(() => {
    const savedTheme = (localStorage.getItem('theme') || 'light') as Theme;
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  useEffect(() => {
    // Guardar el tema en localStorage cuando cambie
    localStorage.setItem('theme', theme);
    // Aplicar el tema al documento
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    // Ciclar entre: light -> blossom -> abyss -> dark -> midnight-sakura -> light
    setTheme((prevTheme) => {
      if (prevTheme === 'light') return 'blossom';
      if (prevTheme === 'blossom') return 'abyss';
      if (prevTheme === 'abyss') return 'dark';
      if (prevTheme === 'dark') return 'midnight-sakura';
      return 'light';
    });
  };

  const setThemeDirect = (newTheme: string) => {
    if (['light', 'blossom', 'abyss', 'dark', 'midnight-sakura'].includes(newTheme)) {
      setTheme(newTheme as Theme);
    }
  };

  const value: ThemeContextType = {
    theme,
    setTheme: setThemeDirect,
    toggleTheme,
    isDark: theme === 'abyss' || theme === 'dark' || theme === 'midnight-sakura', // Para compatibilidad
    isLight: theme === 'light' || theme === 'blossom',
    isAbyss: theme === 'abyss',
    isDarkTheme: theme === 'dark' || theme === 'midnight-sakura',
    isBlossom: theme === 'blossom',
    isMidnightSakura: theme === 'midnight-sakura',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
