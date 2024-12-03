import { Plus, Search } from 'lucide-react';
import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { Button, Input, ScrollArea, Switch } from '~/components';
import { useGlobalState, useGlobalAction } from '~/context/global';

export function Groups() {
  const { selectedGroup, groups } = useGlobalState();
  const { initGroups, setSelectedGroup, addGroup } = useGlobalAction();
  const [search, setSearch] = useState<string>('');
  const deferredSearch = useDeferredValue(search);
  const [showNewGroup, setShowNewGroup] = useState(false);

  useEffect(() => {
    initGroups();
  }, []);

  const handleNewGroup = () => {
    setShowNewGroup(true);
  };

  const handleNewGroupOk = (name: string) => {
    if (name) {
      addGroup(name);
    }
    setShowNewGroup(false);
  };

  const displayGroups = groups.filter((group) =>
    group.name.includes(deferredSearch),
  );

  return (
    <div className="h-full flex flex-col bg-neutral-50 dark:bg-background">
      <div className="h-14 px-3 flex items-center relative gap-1">
        <Search className="pointer-events-none absolute left-5 size-4 top-1/2 -translate-y-1/2 select-none opacity-50" />
        <Input
          className="bg-white dark:bg-black pl-8"
          placeholder="Search group"
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
            <Button
              className="w-full min-h-12 h-auto justify-between mt-1 cursor-pointer"
              asChild
              variant={selectedGroup?.name === group.name ? 'default' : 'ghost'}
              key={group.name}
              onClick={() => setSelectedGroup(group)}
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
          );
        })}
        {showNewGroup && <NewGroupInput onOk={handleNewGroupOk} />}
      </ScrollArea>
    </div>
  );
}

function NewGroupInput(props: { onOk: (v: string) => void }) {
  const { onOk } = props;
  const [name, setName] = useState('');
  const divRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (divRef.current) {
      divRef.current.scrollIntoView({ block: 'nearest' });
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleOk = () => {
    onOk(name.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleOk();
    }
  };

  return (
    <div className="p-1 mt-1" ref={divRef}>
      <Input
        className="bg-white dark:bg-black"
        placeholder="Group name"
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={handleOk}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
