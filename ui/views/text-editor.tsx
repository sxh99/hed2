import { useAtomValue } from 'jotai';
import { currentGroupAtom, systemHostsTextDraftAtom } from '~/atom';
import { CommonHeader } from '~/components';
import { EditorKindToggle } from './editor-kind-toggle';

export function TextEditor() {
  const currentGroup = useAtomValue(currentGroupAtom);
  const systemHostsTextDraft = useAtomValue(systemHostsTextDraftAtom);

  if (!currentGroup) {
    return null;
  }

  return (
    <>
      <CommonHeader>
        <EditorKindToggle />
      </CommonHeader>
      <div className="whitespace-pre overflow-auto flex-1">
        {currentGroup.system ? systemHostsTextDraft : currentGroup.text}
      </div>
    </>
  );
}
