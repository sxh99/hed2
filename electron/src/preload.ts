const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  readSystemHosts: () => {
    return ipcRenderer.invoke('read-system-hosts');
  },
  writeSystemHosts: (content: string) => {
    return ipcRenderer.invoke('write-system-hosts', content);
  },
  viewGithub: () => {
    ipcRenderer.send('view-github');
  },
  openHostsDir: () => {
    ipcRenderer.send('open-hosts-dir');
  },
  setTheme: (theme: string) => {
    ipcRenderer.send('set-theme', theme);
  },
});
