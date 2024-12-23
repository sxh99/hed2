import { githubDark, githubLight } from '@uiw/codemirror-theme-github';
import CodeMirror from '@uiw/react-codemirror';
import { useAtomValue } from 'jotai';
import { currentGroupAtom, systemHostsDraftAtom, themeAtom } from '~/atom';
import { CommonHeader } from '~/components';
import { Theme } from '~/consts';
import { cn } from '~/utils/cn';
import { hostsLangSupport } from '~/utils/hosts-lang';
import { EditorKindToggle } from './editor-kind-toggle';

export function TextEditor(props: { className?: string }) {
  const { className } = props;

  const currentGroup = useAtomValue(currentGroupAtom);
  const systemHostsDraft = useAtomValue(systemHostsDraftAtom);
  const theme = useAtomValue(themeAtom);

  return (
    <div className={cn('h-full', className)}>
      <CommonHeader>
        <EditorKindToggle />
      </CommonHeader>
      <CodeMirror
        style={{ height: 'calc(100% - 3.5rem)' }}
        height="100%"
        theme={theme.className === Theme.Dark ? githubDark : githubLight}
        value={currentGroup.system ? systemHostsDraft : currentGroup.text}
        extensions={[hostsLangSupport]}
      />
    </div>
  );
}
