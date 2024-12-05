import { useAtomValue } from 'jotai';
import { currentGroupAtom } from '~/atom';

export function TextEditor() {
  const currentGroup = useAtomValue(currentGroupAtom);

  if (!currentGroup) {
    return null;
  }

  return (
    <div className="whitespace-pre overflow-auto flex-1">
      {currentGroup.textDraft}
    </div>
  );
}
