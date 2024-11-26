import { createContext, useContext, useMemo, useState } from 'react';
import type { Profile } from '~/types';

interface AppState {
  selectedProfile?: Profile;
  setSelectedProfile: (v: Profile) => void;
}

const AppContext = createContext<AppState>({ setSelectedProfile: () => {} });

export function useApp(): AppState {
  return useContext(AppContext);
}

export function AppContextProvider(props: React.PropsWithChildren) {
  const { children } = props;
  const [selectedProfile, setSelectedProfile] = useState<Profile>();

  const contextValue = useMemo<AppState>(() => {
    return {
      selectedProfile,
      setSelectedProfile,
    };
  }, [selectedProfile]);

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}
