import { invoke } from '@tauri-apps/api/core';

export const ipc = {
  getSystemHosts(): Promise<string> {
    return invoke('read_system_hosts');
  },
};
