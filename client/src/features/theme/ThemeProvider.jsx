import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('purple'); // purple, blue, green, pink
  const [animations, setAnimations] = useState(true);
  
  const themes = {
    purple: 'from-purple-900 via-blue-900 to-indigo-900',
    blue: 'from-blue-900 via-cyan-900 to-teal-900',
    green: 'from-green-900 via-emerald-900 to-teal-900',
    pink: 'from-pink-900 via-purple-900 to-indigo-900',
  };

  useEffect(() => {
    const saved = localStorage.getItem('app-theme');
    if (saved && themes[saved]) {
      setTheme(saved);
    }
  }, []);

  const changeTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('app-theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      changeTheme, 
      themes,
      animations,
      setAnimations 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
