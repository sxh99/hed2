import { Plus, Search } from 'lucide-react';
import { useDeferredValue, useEffect, useState } from 'react';
import { Button, Input, ScrollArea, Switch } from '~/components';
import { useGlobalState, useGlobalAction } from '~/context/global';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from '~/components/context-menu';
import { AdvancedInput } from '~/components/advanced-input';

export function Groups() {
  const { selectedGroupName, groups } = useGlobalState();
  const { initGroups, setSelectedGroupName, addGroup } = useGlobalAction();
  const [search, setSearch] = useState<string>('');
  const deferredSearch = useDeferredValue(search);
  const [showNewGroup, setShowNewGroup] = useState(false);

  useEffect(() => {
    initGroups();
  }, []);

  const handleNewGroup = () => {
    setShowNewGroup(true);
  };

  const handleNewGroupCancel = () => {
    setShowNewGroup(false);
  };

  const handleNewGroupOk = (name: string) => {
    if (name) {
      addGroup(name);
    }
    setShowNewGroup(false);
  };

  const handleNewGroupValidate = (name: string) => {
    if (groups.some((group) => group.name === name)) {
      return `\`${name}\` already exists`;
    }
  };

  const displayGroups = groups.filter((group) =>
    group.name.includes(deferredSearch),
  );

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
        <Button variant="ghost" size="icon" onClick={handleNewGroup}>
          <Plus />
        </Button>
      </div>
      <ScrollArea className="flex-1 px-3 pb-2">
        {displayGroups.map((group) => {
          return (
            <ContextMenu key={group.name}>
              <ContextMenuTrigger asChild>
                <Button
                  className="w-full min-h-12 h-auto justify-between mt-1 cursor-pointer"
                  asChild
                  variant={
                    selectedGroupName === group.name ? 'default' : 'ghost'
                  }
                  onClick={() => setSelectedGroupName(group.name)}
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
        })}
        {showNewGroup && (
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
        )}
      </ScrollArea>
    </div>
  );
}
