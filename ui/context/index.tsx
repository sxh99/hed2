import { createContext, useContext, useState, useMemo } from 'react';
import type { Profile } from '~/types';

interface IAppContext {
  selectedProfile?: Profile;
  setSelectedProfile: (v: Profile) => void;
}

const AppContext = createContext<IAppContext>({ setSelectedProfile: () => {} });

export function useAppContext(): IAppContext {
  return useContext(AppContext);
}

export function AppContextProvider(props: React.PropsWithChildren) {
  const { children } = props;
  const [selectedProfile, setSelectedProfile] = useState<Profile>();

  const contextValue = useMemo<IAppContext>(() => {
    return {
      selectedProfile,
      setSelectedProfile,
    };
  }, [selectedProfile]);

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}
