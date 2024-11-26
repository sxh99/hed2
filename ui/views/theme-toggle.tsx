import { Moon, Sun, TvMinimal } from 'lucide-react';
import { Button } from '~/components/button';
import { useTheme } from '~/context/theme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={`theme: ${theme}`}
    >
      {theme === 'light' && <Sun />}
      {theme === 'dark' && <Moon />}
      {theme === 'system' && <TvMinimal />}
      <span className="sr-only">Toggle theme button</span>
    </Button>
  );
}
