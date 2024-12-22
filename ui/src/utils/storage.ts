import { Theme } from '~/consts';
import type { Group } from '~/types';

const DISABLED_GROUPS_KEY = 'disabled-groups';
const THEME_KEY = 'theme';

export const storage = {
  getDisabledGroups(): Group[] {
    const str = localStorage.getItem(DISABLED_GROUPS_KEY);
    return str ? JSON.parse(str) : [];
  },

  setDisabledGroups(groups: Group[]) {
    localStorage.setItem(DISABLED_GROUPS_KEY, JSON.stringify(groups));
  },

  getTheme(): string {
    const str = localStorage.getItem(THEME_KEY);
    if (!str || !Object.values(Theme).includes(str as Theme)) {
      return Theme.System;
    }
    return str;
  },

  setTheme(theme: string) {
    localStorage.setItem(THEME_KEY, theme);
  },
};
