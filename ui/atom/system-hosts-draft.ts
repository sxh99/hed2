import { atom } from 'jotai';
import type { Item } from '~/types';
import { ipc } from '~/utils/ipc';

export const systemHostsDraftAtom = atom('');

export const updateSystemHostsDraftAtom = atom(
  null,
  async (get, set, list: Item[]) => {
    const newText = await ipc.updateTextByList(list, get(systemHostsDraftAtom));
    set(systemHostsDraftAtom, newText);
  },
);
