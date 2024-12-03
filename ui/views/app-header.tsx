import { Button } from '~/components';
import { Icons } from '~/components/icons';
import { ThemeToggle } from './theme-toggle';

export function AppHeader() {
  return (
    <header className="w-full h-14 flex justify-between items-center px-4 py-1 border-b border-border/50 dark:border-border">
      <div>
        <span className="font-bold text-lg">Hed2</span>
        <span className="font-light text-xs ml-2">0.1.0</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="icon">
          <Icons.GitHub />
          <span className="sr-only">GitHub button</span>
        </Button>
        <ThemeToggle />
      </div>
    </header>
  );
}
