import { parser } from 'hed2-parser';
import { atom } from 'jotai';
import { splitAtom } from 'jotai/utils';
import { xorWith } from 'lodash';
import type { Group } from '~/types';
import { filterDisabledGroups, mergeGroups } from '~/utils/group';
import { ipc } from '~/utils/ipc';
import { storage } from '~/utils/storage';
import {
  currentGroupNameAtom,
  groupsAtom,
  systemHostsDraftAtom,
} from './primitive';
import { setSystemHostsDraftAtom } from './system-hosts-draft';

export const groupsWithWriterAtom = atom(
  (get) => {
    return get(groupsAtom);
  },
  (get, set, newGroups: Group[]) => {
    const groups = get(groupsAtom);
    const systemGroup = newGroups.find((group) => group.system);
    const xor = xorWith(groups, newGroups, (a, b) => {
      return a.name === b.name && a.enabled === b.enabled;
    });
    const currentGroupName = get(currentGroupNameAtom);
    const groupNameMap: Record<string, string> = {};

    if (xor.length === 1 && systemGroup) {
      const removed = xor[0];
      if (removed.enabled) {
        systemGroup.list = systemGroup.list.filter(
          (item) => item.group !== removed.name,
        );
      }
      if (currentGroupName === removed.name) {
        set(currentGroupNameAtom, systemGroup.name);
      }
    }

    if (xor.length === 2) {
      const [previous, current] = xor;
      if (previous.name !== current.name) {
        current.list = current.list.map((item) => {
          return { ...item, group: current.name };
        });
        if (current.enabled && systemGroup) {
          systemGroup.list = systemGroup.list.map((item) => {
            return item.group === previous.name
              ? { ...item, group: current.name }
              : item;
          });
        }
        if (currentGroupName === previous.name) {
          set(currentGroupNameAtom, current.name);
        }
        groupNameMap[current.name] = previous.name;
        groupNameMap[previous.name] = current.name;
      }
      if (!previous.enabled && current.enabled && systemGroup) {
        systemGroup.list = [...systemGroup.list, ...current.list];
      }
      if (previous.enabled && !current.enabled && systemGroup) {
        systemGroup.list = systemGroup.list.filter(
          (item) => item.group !== current.name,
        );
      }
    }

    set(
      groupsAtom,
      newGroups.map((group) => {
        return group.system ? { ...group } : group;
      }),
    );
    set(setSystemHostsDraftAtom, groupNameMap);
    storage.setDisabledGroups(filterDisabledGroups(newGroups));
  },
);

export const groupAtomsAtom = splitAtom(
  groupsWithWriterAtom,
  (group) => group.name,
);

export const initGroupsAtom = atom(null, async (_, set) => {
  const systemHosts = await ipc.getSystemHosts();
  const rawGroups = parser.textToGroups(systemHosts);
  const disabledGroups = storage.getDisabledGroups();
  const groups = mergeGroups(rawGroups, disabledGroups);
  const systemGroup = groups.find((group) => group.system);
  if (systemGroup) {
    set(currentGroupNameAtom, systemGroup.name);
    set(systemHostsDraftAtom, systemGroup.text);
  }
  set(groupsAtom, groups);
});

export const addGroupAtom = atom(null, (get, set, groupName: string) => {
  const newGroup: Group = {
    name: groupName,
    text: '',
    list: [],
    system: false,
    enabled: false,
  };
  const newGroups = get(groupsAtom).concat(newGroup);
  set(groupsAtom, newGroups);
  set(currentGroupNameAtom, groupName);
  storage.setDisabledGroups(filterDisabledGroups(newGroups));
});
