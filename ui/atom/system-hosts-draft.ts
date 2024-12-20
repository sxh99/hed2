import { atom } from 'jotai';
import type { Item } from '~/types';
import { ipc } from '~/utils/ipc';
import { groupsAtom, systemHostsDraftAtom } from './primitive';

export const updateSystemHostsDraftAtom = atom(
  null,
  async (get, set, list?: Item[]) => {
    const preDraft = get(systemHostsDraftAtom);
    if (!list) {
      const groups = get(groupsAtom);
      const systemGroup = groups.find((group) => group.system);
      if (!systemGroup) {
        return;
      }
      const newText = await ipc.updateTextByList(systemGroup.list, preDraft);
      set(systemHostsDraftAtom, newText);
      return;
    }
    const newText = await ipc.updateTextByList(list, preDraft);
    set(systemHostsDraftAtom, newText);
  },
);
