import { type Group as RawGroup, SYSTEM_GROUP } from 'hed2-parser';
import { NOT_EXISTS_GROUP_NAME } from '~/consts';
import type { Group } from '~/types';
import { storage } from './storage';

export function checkGroupExists(groups: Group[], name: string) {
  if (name === SYSTEM_GROUP || name === NOT_EXISTS_GROUP_NAME) {
    return `\`${name}\`is forbidden to create`;
  }
  if (groups.some((group) => group.name === name)) {
    return `\`${name}\` already exists`;
  }
}

export function filterDisabledGroups(groups: Group[]) {
  return groups.filter((group) => !group.enabled);
}

export function mergeGroups(
  rawEnabledGroups: RawGroup[],
  disabledGroups: Group[],
) {
  const groups: Group[] = rawEnabledGroups.map((group) => {
    return { ...group, system: group.name === SYSTEM_GROUP, enabled: true };
  });
  const enabledGroupNames = new Set(groups.map((group) => group.name));
  let hasRepeatName = false;
  for (const group of disabledGroups) {
    if (enabledGroupNames.has(group.name)) {
      group.name = `${group.name}-disabled`;
      hasRepeatName = true;
    }
  }
  if (hasRepeatName) {
    storage.setDisabledGroups(disabledGroups);
  }
  return [...groups, ...disabledGroups];
}
