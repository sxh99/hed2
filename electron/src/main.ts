import path from 'node:path';
import { BrowserWindow, app, ipcMain, nativeTheme, shell } from 'electron';
import { getHostsPath, isHostsReadonly, readHosts, writeHosts } from './sys.js';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 1000,
    minHeight: 700,
    resizable: true,
    center: true,
    webPreferences: {
      preload: path.join(import.meta.dirname, 'preload.js'),
    },
  });

  if (import.meta.env.MODE === 'development') {
    mainWindow.loadURL('http://localhost:4000');
    mainWindow.webContents.openDevTools({ mode: 'undocked' });
  } else {
    mainWindow.loadFile('./index.html');
  }
}

function initIpc() {
  ipcMain.handle('read-system-hosts', async () => {
    try {
      return await readHosts();
    } catch (_) {
      throw new Error('Failed to read system hosts file');
    }
  });

  ipcMain.handle('write-system-hosts', async (_, content) => {
    try {
      if (!(await isHostsReadonly())) {
        throw new Error(
          'The hosts file is in read-only mode, please disable it manually',
        );
      }
      await writeHosts(content);
    } catch (_) {
      throw new Error('Failed to write system hosts file');
    }
  });

  ipcMain.on('view-github', () => {
    shell.openExternal(PKG_REPOSITORY);
  });

  ipcMain.on('open-hosts-dir', async () => {
    const file = await getHostsPath();
    shell.showItemInFolder(file);
  });

  ipcMain.on('set-theme', (_, theme: string) => {
    if (theme === 'dark') {
      nativeTheme.themeSource = 'dark';
    } else if (theme === 'light') {
      nativeTheme.themeSource = 'light';
    } else {
      nativeTheme.themeSource = 'system';
    }
  });
}

function main() {
  if (!app.requestSingleInstanceLock()) {
    app.quit();
  } else {
    app.on('second-instance', () => {
      if (!mainWindow) {
        return;
      }
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    });
  }

  app.whenReady().then(() => {
    initIpc();
    createWindow();
  });
}

main();
