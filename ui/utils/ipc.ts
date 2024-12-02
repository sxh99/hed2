import { invoke } from '@tauri-apps/api/core';
import type { Group, Item } from '~/types';

interface RawGroup {
  name: string;
  text: string;
  list: Item[];
}

export const ipc = {
  async getGroups(): Promise<Group[]> {
    const rawGroups: RawGroup[] = await invoke('get_groups');
    return rawGroups.map((group) => {
      return {
        ...group,
        system: group.name === 'System',
        textDraft: group.text,
      };
    });
  },
};
