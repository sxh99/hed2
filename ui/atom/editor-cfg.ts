import { atom } from 'jotai';
import { EditorKind } from '~/consts';

interface EditorCfg {
  kind: string;
  showAll: boolean;
}

export const editorCfgAtom = atom<EditorCfg>({
  kind: EditorKind.List,
  showAll: false,
});
