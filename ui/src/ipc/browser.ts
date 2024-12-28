import { Ipc } from './abstract';

const KEY = 'mock-system-hosts';

export class BrowserIpc extends Ipc {
  async readSystemHosts(): Promise<string> {
    const mockHosts = localStorage.getItem(KEY);
    if (!mockHosts) {
      throw new Error('Just an error');
    }
    return mockHosts;
  }

  async writeSystemHosts(content: string): Promise<void> {
    localStorage.setItem(KEY, content);
  }

  async viewGitHub(): Promise<void> {
    window.open('https://github.com/shixinhuang99/hed2', '_blank');
  }
}
