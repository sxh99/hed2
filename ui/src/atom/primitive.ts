import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { EditorKind } from '~/consts';
import type {
  EditorCfg,
  Group,
  HostHistory,
  SettingsValue,
  ThemeCfg,
} from '~/types';

export const currentGroupNameAtom = atom('');

export const groupsAtom = atom<Group[]>([]);

export const editorCfgAtom = atom<EditorCfg>({
  kind: EditorKind.List,
  showAll: false,
});

export const themeAtom = atom<ThemeCfg>({
  display: '',
  className: '',
});

export const systemHostsAtom = atom('');

export const hostsHistoryAtom = atomWithStorage<HostHistory[]>(
  'hosts-history',
  [],
  undefined,
  { getOnInit: true },
);

export const settingsAtom = atomWithStorage<SettingsValue>(
  'settings',
  { hostsNumPerLine: 10, historyMaximumNum: 200 },
  undefined,
  { getOnInit: true },
);
