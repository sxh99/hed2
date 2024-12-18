import type { Group } from '~/types';

export function checkGroupExists(groups: Group[], name: string) {
  if (groups.some((group) => group.name === name)) {
    return `\`${name}\` already exists`;
  }
}
