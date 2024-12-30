import { useAtom, useAtomValue } from 'jotai';
import { useEffect } from 'react';
import { currentGroupAtom, editorCfgAtom } from '~/atom';
import { Separator } from '~/components';
import { EditorKind, NOT_EXISTS_GROUP_NAME } from '~/consts';
import { ListEditor } from './list-editor';
import { TextEditor } from './text-editor';

export function Editor() {
  const currentGroup = useAtomValue(currentGroupAtom);
  const [editorCfg, setEditorCfg] = useAtom(editorCfgAtom);

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 1280px)');
    if (mql.matches) {
      setEditorCfg((prev) => ({ ...prev, showAll: true }));
    }
    const listener = (e: MediaQueryListEvent) => {
      setEditorCfg((prev) => ({ ...prev, showAll: e.matches }));
    };
    mql.addEventListener('change', listener);
    return () => mql.removeEventListener('change', listener);
  }, []);

  if (currentGroup.name === NOT_EXISTS_GROUP_NAME) {
    return null;
  }

  if (editorCfg.showAll) {
    return (
      <div className="flex h-full w-full">
        <ListEditor className="flex-1" />
        <Separator orientation="vertical" />
        <TextEditor className="w-1/2" />
      </div>
    );
  }

  if (editorCfg.kind === EditorKind.List) {
    return <ListEditor />;
  }

  return <TextEditor />;
}
