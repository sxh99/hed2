import path from 'node:path';
import { BrowserWindow, app, ipcMain, nativeTheme, shell } from 'electron';
import { IS_DEV } from './consts.js';
import { getHostsPath, isHostsReadonly, readHosts, writeHosts } from './sys.js';
import { WidnowState } from './window-state.js';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  const widnowState = new WidnowState();
  widnowState.restoreWindowState();

  mainWindow = new BrowserWindow({
    width: widnowState.width,
    height: widnowState.height,
    minWidth: widnowState.minWidth,
    minHeight: widnowState.minHeight,
    resizable: true,
    center: true,
    webPreferences: {
      preload: path.join(import.meta.dirname, 'preload.js'),
      scrollBounce: true,
      spellcheck: false,
    },
    autoHideMenuBar: true,
    icon: IS_DEV
      ? path.join(import.meta.dirname, '../', '../', 'assets', 'icon.ico')
      : path.join(import.meta.dirname, 'assets', 'icon.ico'),
  });

  if (IS_DEV) {
    mainWindow.loadURL('http://localhost:4000');
    mainWindow.webContents.openDevTools({ mode: 'undocked', activate: false });
  } else {
    mainWindow.loadFile('./index.html');
  }

  mainWindow.removeMenu();
  mainWindow.setThumbnailToolTip('Hed2');

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('close', () => {
    if (mainWindow) {
      widnowState.saveWindowState(mainWindow);
    }
  });
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
