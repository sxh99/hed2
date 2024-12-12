import { useAtom } from 'jotai';
import { editorCfgAtom } from '~/atom';
import { Tabs, TabsList, TabsTrigger } from '~/components/tabs';
import { EditorKind } from '~/consts';

export function EditorKindToggle() {
  const [editorCfg, setEditorCfg] = useAtom(editorCfgAtom);

  const handleChange = (v: string) => {
    setEditorCfg({ ...editorCfg, kind: v });
  };

  return (
    <Tabs value={editorCfg.kind} onValueChange={handleChange}>
      <TabsList>
        <TabsTrigger value={EditorKind.List}>
          {EditorKind.List.toUpperCase()}
        </TabsTrigger>
        <TabsTrigger value={EditorKind.Text}>
          {EditorKind.Text.toUpperCase()}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
