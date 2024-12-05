import { atom } from 'jotai';
import type { Group } from '~/types';
import { ipc } from '~/utils/ipc';

export const groupsAtom = atom<Group[]>([]);

export const currentGroupNameAtom = atom('');

export const currentGroupAtom = atom((get) => {
  const currentGroupName = get(currentGroupNameAtom);
  const groups = get(groupsAtom);
  return groups.find((group) => group.name === currentGroupName);
});

export const initGroupsAtom = atom(null, async (_, set) => {
  const groups = await ipc.getGroups();
  const systemGroup = groups.find((profile) => profile.system);
  if (systemGroup) {
    set(currentGroupNameAtom, systemGroup.name);
  }
  set(groupsAtom, groups);
});

export const addGroupAtom = atom(null, (_, set, groupName: string) => {
  set(groupsAtom, (groups) => [
    ...groups,
    {
      name: groupName,
      text: '',
      list: [],
      system: false,
      enabled: false,
      textDraft: '',
    },
  ]);
  set(currentGroupNameAtom, groupName);
});

export const setItemIpAtom = atom(
  null,
  (get, set, oldIp: string, newIp: string) => {
    const currentGroupName = get(currentGroupNameAtom);
    const groups = get(groupsAtom);
    const item = findItem(groups, currentGroupName, oldIp);
    if (item) {
      item.ip = newIp;
      if (currentGroupName === 'System') {
        const anotherItem = findItem(groups, item.group, oldIp);
        if (anotherItem) {
          anotherItem.ip = newIp;
        }
      } else {
        const anotherItem = findItem(groups, 'System', oldIp);
        if (anotherItem) {
          anotherItem.ip = newIp;
        }
      }
      set(groupsAtom, structuredClone(groups));
    }
  },
);

function findItem(groups: Group[], groupName: string, ip: string) {
  const targetGroup = groups.find((group) => group.name === groupName);
  if (!targetGroup) {
    return;
  }
  return targetGroup.list.find((item) => item.ip === ip);
}
