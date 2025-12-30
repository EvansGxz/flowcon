import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser usado dentro de ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Intentar obtener el tema guardado en localStorage
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  // Inicializar el tema inmediatamente al montar el componente
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  useEffect(() => {
    // Guardar el tema en localStorage cuando cambie
    localStorage.setItem('theme', theme);
    // Aplicar el tema al documento
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    // Ciclar entre: light -> abyss -> dark -> light
    setTheme((prevTheme) => {
      if (prevTheme === 'light') return 'abyss';
      if (prevTheme === 'abyss') return 'dark';
      return 'light';
    });
  };

  const setThemeDirect = (newTheme) => {
    if (['light', 'abyss', 'dark'].includes(newTheme)) {
      setTheme(newTheme);
    }
  };

  const value = {
    theme,
    setTheme: setThemeDirect,
    toggleTheme,
    isDark: theme === 'abyss' || theme === 'dark', // Para compatibilidad
    isLight: theme === 'light',
    isAbyss: theme === 'abyss',
    isDarkTheme: theme === 'dark',
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
