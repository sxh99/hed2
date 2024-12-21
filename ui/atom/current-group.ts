import { atom } from 'jotai';
import { focusAtom } from 'jotai-optics';
import { splitAtom } from 'jotai/utils';
import { NOT_EXISTS_GROUP } from '~/consts';
import type { Group, Item, ItemFormValue } from '~/types';
import { groupsWithWriterAtom, updateGroupsTextAtom } from './groups';
import { currentGroupNameAtom, groupsAtom } from './primitive';

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
    if (newGroup.system) {
      const enabledGroupNames = new Set(
        groups
          .filter((group) => group.enabled && !group.system)
          .map((group) => group.name),
      );
      const map: Map<string, Item[]> = new Map();
      for (const item of newGroup.list) {
        if (!enabledGroupNames.has(item.group)) {
          continue;
        }
        const list = map.get(item.group);
        if (list) {
          list.push(item);
        } else {
          map.set(item.group, [item]);
        }
      }
      for (const group of groups) {
        if (!group.enabled) {
          continue;
        }
        const newList = map.get(group.name);
        if (!newList) {
          group.list = [];
          continue;
        }
        group.list = [...newList];
      }
      set(
        groupsWithWriterAtom,
        groups.map((group) => {
          if (group.name === newGroup.name) {
            return newGroup;
          }
          if (group.enabled) {
            return { ...group };
          }
          return group;
        }),
      );
      set(updateGroupsTextAtom, [...enabledGroupNames]);
      return;
    }
    if (newGroup.enabled) {
      const systemGroup = groups.find((group) => group.system);
      if (!systemGroup) {
        return;
      }
      const startIdx = systemGroup.list.findIndex(
        (item) => item.group === newGroup.name,
      );
      if (startIdx === -1) {
        systemGroup.list = [...systemGroup.list, ...newGroup.list];
      } else {
        const deleteCount = systemGroup.list.reduce(
          (pre, item) => (item.group === newGroup.name ? pre + 1 : pre),
          0,
        );
        systemGroup.list.splice(startIdx, deleteCount, ...newGroup.list);
      }
    }
    set(
      groupsWithWriterAtom,
      groups.map((group) => {
        if (group.name === newGroup.name) {
          return newGroup;
        }
        return group;
      }),
    );
    set(updateGroupsTextAtom, [newGroup.name]);
  },
);

const currentGroupListAtom = focusAtom(currentGroupAtom, (optic) => {
  return optic.prop('list');
});

export const itemAtomsAtom = splitAtom(
  currentGroupListAtom,
  (item) => `${item.group}-${item.ip}`,
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
});
