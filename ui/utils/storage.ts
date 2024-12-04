import type { Group } from '~/types';

const DISABLED_GROUPS_KEY = 'disabled-groups';

type StoreGroup = Pick<Group, 'name' | 'text' | 'list'>;

export const storage = {
  getDisabledGroups(): Group[] {
    const str = localStorage.getItem(DISABLED_GROUPS_KEY);
    if (!str) {
      return new Array(20).fill(0).map((_, i) => {
        return {
          name: `group-${i + 1}`,
          text: '',
          list: [],
          system: false,
          enabled: false,
          textDraft: '',
        };
      });
    }
    try {
      const storeGroups: StoreGroup[] = JSON.parse(str);
      return storeGroups.map((group) => {
        return {
          ...group,
          system: false,
          enabled: false,
          textDraft: group.text,
        };
      });
    } catch (error) {
      return [];
    }
  },
};
