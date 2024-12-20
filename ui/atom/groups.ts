import { atom } from 'jotai';
import { splitAtom } from 'jotai/utils';
import { SYSTEM_GROUP_NAME } from '~/consts';
import type { Group } from '~/types';
import { ipc } from '~/utils/ipc';
import { storage } from '~/utils/storage';
import { currentGroupNameAtom } from './current-group-name';
import {
  systemHostsDraftAtom,
  updateSystemHostsDraftAtom,
} from './system-hosts-draft';

export const groupsAtom = atom<Group[]>([]);

const groupsWithWriterAtom = atom(
  (get) => {
    return get(groupsAtom);
  },
  (_, set, newGroups: Group[]) => {
    console.log(newGroups);
    set(groupsAtom, newGroups);
  },
);

export const groupAtomsAtom = splitAtom(
  groupsWithWriterAtom,
  (group) => group.name,
);

export const initGroupsAtom = atom(null, async (_, set) => {
  const groups = await ipc.getGroups();
  const systemGroup = groups.find((profile) => profile.system);
  if (systemGroup) {
    set(currentGroupNameAtom, systemGroup.name);
    set(systemHostsDraftAtom, systemGroup.text);
  }
  const enabledGroupNames = new Set(groups.map((group) => group.name));
  const disabledGroups = storage.getDisabledGroups();
  let hasRepeatName = false;
  for (const group of disabledGroups) {
    if (enabledGroupNames.has(group.name)) {
      group.name = `${group.name}-disabled`;
      hasRepeatName = true;
    }
  }
  set(groupsAtom, [...groups, ...disabledGroups]);
  if (hasRepeatName) {
    storage.setDisabledGroups(disabledGroups);
  }
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
      set(updateSystemHostsDraftAtom, systemGroup.list);
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
      set(updateSystemHostsDraftAtom, systemGroup.list);
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
      set(updateSystemHostsDraftAtom, systemGroup.list);
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

export const updateGroupTextAtom = atom(
  null,
  async (get, set, name: string) => {
    const groups = get(groupsAtom);
    const targetGroup = groups.find((group) => group.name === name);
    if (!targetGroup) {
      return;
    }
    targetGroup.text = await ipc.updateTextByList(
      targetGroup.list,
      targetGroup.text,
      targetGroup.name,
    );
    const newGroups = groups.map((group) => {
      if (group.name === targetGroup.name) {
        return { ...targetGroup };
      }
      return group;
    });
    set(groupsAtom, newGroups);
    if (!targetGroup.enabled) {
      storage.modifyDisabledGroup(targetGroup);
    }
  },
);
