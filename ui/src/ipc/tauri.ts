import { invoke } from '@tauri-apps/api/core';
import { Ipc } from './abstract';

export class TauriIpc extends Ipc {
  readSystemHosts(): Promise<string> {
    return invoke('read_system_hosts');
  }

  writeSystemHosts(content: string): Promise<void> {
    return invoke('write_system_hosts', { content });
  }

  viewGitHub(): Promise<void> {
    return invoke('view_github');
  }

  openHostsDir(): Promise<void> {
    return invoke('open_hosts_dir');
  }
}
