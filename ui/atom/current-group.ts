import { atom } from 'jotai';
import { focusAtom } from 'jotai-optics';
import { splitAtom } from 'jotai/utils';
import { NOT_EXISTS_GROUP } from '~/consts';
import type { Group, Item, ItemFormValue } from '~/types';
import { storage } from '~/utils/storage';
import { currentGroupNameAtom } from './current-group-name';
import { groupsAtom, updateGroupTextAtom } from './groups';
import { updateSystemHostsDraftAtom } from './system-hosts-draft';

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
    if (!newGroup.system && newGroup.enabled && !newGroup.list.length) {
      newGroup.enabled = false;
    }
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
      set(updateSystemHostsDraftAtom, systemGroup.list);
    } else {
      storage.modifyDisabledGroup(newGroup);
    }
    if (!newGroup.system) {
      set(updateGroupTextAtom, newGroup.name);
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
      const targetGroup = groups.find(
        (group) => group.name === removedItem.group,
      );
      if (!targetGroup) {
        return;
      }
      targetGroup.list = targetGroup.list.filter(
        (item) => item.ip !== removedItem.ip,
      );
      if (
        targetGroup.enabled &&
        targetGroup.enabled &&
        !targetGroup.list.length
      ) {
        targetGroup.enabled = false;
      }
      set(
        groupsAtom,
        groups.map((group) => {
          return group.name === targetGroup.name ? { ...targetGroup } : group;
        }),
      );
      if (!targetGroup.enabled) {
        storage.modifyDisabledGroup(targetGroup);
      }
      set(updateGroupTextAtom, targetGroup.name);
    } else if (!currentGroup.system && currentGroup.enabled) {
      const systemGroup = groups.find((group) => group.system);
      if (!systemGroup) {
        return;
      }
      systemGroup.list = systemGroup.list.filter(
        (item) => item.ip !== removedItem.ip,
      );
      set(
        groupsAtom,
        groups.map((group) => {
          return group.system ? { ...systemGroup } : group;
        }),
      );
      set(updateSystemHostsDraftAtom, systemGroup.list);
    }
  },
);

export const addGroupItemAtom = atom(null, (get, set, v: ItemFormValue) => {
  const currentGroup = get(currentGroupAtom);

  const newItem: Item = {
    ip: v.ip,
    hosts: v.hosts
      .split('\n')
      .filter((s) => s.length)
      .flatMap((s) => {
        return s.split(' ').filter((s) => s.length);
      })
      .map((s) => {
        return {
          content: s,
          enabled: false,
        };
      }),
    group: currentGroup.name,
  };

  set(currentGroupListAtom, (list) => [...list, newItem]);

  if (!currentGroup.system && currentGroup.enabled) {
    const groups = get(groupsAtom);
    set(
      groupsAtom,
      groups.map((group) => {
        return group.system
          ? {
              ...group,
              list: [...group.list, newItem],
            }
          : group;
      }),
    );
  }
});
