import type { Group } from '~/types';

const DISABLED_GROUPS_KEY = 'disabled-groups';

type StoreGroup = Pick<Group, 'name' | 'text' | 'list'>;

function getDisabledGroups(): Group[] {
  const str = localStorage.getItem(DISABLED_GROUPS_KEY);
  if (!str) {
    return [];
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
}

export const storage = {
  getDisabledGroups,
};
