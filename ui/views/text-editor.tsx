import { useGlobalState } from '~/context/global';

export function TextEditor() {
  const { selectedGroupName, groups } = useGlobalState();

  const group = groups.find((group) => group.name === selectedGroupName);

  if (!group) {
    return null;
  }

  return (
    <div className="whitespace-pre overflow-auto flex-1">{group.textDraft}</div>
  );
}
