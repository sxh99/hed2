import { atom } from 'jotai';
import { EditorKind } from '~/consts';
import type { EditorCfg, Group, ThemeCfg } from '~/types';

export const currentGroupNameAtom = atom('');

export const groupsAtom = atom<Group[]>([]);

export const systemHostsDraftAtom = atom('');

export const editorCfgAtom = atom<EditorCfg>({
  kind: EditorKind.List,
  showAll: false,
});

export const themeAtom = atom<ThemeCfg>({
  display: '',
  className: '',
});

export const systemHostsAtom = atom('');
