import { createContext, useContext, useReducer } from 'react';
import type { Group } from '~/types';
import { ipc } from '~/utils/ipc';

interface AppState {
  groups: Group[];
  selectedGroupName?: string;
}

type Action = Partial<AppState> | ((state: AppState) => AppState | undefined);

type DispatchFn = (action: Action) => void;

const GlobalStateContext = createContext<AppState>(initState());

const GlobalStateActionContext = createContext<DispatchFn>(() => {});

function reducer(state: AppState, action: Action): AppState {
  if (typeof action === 'function') {
    const newState = action(state);
    if (newState) {
      return { ...state, ...newState };
    }
    return state;
  }
  return { ...state, ...action };
}

function initState(): AppState {
  return {
    groups: [],
  };
}

export function GlobalContextProvider(props: React.PropsWithChildren) {
  const { children } = props;
  const [state, dispatch] = useReducer(reducer, null, initState);

  return (
    <GlobalStateContext.Provider value={state}>
      <GlobalStateActionContext.Provider value={dispatch}>
        {children}
      </GlobalStateActionContext.Provider>
    </GlobalStateContext.Provider>
  );
}

export function useGlobalState(): AppState {
  return useContext(GlobalStateContext);
}

export function useGlobalAction() {
  const setGlobalState = useContext(GlobalStateActionContext);

  const initGroups = async () => {
    const newState: Pick<AppState, 'groups' | 'selectedGroupName'> = {
      groups: [],
    };
    newState.groups = await ipc.getGroups();
    const systemGroup = newState.groups.find((profile) => profile.system);
    if (systemGroup) {
      newState.selectedGroupName = systemGroup.name;
    }
    setGlobalState(newState);
  };

  const setSelectedGroupName = (groupName: string) => {
    setGlobalState((state) => {
      const { selectedGroupName } = state;
      if (selectedGroupName === groupName) {
        return;
      }
      return { ...state, selectedGroupName: groupName };
    });
  };

  const addGroup = (name: string) => {
    setGlobalState((state): AppState => {
      const { groups } = state;
      const newGroup: Group = {
        name,
        text: '',
        list: [],
        system: false,
        enabled: false,
        textDraft: '',
      };
      return { groups: [...groups, newGroup], selectedGroupName: name };
    });
  };

  const setItemIp = (groupName: string, oldIp: string, newIp: string) => {
    if (newIp === oldIp) {
      return;
    }
    setGlobalState((state) => {
      const { groups } = state;
      const targetGroup = groups.find((group) => group.name === groupName);
      if (!targetGroup) {
        return;
      }
      for (const item of targetGroup.list) {
        if (item.ip === oldIp) {
          item.ip = newIp;
          return { ...state, groups: [...groups] };
        }
      }
    });
  };

  return {
    setGlobalState,
    initGroups,
    setSelectedGroupName,
    addGroup,
    setItemIp,
  };
}
