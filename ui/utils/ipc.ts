import { invoke } from '@tauri-apps/api/core';
import { SYSTEM_GROUP_NAME } from '~/consts';
import type { Group, Item } from '~/types';

type RawGroup = Pick<Group, 'name' | 'text' | 'list'>;

export const ipc = {
  async getGroups(): Promise<Group[]> {
    const rawGroups = await invoke<RawGroup[]>('get_groups');
    return rawGroups.map((group) => {
      return {
        ...group,
        system: group.name === SYSTEM_GROUP_NAME,
        enabled: true,
      };
    });
  },

  isIp(text: string): Promise<boolean> {
    return invoke('is_ip', { text });
  },

  updateTextByList(
    list: Item[],
    text: string,
    group?: string,
  ): Promise<string> {
    return invoke('update_text_by_list', { list, text, group });
  },
};
