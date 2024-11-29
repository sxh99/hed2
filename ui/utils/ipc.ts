import { invoke } from '@tauri-apps/api/core';
import type { Item } from '~/types';

interface TextToListResult {
  list: Item[];
  lines: unknown[];
}

export const ipc = {
  getSysHostsContent(): Promise<string> {
    return invoke('sys_hosts_content');
  },
  textToList(text: string): Promise<TextToListResult> {
    return invoke('text_to_list', { text });
  },
};
