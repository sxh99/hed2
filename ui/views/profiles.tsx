import { LoaderCircle, Search } from 'lucide-react';
import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { Button, Input, ScrollArea } from '~/components';
import { useAppDispatch, useAppState } from '~/context/app';
import type { Profile } from '~/types';
import { ipc } from '~/utils/ipc';

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
            name: `profile-${i + 1}`,
            system: i === 0,
            hostsInfo: {
              text: '',
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
        const systemProfile = mockData.find((profile) => profile.system);
        if (systemProfile) {
          const text = await ipc.getSysHostsContent();
          const { list, lines } = await ipc.textToList(text);
          systemProfile.hostsInfo = {
            text,
            list,
            lines,
          };
          dispatch({ selectedProfile: systemProfile });
        }
        setProfiles(mockData);
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
      `[data-name="${profile.name}"]`,
    );
    if (!ele) {
      return;
    }
    ele.scrollIntoView({ block: 'nearest' });
  }, [deferredSearch, profiles]);

  const calcVariant = (profile: Profile) => {
    if (selectedProfile?.name === profile.name) {
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
        <ScrollArea className="flex-1 px-3 pb-1" ref={scrollAreaRef}>
          {profiles.map((profile) => {
            return (
              <Button
                key={profile.name}
                data-name={profile.name}
                onClick={() => dispatch({ selectedProfile: profile })}
                variant={calcVariant(profile)}
                className="w-full h-12 justify-start mt-1"
              >
                <span>{profile.name}</span>
                <span className="sr-only">{profile.name}</span>
              </Button>
            );
          })}
        </ScrollArea>
      )}
    </div>
  );
}
