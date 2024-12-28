import { atom } from 'jotai';
import { hostsHistoryAtom } from './primitive';

export const addHostsHistoryAtom = atom(null, (get, set, content: string) => {
  const list = get(hostsHistoryAtom);
  set(hostsHistoryAtom, [
    { content, createdAt: new Date().toISOString() },
    ...list,
  ]);
});
