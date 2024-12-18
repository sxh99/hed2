import { useSetAtom } from 'jotai';
import { RefreshCcw } from 'lucide-react';
import { useEffect } from 'react';
import { initGroupsAtom } from '~/atom';
import { Button, CommonHeader } from '~/components';
import { GitHub } from '~/components/icons';
import {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipTrigger,
} from '~/components/shadcn/tooltip';
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
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={initGroups}>
          <RefreshCcw />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <TooltipArrow />
        Refresh groups
      </TooltipContent>
    </Tooltip>
  );
}

function ViewGitHubButton() {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon">
          <GitHub />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <TooltipArrow />
        View GitHub
      </TooltipContent>
    </Tooltip>
  );
}
