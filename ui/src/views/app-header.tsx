import { useSetAtom } from 'jotai';
import { RefreshCcw } from 'lucide-react';
import { useEffect } from 'react';
import { initGroupsAtom } from '~/atom';
import { CommonHeader, TooltipButton } from '~/components';
import { GitHub } from '~/components/icons';
import { ThemeToggle } from './theme-toggle';

export function AppHeader() {
  return (
    <CommonHeader>
      <div>
        <span className="font-bold text-lg">Hed2</span>
        <span className="font-light text-xs ml-2">0.1.0</span>
      </div>
      <div className="flex items-center gap-1.5">
        <RefreshButton />
        <ViewGitHubButton />
        <ThemeToggle />
      </div>
    </CommonHeader>
  );
}

function RefreshButton() {
  const initGroups = useSetAtom(initGroupsAtom);

  useEffect(() => {
    initGroups();
  }, []);

  return (
    <TooltipButton
      tooltip="Refresh"
      variant="ghost"
      size="icon"
      onClick={initGroups}
    >
      <RefreshCcw />
    </TooltipButton>
  );
}

function ViewGitHubButton() {
  return (
    <TooltipButton tooltip="View GitHub" variant="ghost" size="icon">
      <GitHub />
    </TooltipButton>
  );
}
