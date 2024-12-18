import { atom } from 'jotai';
import { focusAtom } from 'jotai-optics';
import { splitAtom } from 'jotai/utils';
import { NOT_EXISTS_GROUP } from '~/consts';
import type { Group, Item, ItemFormValue } from '~/types';
import { storage } from '~/utils/storage';
import { currentGroupNameAtom } from './current-group-name';
import { groupsAtom, updateTextByListAtom } from './groups';

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
