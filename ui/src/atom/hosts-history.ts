import { atom } from 'jotai';
import { hostsHistoryAtom, settingsAtom } from './primitive';

export const addHostsHistoryAtom = atom(null, (get, set, content: string) => {
  const list = get(hostsHistoryAtom);
  const settings = get(settingsAtom);
  let newList = [{ content, createdAt: new Date().toISOString() }, ...list];
  if (newList.length > settings.historyMaximumNum) {
    newList = newList.slice(0, settings.historyMaximumNum);
  }
  set(hostsHistoryAtom, newList);
});
