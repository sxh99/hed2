import { githubDark, githubLight } from '@uiw/codemirror-theme-github';
import CodeMirror from '@uiw/react-codemirror';
import { useAtomValue, useSetAtom } from 'jotai';
import { debounce } from 'lodash';
import { useMemo } from 'react';
import {
  currentGroupAtom,
  editGroupTextAtom,
  formatAllAtom,
  themeAtom,
} from '~/atom';
import { Button, CommonHeader, Kbd } from '~/components';
import { Theme } from '~/consts';
import { cn } from '~/utils/cn';
import { hostsLangSupport } from '~/utils/hosts-lang';
import { EditorKindToggle } from './editor-kind-toggle';

export function TextEditor(props: { className?: string }) {
  const { className } = props;

  const currentGroup = useAtomValue(currentGroupAtom);
  const theme = useAtomValue(themeAtom);
  const editGroupText = useSetAtom(editGroupTextAtom);
  const debounceEditGroupText = useMemo(() => debounce(editGroupText, 200), []);
  const formatAll = useSetAtom(formatAllAtom);

  return (
    <div className={cn('h-full', className)}>
      <CommonHeader>
        <EditorKindToggle />
        <div>
          <Button variant="outline" ignoreSvg onClick={formatAll}>
            Format
            <Kbd keys={['shift', 'option', 'F']} />
          </Button>
        </div>
      </CommonHeader>
      <CodeMirror
        style={{ height: 'calc(100% - 3.5rem)' }}
        height="100%"
        theme={theme.className === Theme.Dark ? githubDark : githubLight}
        value={currentGroup.text}
        extensions={[hostsLangSupport]}
        onChange={debounceEditGroupText}
      />
    </div>
  );
}
