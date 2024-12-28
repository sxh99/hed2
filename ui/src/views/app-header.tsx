import { useAtomValue, useSetAtom } from 'jotai';
import { History, RefreshCcw, Save } from 'lucide-react';
import { useEffect } from 'react';
import {
  groupsAtom,
  initGroupsAtom,
  saveSystemHostsAtom,
  systemHostsAtom,
} from '~/atom';
import { CommonHeader, Kbd, TooltipButton } from '~/components';
import { GitHub } from '~/components/icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/shadcn/dialog';
import { IS_MAC } from '~/consts';
import { ipc } from '~/ipc';
import { HostsHistory } from './hosts-history';
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
        <HistoryButton />
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
  const saveSystemHosts = useSetAtom(saveSystemHostsAtom);

  const systemGroup = groups.find((group) => group.system);
  const changed = !!systemGroup && systemGroup.text !== systemHosts;

  const handleSave = () => {
    saveSystemHosts();
  };

  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === 's' && IS_MAC ? e.metaKey : e.ctrlKey) {
        e.preventDefault();
        saveSystemHosts();
      }
    };
    window.addEventListener('keydown', listener);

    return () => window.removeEventListener('keydown', listener);
  }, []);

  return (
    <TooltipButton
      tooltip={
        <div className="flex gap-1 items-center">
          <span>Save</span>
          <Kbd keybind={IS_MAC ? 'cmd + s' : 'ctrl + s'} />
        </div>
      }
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

export function HistoryButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <TooltipButton tooltip="history" variant="ghost" size="icon">
          <History />
        </TooltipButton>
      </DialogTrigger>
      <DialogContent className="w-auto max-w-none">
        <DialogHeader>
          <DialogTitle>History</DialogTitle>
          <DialogDescription>System hosts history</DialogDescription>
        </DialogHeader>
        <HostsHistory />
      </DialogContent>
    </Dialog>
  );
}
