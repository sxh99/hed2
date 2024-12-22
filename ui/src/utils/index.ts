import { DARK_MODE_MEDIA } from '~/consts';
import type { Group } from '~/types';

export function checkGroupExists(groups: Group[], name: string) {
  if (groups.some((group) => group.name === name)) {
    return `\`${name}\` already exists`;
  }
}

export function isSystemDark() {
  return window.matchMedia(DARK_MODE_MEDIA).matches;
}
