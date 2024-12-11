import { useAtom, useAtomValue, useSetAtom, type PrimitiveAtom } from 'jotai';
import { FilePenLine, Plus, Search, Trash2 } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import {
  addGroupAtom,
  currentGroupNameAtom,
  groupsAtom,
  groupAtomsAtom,
  setSystemGroupWhenRenameAtom,
  setSystemGroupWhenToggleEnableAtom,
  setSystemGroupWhenRemoveAtom,
} from '~/atom';
import { Button, Input, ScrollArea, Switch, AdvancedInput } from '~/components';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '~/components/context-menu';
import type { Group } from '~/types';
import { checkGroupExists } from '~/utils/group';
import { useBoolean } from '~/hooks';

export function GroupPanel() {
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const newGroupInputVisible = useBoolean();

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
        <Button variant="outline" size="icon" onClick={newGroupInputVisible.on}>
          <Plus />
        </Button>
      </div>
      <ScrollArea className="flex-1 px-3 pb-2">
        <GroupList search={deferredSearch} />
        <NewGroupInput
          visible={newGroupInputVisible.value}
          onUnmounted={newGroupInputVisible.off}
        />
      </ScrollArea>
    </div>
  );
}

function GroupList(props: { search: string }) {
  const { search } = props;

  const [groupAtoms, setGroupAtoms] = useAtom(groupAtomsAtom);

  const handleGroupRemove = (groupAtom: PrimitiveAtom<Group>) => {
    setGroupAtoms({ type: 'remove', atom: groupAtom });
  };

  return groupAtoms.map((groupAtom) => (
    <GroupButton
      key={`${groupAtom}`}
      groupAtom={groupAtom}
      search={search}
      onGroupRemove={handleGroupRemove}
    />
  ));
}

function GroupButton(props: {
  groupAtom: PrimitiveAtom<Group>;
  search: string;
  onGroupRemove: (groupAtom: PrimitiveAtom<Group>) => void;
}) {
  const { groupAtom, search, onGroupRemove } = props;

  const [group, setGroup] = useAtom(groupAtom);
  const [currentGroupName, setCurrentGroupName] = useAtom(currentGroupNameAtom);
  const groups = useAtomValue(groupsAtom);
  const renameInputVisible = useBoolean();
  const setSystemGroupWhenRename = useSetAtom(setSystemGroupWhenRenameAtom);
  const setSystemGroupWhenToggleEnable = useSetAtom(
    setSystemGroupWhenToggleEnableAtom,
  );
  const setSystemGroupWhenRemove = useSetAtom(setSystemGroupWhenRemoveAtom);

  if (!group.name.includes(search)) {
    return null;
  }

  const handleClick = () => {
    if (group.name === currentGroupName) {
      return;
    }
    setCurrentGroupName(group.name);
  };

  const handleGroupRenameOk = (newName: string) => {
    if (newName !== group.name) {
      setGroup({ ...group, name: newName });
      setSystemGroupWhenRename(group.name, newName, group.enabled);
    }
    renameInputVisible.off();
  };

  const handleGroupRenameValidate = (newName: string) => {
    if (newName === group.name) {
      return;
    }
    return checkGroupExists(groups, newName);
  };

  const handleToggleGroupEnable = () => {
    const newGroup = { ...group, enabled: !group.enabled };
    setGroup(newGroup);
    setSystemGroupWhenToggleEnable(newGroup);
  };

  const handleGroupRemove = () => {
    onGroupRemove(groupAtom);
    setSystemGroupWhenRemove(group.name, group.enabled);
  };

  if (renameInputVisible.value) {
    return (
      <div className="px-0.5 pt-2.5 pb-1">
        <AdvancedInput
          name="newGroupName"
          placeholder={group.name}
          initValue={group.name}
          onOk={handleGroupRenameOk}
          onCancel={renameInputVisible.off}
          onValidate={handleGroupRenameValidate}
          maxLength={50}
          selectAllWhenMounted
        />
      </div>
    );
  }

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
                onCheckedChange={handleToggleGroupEnable}
              />
            )}
          </div>
        </Button>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          disabled={group.system}
          onClick={renameInputVisible.on}
        >
          <FilePenLine />
          Rename
        </ContextMenuItem>
        <ContextMenuItem
          disabled={group.system}
          destructive
          onClick={handleGroupRemove}
        >
          <Trash2 />
          Remove
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

function NewGroupInput(props: {
  visible: boolean;
  onUnmounted: () => void;
}) {
  const { visible, onUnmounted } = props;

  const groups = useAtomValue(groupsAtom);
  const addGroup = useSetAtom(addGroupAtom);

  const handleNewGroupOk = (name: string) => {
    addGroup(name);
    onUnmounted();
  };

  const handleNewGroupValidate = (name: string) => {
    return checkGroupExists(groups, name);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="px-0.5 py-1 mt-1">
      <AdvancedInput
        placeholder="Group name"
        name="groupName"
        onOk={handleNewGroupOk}
        onValidate={handleNewGroupValidate}
        onCancel={onUnmounted}
        maxLength={50}
      />
    </div>
  );
}
