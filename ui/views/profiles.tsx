import { LoaderCircle, Search } from 'lucide-react';
import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { Button, Input, ScrollArea } from '~/components';
import { useAppState, useAppDispatch } from '~/context/app';
import type { Profile } from '~/types';

export function Profiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState<string>('');
  const deferredSearch = useDeferredValue(search);
  const { selectedProfile } = useAppState();
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mockInvoke = () => {
      return new Promise<Profile[]>((resolve) => {
        const mockData: Profile[] = new Array(20).fill(0).map((_, i) => {
          return {
            id: i + 1,
            name: `profile-${i + 1}`,
            system: i === 0,
            hostsInfo: {
              content: '',
              lines: [],
              list: [],
            },
          };
        });
        setTimeout(() => {
          resolve(mockData);
        }, 200);
      });
    };
    const fetchData = async () => {
      try {
        setLoading(true);
        const mockData = await mockInvoke();
        setProfiles(mockData);
        const systemProfile = mockData.find((profile) => profile.system);
        if (systemProfile) {
          dispatch({ selectedProfile: systemProfile });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!scrollAreaRef.current || !deferredSearch || !profiles.length) {
      return;
    }
    const profile = profiles.find((profile) =>
      profile.name.includes(deferredSearch),
    );
    if (!profile) {
      return;
    }
    const ele = scrollAreaRef.current.querySelector(
      `[data-id="${profile.id}"]`,
    );
    if (!ele) {
      return;
    }
    ele.scrollIntoView();
  }, [deferredSearch, profiles]);

  const calcVariant = (profile: Profile) => {
    if (selectedProfile?.id === profile.id) {
      return 'default';
    }
    if (deferredSearch && profile.name.includes(deferredSearch)) {
      return 'secondary';
    }
    return 'ghost';
  };

  return (
    <div className="h-full flex flex-col bg-neutral-50 dark:bg-background">
      <div className="h-14 px-3 flex items-center relative">
        <Search className="pointer-events-none absolute left-5 size-4 top-1/2 -translate-y-1/2 select-none opacity-50" />
        <Input
          className="bg-white dark:bg-black pl-8"
          placeholder="Search profile"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="sr-only">Search profile</span>
      </div>
      {loading ? (
        <div className="h-full flex justify-center items-center">
          <LoaderCircle className="animate-spin" />
        </div>
      ) : (
        <ScrollArea className="flex-1 px-3 pb-1 space-y-1" ref={scrollAreaRef}>
          {profiles.map((profile) => {
            return (
              <div
                className="w-full h-12"
                key={profile.id}
                data-id={profile.id}
              >
                <Button
                  onClick={() => dispatch({ selectedProfile: profile })}
                  variant={calcVariant(profile)}
                  className="w-full h-11 justify-start"
                >
                  <span>{profile.name}</span>
                </Button>
                <span className="sr-only">{profile.name}</span>
              </div>
            );
          })}
        </ScrollArea>
      )}
    </div>
  );
}
