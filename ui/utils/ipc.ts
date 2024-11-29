import { invoke } from '@tauri-apps/api/core';

export function getSysHostsContent(): Promise<string> {
  return invoke('sys_hosts_content');
}
