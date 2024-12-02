import { useGlobalState } from '~/context/global';

export function ListEditor() {
  const { selectedGroup } = useGlobalState();

  if (!selectedGroup) {
    return null;
  }

  return <div>{JSON.stringify(selectedGroup.list)}</div>;
}
