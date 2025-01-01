import { Ipc } from './abstract';

export class ElectronIpc extends Ipc {
  readSystemHosts(): Promise<string> {
    return window.electronAPI.readSystemHosts();
  }

  writeSystemHosts(content: string): Promise<void> {
    return window.electronAPI.writeSystemHosts(content);
  }

  async viewGitHub(): Promise<void> {
    window.electronAPI.viewGithub();
  }

  async openHostsDir(): Promise<void> {
    window.electronAPI.openHostsDir();
  }

  async setTheme(theme: string): Promise<void> {
    window.electronAPI.setTheme(theme);
  }
}
