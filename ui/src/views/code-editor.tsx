import { githubDark, githubLight } from '@uiw/codemirror-theme-github';
import CodeMirror, { type ReactCodeMirrorProps } from '@uiw/react-codemirror';
import { useAtomValue } from 'jotai';
import { themeAtom } from '~/atom';
import { Theme } from '~/consts';
import { hostsLangSupport } from '~/utils/hosts-lang';

export function CodeEditor(props: ReactCodeMirrorProps) {
  const theme = useAtomValue(themeAtom);

  return (
    <CodeMirror
      height="100%"
      theme={theme.className === Theme.Dark ? githubDark : githubLight}
      extensions={[hostsLangSupport]}
      {...props}
    />
  );
}
