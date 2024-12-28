import { parser } from 'hed2-parser';
import { atom } from 'jotai';
import { focusAtom } from 'jotai-optics';
import { splitAtom } from 'jotai/utils';
import { xorWith } from 'lodash';
import { NOT_EXISTS_GROUP } from '~/consts';
import type { Group, Item, ItemFormValue } from '~/types';
import { filterDisabledGroups, mergeGroups } from '~/utils/group';
import { storage } from '~/utils/storage';
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
  (get, set, changedGroup: Group) => {
    const groups = get(groupsAtom);
    const systemGroup = groups.find((group) => group.system);
    if (!systemGroup) {
      return;
    }
    if (changedGroup.system) {
      const ipMap: Record<string, string> = {};
      const xor = xorWith(systemGroup.list, changedGroup.list, (a, b) => {
        return a.ip === b.ip;
      });
      if (xor.length === 2) {
        const [previous, current] = xor;
        if (previous.ip !== current.ip) {
          ipMap[previous.ip] = current.ip;
          ipMap[current.ip] = previous.ip;
        }
      }
      const newText = parser.listToText(changedGroup.list, systemGroup.text, {
        ipMap,
      });
      const newRawGroups = parser.textToGroups(newText);
      set(groupsAtom, mergeGroups(newRawGroups, filterDisabledGroups(groups)));
      return;
    }
    if (changedGroup.enabled) {
      const newText = parser.listToText(changedGroup.list, changedGroup.text, {
        specifiedGroup: changedGroup.name,
      });
      const newSystemText = parser.replaceGroupText(
        changedGroup.name,
        newText,
        systemGroup.text,
      );
      const newRawGroups = parser.textToGroups(newSystemText);
      set(groupsAtom, mergeGroups(newRawGroups, filterDisabledGroups(groups)));
      return;
    }
    changedGroup.text = parser.listToText(
      changedGroup.list,
      changedGroup.text,
      { specifiedGroup: changedGroup.name },
    );
    set(
      groupsAtom,
      groups.map((group) => {
        return group.name === changedGroup.name ? changedGroup : group;
      }),
    );
    storage.setDisabledGroups(filterDisabledGroups(groups));
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

export const editGroupTextAtom = atom(null, (get, set, newText: string) => {
  const currentGroup = get(currentGroupAtom);
  const groups = get(groupsAtom);
  if (currentGroup.system) {
    const newRawGroups = parser.textToGroups(newText);
    set(groupsAtom, mergeGroups(newRawGroups, filterDisabledGroups(groups)));
    return;
  }
  if (currentGroup.enabled) {
    const systemGroup = groups.find((group) => group.system);
    if (!systemGroup) {
      return;
    }
    const newSystemText = parser.replaceGroupText(
      currentGroup.name,
      newText,
      systemGroup.text,
    );
    const newRawGroups = parser.textToGroups(newSystemText);
    set(groupsAtom, mergeGroups(newRawGroups, filterDisabledGroups(groups)));
    return;
  }
  const newList = parser.textToList(newText, currentGroup.name);
  const newGroups = groups.map((group) => {
    if (group.name === currentGroup.name) {
      return { ...group, list: newList, text: newText };
    }
    return group;
  });
  set(groupsAtom, newGroups);
  storage.setDisabledGroups(filterDisabledGroups(newGroups));
});
