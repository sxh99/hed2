import { useAtomValue } from 'jotai';
import { currentGroupAtom, systemHostsTextDraftAtom } from '~/atom';
import { CommonHeader, Textarea } from '~/components';
import { cn } from '~/utils/cn';
import { EditorKindToggle } from './editor-kind-toggle';

export function TextEditor(props: { className?: string }) {
  const { className } = props;

  const currentGroup = useAtomValue(currentGroupAtom);
  const systemHostsTextDraft = useAtomValue(systemHostsTextDraftAtom);

  if (!currentGroup) {
    return null;
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <CommonHeader>
        <EditorKindToggle />
      </CommonHeader>
      <Textarea className="whitespace-pre overflow-auto flex-1">
        {currentGroup.system ? systemHostsTextDraft : currentGroup.text}
      </Textarea>
    </div>
  );
}
