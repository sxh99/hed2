import { atom } from 'jotai';
import type { Group } from '~/types';
import { findTargetGroupsAndItems } from '~/utils/group';
import { ipc } from '~/utils/ipc';
import { storage } from '~/utils/storage';

export const groupsAtom = atom<Group[]>([]);

export const currentGroupNameAtom = atom('');

export const systemGroupTextDraftAtom = atom('');

export const currentGroupAtom = atom(
  (get) => {
    const currentGroupName = get(currentGroupNameAtom);
    const groups = get(groupsAtom);
    return groups.find((group) => group.name === currentGroupName);
  },
  (_, set, newGroup: Group) => {
    set(groupsAtom, (groups) => {
      return groups.map((group) => {
        if (group.name === newGroup.name) {
          return { ...newGroup };
        }
        return group;
      });
    });
  },
);

export const initGroupsAtom = atom(null, async (_, set) => {
  const groups = await ipc.getGroups();
  const systemGroup = groups.find((profile) => profile.system);
  if (systemGroup) {
    set(currentGroupNameAtom, systemGroup.name);
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

export const renameGroupAtom = atom(
  null,
  async (get, set, oldName: string, newName: string) => {
    const groups = get(groupsAtom);

    const targetGroup = groups.find((g) => g.name === oldName);
    if (!targetGroup) {
      return;
    }

    targetGroup.name = newName;

    if (targetGroup.enabled) {
      const systemGroup = groups.find((g) => g.system);
      if (!systemGroup) {
        return;
      }
      for (const item of systemGroup.list) {
        if (item.group === oldName) {
          item.group = newName;
        }
      }
      systemGroup.text = await ipc.updateTextByList(
        systemGroup.list,
        systemGroup.text,
      );
    } else {
      //
    }

    set(groupsAtom, structuredClone(groups));

    if (get(currentGroupNameAtom) !== newName) {
      set(currentGroupNameAtom, newName);
    }
  },
);

export const toggleGroupEnableAtom = atom(
  null,
  async (get, set, groupName: string) => {
    const groups = get(groupsAtom);

    const targetGroup = groups.find((g) => g.name === groupName);
    if (!targetGroup) {
      return;
    }

    targetGroup.enabled = !targetGroup.enabled;
    const systemGroup = groups.find((g) => g.system);
    if (!systemGroup) {
      return;
    }

    if (targetGroup.enabled) {
      systemGroup.list.push(...targetGroup.list);
    } else {
      systemGroup.list = systemGroup.list.filter(
        (item) => item.group !== targetGroup.name,
      );
    }
    systemGroup.text = await ipc.updateTextByList(
      systemGroup.list,
      systemGroup.text,
    );

    set(groupsAtom, structuredClone(groups));
  },
);

export const deleteGroupAtom = atom(
  null,
  async (get, set, groupName: string) => {
    let groups = get(groupsAtom);

    const targetGroup = groups.find((g) => g.name === groupName);
    if (!targetGroup) {
      return;
    }

    groups = groups.filter((g) => g.name !== groupName);

    if (targetGroup.enabled) {
      const systemGroup = groups.find((g) => g.system);
      if (!systemGroup) {
        return;
      }
      systemGroup.list = systemGroup.list.filter(
        (item) => item.group !== targetGroup.name,
      );
      systemGroup.text = await ipc.updateTextByList(
        systemGroup.list,
        systemGroup.text,
      );
    } else {
      storage.deleteDisabledGroup(targetGroup.name);
    }

    set(groupsAtom, structuredClone(groups));

    if (get(currentGroupNameAtom) === groupName) {
      set(currentGroupNameAtom, 'System');
    }
  },
);

export const setItemIpAtom = atom(
  null,
  async (get, set, oldIp: string, newIp: string) => {
    const currentGroupName = get(currentGroupNameAtom);
    const groups = get(groupsAtom);

    const targets = findTargetGroupsAndItems(groups, currentGroupName, oldIp);

    await Promise.all(
      targets.map(async ({ group, item }) => {
        item.ip = newIp;
        group.text = await ipc.updateTextByList(group.list, group.text);
      }),
    );

    set(groupsAtom, structuredClone(groups));
  },
);

export const deleteItemAtom = atom(null, async (get, set, ip: string) => {
  const currentGroupName = get(currentGroupNameAtom);
  const groups = get(groupsAtom);

  const targets = findTargetGroupsAndItems(groups, currentGroupName, ip);

  await Promise.all(
    targets.map(async ({ group }) => {
      group.list = group.list.filter((v) => v.ip !== ip);
      group.text = await ipc.updateTextByList(group.list, group.text);
    }),
  );

  set(groupsAtom, structuredClone(groups));
});

export const setEnabledHostsAtom = atom(
  null,
  async (get, set, ip: string, enabledHosts: string[]) => {
    const currentGroupName = get(currentGroupNameAtom);
    const groups = get(groupsAtom);

    const targets = findTargetGroupsAndItems(groups, currentGroupName, ip);

    await Promise.all(
      targets.map(async ({ group, item }) => {
        for (const host of item.hosts) {
          host.enabled = enabledHosts.includes(host.content);
        }
        group.text = await ipc.updateTextByList(group.list, group.text);
      }),
    );

    set(groupsAtom, structuredClone(groups));
  },
);
