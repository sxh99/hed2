import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Plus, Search } from 'lucide-react';
import { useDeferredValue, useEffect, useState } from 'react';
import {
  addGroupAtom,
  currentGroupNameAtom,
  groupsAtom,
  initGroupsAtom,
} from '~/atom';
import { Button, Input, ScrollArea, Switch } from '~/components';
import { AdvancedInput } from '~/components/advanced-input';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '~/components/context-menu';
import type { Group } from '~/types';

export function GroupPanel() {
  const [search, setSearch] = useState<string>('');
  const deferredSearch = useDeferredValue(search);
  const [showNewGroupInput, setShowNewGroupInput] = useState(false);
  const initGroups = useSetAtom(initGroupsAtom);

  useEffect(() => {
    initGroups();
  }, []);

  const handleAddGroupClick = () => {
    setShowNewGroupInput(true);
  };

  return (
    <div className="h-full flex flex-col bg-neutral-50 dark:bg-background">
      <div className="h-14 px-3 flex items-center relative gap-1">
        <Search className="pointer-events-auto absolute left-5 size-4 top-1/2 -translate-y-1/2 select-none opacity-50" />
        <Input
          className="bg-white dark:bg-black pl-8 placeholder:italic"
          placeholder="Search group..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          name="searchGroup"
        />
        <Button variant="ghost" size="icon" onClick={handleAddGroupClick}>
          <Plus />
        </Button>
      </div>
      <ScrollArea className="flex-1 px-3 pb-2">
        <GroupList search={deferredSearch} />
        <NewGroupInput
          show={showNewGroupInput}
          onShowChange={setShowNewGroupInput}
        />
      </ScrollArea>
    </div>
  );
}

function GroupList(props: { search: string }) {
  const { search } = props;

  const groups = useAtomValue(groupsAtom);

  return groups
    .filter((group) => group.name.includes(search))
    .map((group) => <GroupButton key={group.name} group={group} />);
}

function GroupButton(props: { group: Group }) {
  const { group } = props;

  const [currentGroupName, setCurrentGroupName] = useAtom(currentGroupNameAtom);

  const handleClick = () => {
    if (group.name === currentGroupName) {
      return;
    }
    setCurrentGroupName(group.name);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Button
          className="w-full min-h-12 h-auto justify-between mt-1 cursor-pointer"
          asChild
          variant={currentGroupName === group.name ? 'default' : 'ghost'}
          onClick={handleClick}
        >
          <div>
            <div className="whitespace-normal break-all text-left truncate">
              {group.name}
            </div>
            {!group.system && (
              <Switch
                className="ml-4"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                checked={group.enabled}
              />
            )}
          </div>
        </Button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem disabled={group.system}>Foo</ContextMenuItem>
        <ContextMenuItem disabled={group.system}>Bar</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function NewGroupInput(props: {
  show: boolean;
  onShowChange: (v: boolean) => void;
}) {
  const { show, onShowChange } = props;

  const groups = useAtomValue(groupsAtom);
  const addGroup = useSetAtom(addGroupAtom);

  const handleNewGroupCancel = () => {
    onShowChange(false);
  };

  const handleNewGroupOk = (name: string) => {
    if (name) {
      addGroup(name);
    }
    onShowChange(false);
  };

  const handleNewGroupValidate = (name: string) => {
    if (groups.some((group) => group.name === name)) {
      return `\`${name}\` already exists`;
    }
  };

  if (!show) {
    return null;
  }

  return (
    <div className="p-1 mt-1">
      <AdvancedInput
        placeholder="Group name"
        name="groupName"
        onOk={handleNewGroupOk}
        onValidate={handleNewGroupValidate}
        onCancel={handleNewGroupCancel}
        maxLength={50}
      />
    </div>
  );
}
