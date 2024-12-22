import { invoke } from '@tauri-apps/api/core';
import { IS_TAURI } from '~/consts';

export const ipc = {
  getSystemHosts(): Promise<string> {
    if (IS_TAURI) {
      return invoke('read_system_hosts');
    }
    return Promise.resolve('');
  },

  viewGitHub(): void {
    if (IS_TAURI) {
      invoke('view_github');
    }
  },
};
