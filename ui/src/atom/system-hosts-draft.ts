import { parser } from 'hed2-parser';
import { atom } from 'jotai';
import { groupsAtom, systemHostsDraftAtom } from './primitive';

export const updateSystemHostsDraftAtom = atom(null, (get, set) => {
  const groups = get(groupsAtom);
  const systemGroup = groups.find((group) => group.system);
  if (!systemGroup) {
    return;
  }
  const preDraft = get(systemHostsDraftAtom);
  const newText = parser.listToText(systemGroup.list, preDraft);
  set(systemHostsDraftAtom, newText);
});
