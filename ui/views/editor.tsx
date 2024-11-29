import { useState } from 'react';
import { EditorKind } from '~/enum';
import { EditorHeader } from './editor-header';
import { EditorBody } from './editor-body';

export function Editor() {
  const [editorKind, setEditorKind] = useState<string>(EditorKind.List);

  return (
    <>
      <EditorHeader
        editorKind={editorKind}
        onEditorKindChange={setEditorKind}
      />
      <EditorBody editorKind={editorKind} />
    </>
  );
}
