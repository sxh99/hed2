import { useGlobalState } from '~/context/global';

export function TextEditor() {
  const { selectedGroup } = useGlobalState();

  if (!selectedGroup) {
    return null;
  }

  return <div>{selectedGroup.textDraft}</div>;
}
