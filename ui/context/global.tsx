import { createContext, useContext, useReducer } from 'react';
import type { Group } from '~/types';
import { ipc } from '~/utils/ipc';

interface AppState {
  groups: Group[];
  selectedGroup?: Group;
}

type Action = Partial<AppState> | ((state: AppState) => AppState);

type DispatchFn = (action: Action) => void;

const GlobalStateContext = createContext<AppState>(initState());

const GlobalStateActionContext = createContext<DispatchFn>(() => {});

export function useGlobalState(): AppState {
  return useContext(GlobalStateContext);
}

export function useGlobalAction() {
  const setGlobalState = useContext(GlobalStateActionContext);

  const initGroups = async () => {
    const newState: Pick<AppState, 'groups' | 'selectedGroup'> = { groups: [] };
    newState.groups = await ipc.getGroups();
    const systemGroup = newState.groups.find((profile) => profile.system);
    if (systemGroup) {
      newState.selectedGroup = systemGroup;
    }
    setGlobalState(newState);
  };

  const setSelectedGroup = (selectedGroup: Group) => {
    setGlobalState({ selectedGroup });
  };

  const addGroup = (name: string) => {
    setGlobalState((state) => {
      const { groups } = state;
      const newGroup: Group = {
        name,
        text: '',
        list: [],
        system: false,
        enabled: false,
        textDraft: '',
      };
      return { groups: [...groups, newGroup], selectedGroup: newGroup };
    });
  };

  return { setGlobalState, initGroups, setSelectedGroup, addGroup };
}

function reducer(state: AppState, action: Action): AppState {
  if (typeof action === 'function') {
    const newState = action(state);
    return { ...state, ...newState };
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
