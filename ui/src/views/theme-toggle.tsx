import { Moon, Sun, TvMinimal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { TooltipButton } from '~/components';
import { Theme } from '~/consts';
import { storage } from '~/utils/storage';

const DARK_MODE_MEDIA = '(prefers-color-scheme: dark)';

function isSystemDark() {
  return window.matchMedia(DARK_MODE_MEDIA).matches;
}

function applyTheme(theme: string) {
  let finalTheme = theme;
  if (theme === Theme.System) {
    finalTheme = isSystemDark() ? Theme.Dark : Theme.Light;
  }
  const root = window.document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(finalTheme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<string>(() => {
    const theme = storage.getTheme();
    applyTheme(theme);
    return theme;
  });

  useEffect(() => {
    const mql = window.matchMedia(DARK_MODE_MEDIA);
    setTheme((prev) => {
      if (prev === Theme.System) {
        applyTheme(mql.matches ? Theme.Dark : Theme.Light);
      }
      return prev;
    });
    const listener = (e: MediaQueryListEvent) => {
      setTheme((prev) => {
        if (prev === Theme.System) {
          applyTheme(e.matches ? Theme.Dark : Theme.Light);
        }
        return prev;
      });
    };
    mql.addEventListener('change', listener);
    return () => mql.removeEventListener('change', listener);
  }, []);

  const toggleTheme = () => {
    const themes: string[] = [Theme.Light, Theme.Dark, Theme.System];
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
    storage.setTheme(newTheme);
    applyTheme(newTheme);
  };

  return (
    <TooltipButton
      tooltip="Toggle theme"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
    >
      {theme === Theme.Light && <Sun />}
      {theme === Theme.Dark && <Moon />}
      {theme === Theme.System && <TvMinimal />}
    </TooltipButton>
  );
}
