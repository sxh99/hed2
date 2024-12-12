import { useAtom, useAtomValue } from 'jotai';
import { currentGroupAtom, editorCfgAtom } from '~/atom';
import { EditorKind, NOT_EXISTS_GROUP_NAME } from '~/consts';
import { ListEditor } from './list-editor';
import { TextEditor } from './text-editor';

export function Editor() {
  const currentGroup = useAtomValue(currentGroupAtom);
  const [editorCfg, setEditorCfg] = useAtom(editorCfgAtom);

  if (currentGroup.name === NOT_EXISTS_GROUP_NAME) {
    return null;
  }

  if (editorCfg.showAll) {
    return (
      <>
        <ListEditor />
        <TextEditor />
      </>
    );
  }

  if (editorCfg.kind === EditorKind.List) {
    return <ListEditor />;
  }

  return <TextEditor />;
}
