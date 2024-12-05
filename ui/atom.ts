import { atom } from 'jotai';
import type { Group } from '~/types';
import { findAllGroupsAndItems } from '~/utils/group';
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
  async (get, set, oldIp: string, newIp: string) => {
    const currentGroupName = get(currentGroupNameAtom);
    const groups = get(groupsAtom);

    const targets = findAllGroupsAndItems(groups, currentGroupName, oldIp);

    await Promise.all(
      targets.map(async ({ group, item }) => {
        item.ip = newIp;
        group.textDraft = await ipc.updateTextByList(
          group.list,
          group.textDraft,
        );
      }),
    );

    set(groupsAtom, structuredClone(groups));
  },
);

export const deleteItemAtom = atom(null, async (get, set, ip: string) => {
  const currentGroupName = get(currentGroupNameAtom);
  const groups = get(groupsAtom);

  const targets = findAllGroupsAndItems(groups, currentGroupName, ip);

  await Promise.all(
    targets.map(async ({ group }) => {
      group.list = group.list.filter((v) => v.ip !== ip);
      group.textDraft = await ipc.updateTextByList(group.list, group.textDraft);
    }),
  );

  set(groupsAtom, structuredClone(groups));
});

export const setEnabledHostsAtom = atom(
  null,
  async (get, set, ip: string, enabledHosts: string[]) => {
    const currentGroupName = get(currentGroupNameAtom);
    const groups = get(groupsAtom);

    const targets = findAllGroupsAndItems(groups, currentGroupName, ip);

    await Promise.all(
      targets.map(async ({ group, item }) => {
        for (const host of item.hosts) {
          host.enabled = enabledHosts.includes(host.content);
        }
        group.textDraft = await ipc.updateTextByList(
          group.list,
          group.textDraft,
        );
      }),
    );

    set(groupsAtom, structuredClone(groups));
  },
);
