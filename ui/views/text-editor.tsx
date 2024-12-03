import { useGlobalState } from '~/context/global';

export function TextEditor() {
  const { selectedGroup } = useGlobalState();

  if (!selectedGroup) {
    return null;
  }

  return (
    <div className="whitespace-pre overflow-auto flex-1">
      {selectedGroup.text}
    </div>
  );
}
