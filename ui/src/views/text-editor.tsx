import { useAtomValue } from 'jotai';
import { currentGroupAtom, systemHostsDraftAtom } from '~/atom';
import { CommonHeader, Textarea } from '~/components';
import { cn } from '~/utils/cn';
import { EditorKindToggle } from './editor-kind-toggle';

export function TextEditor(props: { className?: string }) {
  const { className } = props;

  const currentGroup = useAtomValue(currentGroupAtom);
  const systemHostsDraft = useAtomValue(systemHostsDraftAtom);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <CommonHeader>
        <EditorKindToggle />
      </CommonHeader>
      <div className="w-full flex-1 p-1">
        <Textarea
          className="whitespace-pre overflow-auto resize-none h-full rounded-none border-none rounded-br-md"
          value={currentGroup.system ? systemHostsDraft : currentGroup.text}
          readOnly
        />
      </div>
    </div>
  );
}
