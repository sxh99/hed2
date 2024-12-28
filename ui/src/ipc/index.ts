import { IS_TAURI } from '~/consts';
import type { Ipc } from './abstract';
import { BrowserIpc } from './browser';
import { TauriIpc } from './tauri';

function createIpc(): Ipc {
  if (IS_TAURI) {
    return new TauriIpc();
  }
  return new BrowserIpc();
}

export const ipc = createIpc();
