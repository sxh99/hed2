import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeState = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeState>({
  theme: 'system',
  toggleTheme: () => {},
});

const STORAGE_KEY = 'theme';

const isSystemDark = () => {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

export function ThemeProvider({ children }: React.PropsWithChildren) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem(STORAGE_KEY) as Theme) ?? 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = isSystemDark() ? 'dark' : 'light';

      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  const contextValue = useMemo<ThemeState>(() => {
    return {
      theme,
      toggleTheme: () => {
        const themes: Theme[] = ['light', 'dark', 'system'];
        let idx = themes.indexOf(theme);
        if (idx < 0) {
          idx = 0;
        }
        idx += 1;
        if (idx >= themes.length) {
          idx = 0;
        }
        const newTheme = themes[idx];
        setTheme(newTheme);
        localStorage.setItem(STORAGE_KEY, newTheme);
      },
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  return useContext(ThemeContext);
};
