import { SYSTEM_GROUP, parser } from 'hed2-parser';
import { atom } from 'jotai';
import { splitAtom } from 'jotai/utils';
import { xorWith } from 'lodash';
import type { Group } from '~/types';
import { ipc } from '~/utils/ipc';
import { storage } from '~/utils/storage';
import {
  currentGroupNameAtom,
  groupsAtom,
  systemHostsDraftAtom,
} from './primitive';
import { setSystemHostsDraftByListAtom } from './system-hosts-draft';

export const groupsWithWriterAtom = atom(
  (get) => {
    return get(groupsAtom);
  },
  (get, set, newGroups: Group[], changeByEditText?: boolean) => {
    const groups = get(groupsAtom);
    const systemGroup = newGroups.find((group) => group.system);
    if (systemGroup) {
      const xor = xorWith(groups, newGroups, (a, b) => {
        return a.name === b.name && a.enabled === b.enabled;
      });
      if (xor.length === 1) {
        const removed = xor[0];
        systemGroup.list = systemGroup.list.filter(
          (item) => item.group !== removed.name,
        );
        if (get(currentGroupNameAtom) === removed.name) {
          set(currentGroupNameAtom, SYSTEM_GROUP);
        }
      } else if (xor.length === 2) {
        const [previous, current] = xor;
        if (previous.name !== current.name) {
          current.list = current.list.map((item) => {
            return { ...item, group: current.name };
          });
          systemGroup.list = systemGroup.list.map((item) => {
            return item.group === previous.name
              ? { ...item, group: current.name }
              : item;
          });
          if (get(currentGroupNameAtom) === previous.name) {
            set(currentGroupNameAtom, current.name);
          }
        } else if (!previous.enabled && current.enabled) {
          systemGroup.list = [...systemGroup.list, ...current.list];
        } else if (previous.enabled && !current.enabled) {
          systemGroup.list = systemGroup.list.filter(
            (item) => item.group !== current.name,
          );
        }
      }
    }
    set(
      groupsAtom,
      newGroups.map((group) => {
        return group.system ? { ...group } : group;
      }),
    );
    if (!changeByEditText) {
      set(setSystemHostsDraftByListAtom);
    }
    storage.setDisabledGroups(newGroups.filter((group) => !group.enabled));
  },
);

export const groupAtomsAtom = splitAtom(
  groupsWithWriterAtom,
  (group) => group.name,
);

export const initGroupsAtom = atom(null, async (_, set) => {
  const systemHosts = await ipc.getSystemHosts();
  const rawGroups = parser.textToGroups(systemHosts);
  const groups: Group[] = rawGroups.map((group) => {
    return { ...group, system: group.name === SYSTEM_GROUP, enabled: true };
  });
  const systemGroup = groups.find((group) => group.system);
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
  storage.setDisabledGroups(newGroups.filter((group) => !group.enabled));
});
