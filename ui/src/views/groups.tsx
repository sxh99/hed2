import { Slot } from '@radix-ui/react-slot';
import { type PrimitiveAtom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  FilePenLine,
  FileSliders,
  MonitorCog,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  addGroupAtom,
  currentGroupNameAtom,
  editorCfgAtom,
  groupAtomsAtom,
  groupsAtom,
} from '~/atom';
import {
  Button,
  EditInput,
  ScrollArea,
  SearchInput,
  Switch,
  TooltipButton,
} from '~/components';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '~/components/shadcn/context-menu';
import { EditorKind } from '~/consts';
import { useBoolean, useSearch } from '~/hooks';
import type { Group } from '~/types';
import { cn } from '~/utils/cn';
import { checkGroupExists } from '~/utils/group';

export function GroupPanel() {
  const search = useSearch();
  const newGroupInputVisible = useBoolean();

  return (
    <div className="h-full flex flex-col">
      <div className="h-14 px-3 flex items-center gap-1">
        <SearchInput
          className="flex-1"
          name="searchGroup"
          placeholder="Search group..."
          value={search.value}
          onValueChange={search.setValue}
        />
        <TooltipButton
          tooltip="New group"
          variant="outline"
          size="icon"
          onClick={newGroupInputVisible.on}
        >
          <Plus />
        </TooltipButton>
      </div>
      <ScrollArea className="flex-1 px-3 pb-2">
        <GroupList search={search.deferredValue} />
        <NewGroupInput
          visible={newGroupInputVisible.value}
          onCancel={newGroupInputVisible.off}
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
  const [editorCfg, setEditorCfg] = useAtom(editorCfgAtom);

  if (!group.name.includes(search)) {
    return null;
  }

  const handleClick = () => {
    if (group.name === currentGroupName) {
      return;
    }
    setCurrentGroupName(group.name);
    if (editorCfg.kind !== EditorKind.List) {
      setEditorCfg({ ...editorCfg, kind: EditorKind.List });
    }
  };

  const handleGroupRenameOk = (newName: string) => {
    setGroup({ ...group, name: newName });
    renameInputVisible.off();
  };

  const handleGroupRenameValidate = (newName: string) => {
    return checkGroupExists(groups, newName);
  };

  const handleToggleGroupEnable = (checked: boolean) => {
    const newGroup = { ...group, enabled: checked };
    setGroup(newGroup);
  };

  const handleGroupRemove = () => {
    onGroupRemove(groupAtom);
  };

  if (renameInputVisible.value) {
    return (
      <div className="px-0.5 pt-2.5 pb-1">
        <EditInput
          name="newGroupName"
          placeholder={group.name}
          initValue={group.name}
          onOk={handleGroupRenameOk}
          onCancel={renameInputVisible.off}
          onValidate={handleGroupRenameValidate}
          selectAllWhenMounted
        />
      </div>
    );
  }

  const active = currentGroupName === group.name;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Button
          className="w-full min-h-12 h-auto justify-between mt-1 cursor-pointer"
          asChild
          variant={active ? 'default' : 'ghost'}
          onClick={handleClick}
          ignoreSvg
        >
          <div>
            <div className="flex items-center gap-2">
              <Slot
                className={cn(
                  'size-5 flex-shrink-0',
                  active ? 'text-slate-300' : 'text-slate-400',
                )}
              >
                {group.system ? <MonitorCog /> : <FileSliders />}
              </Slot>
              <div className="whitespace-normal break-all text-left truncate z-10">
                {group.name}
              </div>
            </div>
            <GroupSwitch group={group} onToggle={handleToggleGroupEnable} />
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
  onCancel: () => void;
}) {
  const { visible, onCancel } = props;

  const groups = useAtomValue(groupsAtom);
  const addGroup = useSetAtom(addGroupAtom);

  const handleNewGroupOk = (name: string) => {
    addGroup(name);
    onCancel();
  };

  const handleNewGroupValidate = (name: string) => {
    return checkGroupExists(groups, name);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="px-0.5 py-1 mt-1">
      <EditInput
        placeholder="Group name"
        name="groupName"
        onOk={handleNewGroupOk}
        onValidate={handleNewGroupValidate}
        onCancel={onCancel}
      />
    </div>
  );
}

function GroupSwitch(props: {
  group: Group;
  onToggle: (v: boolean) => void;
}) {
  const { group, onToggle } = props;

  if (group.system) {
    return null;
  }

  return (
    <Switch
      className="ml-4"
      onClick={(e) => {
        e.stopPropagation();
      }}
      checked={group.enabled}
      onCheckedChange={onToggle}
    />
  );
}
