import { invoke, isTauri } from '@tauri-apps/api/core';

export const ipc = {
  getSystemHosts(): Promise<string> {
    if (isTauri()) {
      return invoke('read_system_hosts');
    }
    return Promise.resolve('');
  },
};
