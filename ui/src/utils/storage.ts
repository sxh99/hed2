import type { Group } from '~/types';

const DISABLED_GROUPS_KEY = 'disabled-groups';

export const storage = {
  getDisabledGroups(): Group[] {
    const str = localStorage.getItem(DISABLED_GROUPS_KEY);
    return str ? JSON.parse(str) : [];
  },

  setDisabledGroups(groups: Group[]) {
    localStorage.setItem(DISABLED_GROUPS_KEY, JSON.stringify(groups));
  },
};
