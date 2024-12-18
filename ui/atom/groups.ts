import { atom } from 'jotai';
import { splitAtom } from 'jotai/utils';
import { SYSTEM_GROUP_NAME } from '~/consts';
import type { Group, Item } from '~/types';
import { ipc } from '~/utils/ipc';
import { storage } from '~/utils/storage';
import { currentGroupNameAtom } from './current-group-name';

export const groupsAtom = atom<Group[]>([]);

export const groupAtomsAtom = splitAtom(groupsAtom, (group) => group.name);

export const systemHostsTextDraftAtom = atom('');

export const updateTextByListAtom = atom(
  null,
  async (get, set, list: Item[]) => {
    const newText = await ipc.updateTextByList(
      list,
      get(systemHostsTextDraftAtom),
    );
    set(systemHostsTextDraftAtom, newText);
  },
);

export const initGroupsAtom = atom(null, async (_, set) => {
  const groups = await ipc.getGroups();
  const systemGroup = groups.find((profile) => profile.system);
  if (systemGroup) {
    set(currentGroupNameAtom, systemGroup.name);
    set(systemHostsTextDraftAtom, systemGroup.text);
  }
  set(groupsAtom, groups);
});

export const addGroupAtom = atom(null, (_, set, groupName: string) => {
  const newGroup: Group = {
    name: groupName,
    text: '',
    list: [],
    system: false,
    enabled: false,
  };
  set(groupsAtom, (groups) => [...groups, newGroup]);
  set(currentGroupNameAtom, groupName);
  storage.addDisabledGroup(newGroup);
});

export const setSystemGroupWhenRenameAtom = atom(
  null,
  (get, set, oldName: string, newName: string, enabled: boolean) => {
    const groups = get(groupsAtom);
    const systemGroup = groups.find((g) => g.system);
    if (!systemGroup) {
      return;
    }
    if (enabled) {
      systemGroup.list = systemGroup.list.map((item) => {
        if (item.group === oldName) {
          return {
            ...item,
            group: newName,
          };
        }
        return item;
      });
      set(
        groupsAtom,
        groups.map((group) => {
          return group.system ? { ...systemGroup } : group;
        }),
      );
      set(updateTextByListAtom, systemGroup.list);
    } else {
      storage.renameDisabledGroup(oldName, newName);
    }
  },
);

export const setSystemGroupWhenToggleEnableAtom = atom(
  null,
  (get, set, changedGroup: Group) => {
    const groups = get(groupsAtom);
    const systemGroup = groups.find((g) => g.system);
    if (!systemGroup) {
      return;
    }

    if (changedGroup.enabled) {
      systemGroup.list = [...systemGroup.list, ...changedGroup.list];
      storage.deleteDisabledGroup(changedGroup.name);
      set(updateTextByListAtom, systemGroup.list);
    } else {
      systemGroup.list = systemGroup.list.filter(
        (item) => item.group !== changedGroup.name,
      );
      storage.addDisabledGroup(changedGroup);
    }

    set(
      groupsAtom,
      groups.map((group) => {
        return group.system ? { ...systemGroup } : group;
      }),
    );
  },
);

export const setSystemGroupWhenRemoveAtom = atom(
  null,
  (get, set, groupName: string, enabled: boolean) => {
    const groups = get(groupsAtom);
    const systemGroup = groups.find((g) => g.system);
    if (!systemGroup) {
      return;
    }

    if (enabled) {
      systemGroup.list = systemGroup.list.filter(
        (item) => item.group !== groupName,
      );
      set(updateTextByListAtom, systemGroup.list);
    } else {
      storage.deleteDisabledGroup(groupName);
    }

    set(
      groupsAtom,
      groups.map((group) => {
        return group.system ? { ...systemGroup } : group;
      }),
    );

    if (get(currentGroupNameAtom) === groupName) {
      set(currentGroupNameAtom, SYSTEM_GROUP_NAME);
    }
  },
);
