import { createContext, useContext, useReducer } from 'react';
import type { Profile } from '~/types';

interface AppState {
  selectedProfile?: Profile;
}

type Dispatch = (state: Partial<AppState>) => void;

const AppStateContext = createContext<AppState>({});
const AppDispatchContext = createContext<Dispatch>(() => {});

export function useAppState(): AppState {
  return useContext(AppStateContext);
}

export function useAppDispatch(): Dispatch {
  return useContext(AppDispatchContext);
}

function reducer(state: AppState, action: Partial<AppState>): AppState {
  return { ...state, ...action };
}

export function AppContextProvider(props: React.PropsWithChildren) {
  const { children } = props;
  const [state, dispatch] = useReducer(reducer, {});

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
}
