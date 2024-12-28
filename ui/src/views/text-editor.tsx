import { useAtomValue, useSetAtom } from 'jotai';
import { debounce } from 'lodash';
import { useMemo } from 'react';
import { currentGroupAtom, editGroupTextAtom, formatAllAtom } from '~/atom';
import { Button, CommonHeader, Kbd } from '~/components';
import { cn } from '~/utils/cn';
import { CodeEditor } from './code-editor';
import { EditorKindToggle } from './editor-kind-toggle';

export function TextEditor(props: { className?: string }) {
  const { className } = props;

  const currentGroup = useAtomValue(currentGroupAtom);
  const editGroupText = useSetAtom(editGroupTextAtom);
  const debounceEditGroupText = useMemo(() => debounce(editGroupText, 200), []);
  const formatAll = useSetAtom(formatAllAtom);

  return (
    <div className={cn('h-full', className)}>
      <CommonHeader>
        <EditorKindToggle />
        <div>
          <Button variant="outline" onClick={formatAll}>
            Format
            <Kbd keybind="shift + option + F" />
          </Button>
        </div>
      </CommonHeader>
      <CodeEditor
        style={{ height: 'calc(100% - 3.5rem)' }}
        value={currentGroup.text}
        onChange={debounceEditGroupText}
      />
    </div>
  );
}
