import { IS_TAURI } from '~/consts';
import type { Ipc } from './abstract';
import { BrowserIpc } from './browser';
import { ElectronIpc } from './electron';
import { TauriIpc } from './tauri';

function createIpc(): Ipc {
  if (IS_TAURI) {
    return new TauriIpc();
  }
  if (window.electronAPI) {
    return new ElectronIpc();
  }
  return new BrowserIpc();
}

export const ipc = createIpc();
