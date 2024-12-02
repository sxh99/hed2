import { LoaderCircle, Search, Plus } from 'lucide-react';
import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { Button, Input, ScrollArea, Switch } from '~/components';
import { useGlobalState, useGlobalStateAction } from '~/context/global';
import type { Group } from '~/types';
import { ipc } from '~/utils/ipc';

export function Groups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [search, setSearch] = useState<string>('');
  const deferredSearch = useDeferredValue(search);
  const { selectedGroup } = useGlobalState();
  const { setGlobalState } = useGlobalStateAction();
  const [loading, setLoading] = useState(true);
  const [showNewGroup, setShowNewGroup] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const latestGroups = await ipc.getGroups();
        const mockGroups: Group[] = new Array(20).fill(0).map((_, i) => {
          return {
            name: `group${i + 1}`.repeat(Math.random() > 0.7 ? 5 : 1),
            text: '',
            list: [],
            system: false,
            textDraft: '',
          };
        });
        latestGroups.push(...mockGroups);
        const systemGroup = latestGroups.find((profile) => profile.system);
        if (systemGroup) {
          setGlobalState({ selectedGroup: systemGroup });
        }
        setGroups(latestGroups);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleNewGroup = () => {
    setShowNewGroup(true);
  };

  const handleNewGroupOk = (name: string) => {
    if (name) {
      const newGroup = {
        name,
        text: '',
        list: [],
        system: false,
        textDraft: '',
      };
      setGroups([...groups, newGroup]);
      setGlobalState({ selectedGroup: newGroup });
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
        />
        <Button variant="ghost" size="icon" onClick={handleNewGroup}>
          <Plus />
        </Button>
      </div>
      {loading ? (
        <div className="h-full flex justify-center items-center">
          <LoaderCircle className="animate-spin" />
        </div>
      ) : (
        <ScrollArea className="flex-1 px-3 pb-2">
          {displayGroups.map((group) => {
            return (
              <Button
                className="w-full min-h-12 h-auto justify-between mt-1 cursor-pointer"
                asChild
                variant={
                  selectedGroup?.name === group.name ? 'default' : 'ghost'
                }
                key={group.name}
                onClick={() => setGlobalState({ selectedGroup: group })}
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
                    />
                  )}
                </div>
              </Button>
            );
          })}
          {showNewGroup && <NewGroupInput onOk={handleNewGroupOk} />}
        </ScrollArea>
      )}
    </div>
  );
}

interface NewGroupInputProps {
  onOk: (v: string) => void;
}

function NewGroupInput(props: NewGroupInputProps) {
  const { onOk } = props;
  const [newGroupName, setNewGroupName] = useState('');
  const divRef = useRef<HTMLDivElement>(null);
  const newGroupInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (divRef.current) {
      divRef.current.scrollIntoView({ block: 'nearest' });
    }
    if (newGroupInputRef.current) {
      newGroupInputRef.current.focus();
    }
  }, []);

  const handleOk = () => {
    onOk(newGroupName.trim());
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
        ref={newGroupInputRef}
        value={newGroupName}
        onChange={(e) => setNewGroupName(e.target.value)}
        onBlur={handleOk}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
