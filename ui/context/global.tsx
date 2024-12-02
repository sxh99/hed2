import { createContext, useContext, useReducer } from 'react';
import type { Group } from '~/types';

interface AppState {
  selectedGroup?: Group;
}

type DispatchFn = (state: Partial<AppState>) => void;

interface GlobalStateAction {
  setGlobalState: DispatchFn;
}

const GlobalStateContext = createContext<AppState>({});

const GlobalStateActionContext = createContext<DispatchFn>(() => {});

export function useGlobalState(): AppState {
  return useContext(GlobalStateContext);
}

export function useGlobalStateAction(): GlobalStateAction {
  const setGlobalState = useContext(GlobalStateActionContext);

  return { setGlobalState };
}

function reducer(state: AppState, action: Partial<AppState>): AppState {
  return { ...state, ...action };
}

export function GlobalContextProvider(props: React.PropsWithChildren) {
  const { children } = props;
  const [state, dispatch] = useReducer(reducer, {});

  return (
    <GlobalStateContext.Provider value={state}>
      <GlobalStateActionContext.Provider value={dispatch}>
        {children}
      </GlobalStateActionContext.Provider>
    </GlobalStateContext.Provider>
  );
}
