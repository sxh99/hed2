import { useAtomValue, useSetAtom } from 'jotai';
import { RefreshCcw, Save } from 'lucide-react';
import { useEffect } from 'react';
import { groupsAtom, initGroupsAtom, systemHostsAtom } from '~/atom';
import { CommonHeader, TooltipButton } from '~/components';
import { GitHub } from '~/components/icons';
import { ipc } from '~/utils/ipc';
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
        <SaveButton />
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
    <TooltipButton
      tooltip="View GitHub"
      variant="ghost"
      size="icon"
      onClick={() => ipc.viewGitHub()}
    >
      <GitHub />
    </TooltipButton>
  );
}

export function SaveButton() {
  const systemHosts = useAtomValue(systemHostsAtom);
  const groups = useAtomValue(groupsAtom);
  const initGroups = useSetAtom(initGroupsAtom);

  const systemGroup = groups.find((group) => group.system);
  const changed = !!systemGroup && systemGroup.text !== systemHosts;

  const handleSave = async () => {
    if (!systemGroup) {
      return;
    }
    await ipc.writeSystemHosts(systemGroup.text);
    initGroups();
  };

  return (
    <TooltipButton
      tooltip="Save"
      variant="ghost"
      size="icon"
      className="relative"
      onClick={handleSave}
    >
      <Save />
      {changed && (
        <div className="absolute top-2 right-2 size-2 rounded-full bg-primary" />
      )}
    </TooltipButton>
  );
}
