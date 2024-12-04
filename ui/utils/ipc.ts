import { invoke } from '@tauri-apps/api/core';
import type { Group, Item } from '~/types';
import { storage } from './storage';

type GroupDTO = Pick<Group, 'name' | 'text' | 'list'>;

export const ipc = {
  async getGroups(): Promise<Group[]> {
    const groupsDTO: GroupDTO[] = await invoke('get_groups');
    const enabledGroups: Group[] = groupsDTO.map((group) => {
      return {
        ...group,
        system: group.name === 'System',
        enabled: true,
        textDraft: group.text,
      };
    });
    const disabledGroups = storage.getDisabledGroups();
    return [...enabledGroups, ...disabledGroups];
  },

  isIp(text: string): Promise<boolean> {
    return invoke('is_ip', { text });
  },

  updateTextByList(list: Item[], text: string): Promise<string> {
    return invoke('update_text_by_list', { list, text });
  },
};
