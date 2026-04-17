import { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext(null);

export function ThemeProvider({ userId, children }) {
  const key = `theme_${userId}`;

  const [theme, setThemeState] = useState(
    () => localStorage.getItem(key) || "light"
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(key, theme);
  }, [theme, key]);

  useEffect(() => {
    return () => document.documentElement.classList.remove("dark");
  }, []);

  const setTheme = (t) => setThemeState(t);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
