import { atom } from 'jotai';
import { focusAtom } from 'jotai-optics';
import { splitAtom } from 'jotai/utils';
import { NOT_EXISTS_GROUP, SYSTEM_GROUP_NAME } from '~/consts';
import type { Group, Item } from '~/types';
import { ipc } from '~/utils/ipc';
import { storage } from '~/utils/storage';

export const groupsAtom = atom<Group[]>([]);

export const groupAtomsAtom = splitAtom(groupsAtom, (group) => group.name);

export const currentGroupNameAtom = atom('');

export const systemHostsTextDraftAtom = atom('');

const updateTextByListAtom = atom(null, async (get, set, list: Item[]) => {
  const newText = await ipc.updateTextByList(
    list,
    get(systemHostsTextDraftAtom),
  );
  set(systemHostsTextDraftAtom, newText);
});

export const currentGroupAtom = atom(
  (get) => {
    const currentGroupName = get(currentGroupNameAtom);
    const groups = get(groupsAtom);
    return (
      groups.find((group) => group.name === currentGroupName) ||
      NOT_EXISTS_GROUP
    );
  },
  (get, set, newGroup: Group) => {
    const groups = get(groupsAtom);
    const newGroups = groups.map((group) => {
      if (group.name === newGroup.name) {
        return { ...newGroup };
      }
      return group;
    });
    set(groupsAtom, newGroups);
    if (newGroup.enabled) {
      const systemGroup = newGroups.find((group) => group.system);
      if (!systemGroup) {
        return;
      }
      set(updateTextByListAtom, systemGroup.list);
    } else {
      storage.modifyDisabledGroup(newGroup);
    }
  },
);

const currentGroupListAtom = focusAtom(currentGroupAtom, (optic) => {
  return optic.prop('list');
});

export const itemAtomsAtom = splitAtom(
  currentGroupListAtom,
  (item) => `${item.group}-${item.ip}`,
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

export const setSameGroupItemAtom = atom(
  null,
  (get, set, oldItemIp: string, newItem: Item) => {
    const currentGroup = get(currentGroupAtom);
    const groups = get(groupsAtom);

    if (currentGroup.system && newItem.group !== currentGroup.name) {
      set(
        groupsAtom,
        groups.map((group) => {
          return group.name === newItem.group
            ? {
                ...group,
                list: group.list.map((item) => {
                  return item.ip === oldItemIp ? { ...newItem } : item;
                }),
              }
            : group;
        }),
      );
    } else if (!currentGroup.system && currentGroup.enabled) {
      set(
        groupsAtom,
        groups.map((group) => {
          return group.system
            ? {
                ...group,
                list: group.list.map((item) => {
                  return item.ip === oldItemIp ? { ...newItem } : item;
                }),
              }
            : group;
        }),
      );
    }
  },
);

export const removeSameGroupItemAtom = atom(
  null,
  (get, set, removedItem: Item) => {
    const currentGroup = get(currentGroupAtom);
    const groups = get(groupsAtom);

    if (currentGroup.system && removedItem.group !== currentGroup.name) {
      set(
        groupsAtom,
        groups.map((group) => {
          return group.name === removedItem.group
            ? {
                ...group,
                list: group.list.filter((item) => item.ip !== removedItem.ip),
              }
            : group;
        }),
      );
    } else if (!currentGroup.system && currentGroup.enabled) {
      set(
        groupsAtom,
        groups.map((group) => {
          return group.system
            ? {
                ...group,
                list: group.list.filter((item) => item.ip !== removedItem.ip),
              }
            : group;
        }),
      );
    }
  },
);
