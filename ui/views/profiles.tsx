import { useEffect, useState } from 'react';
import { Input, ScrollArea, Button } from '~/components';
import { useApp } from '~/context/app';
import type { Profile } from '~/types';
import { cn } from '~/utils/shadcn';

export function Profiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState<string>('');
  const { selectedProfile, setSelectedProfile } = useApp();

  useEffect(() => {
    const mockData: Profile[] = new Array(20).fill(0).map((_, i) => {
      return {
        id: i + 1,
        name: `profile-${i + 1}`,
        syetem: i === 0,
      };
    });
    setProfiles(mockData);
  }, []);

  return (
    <div className="h-full flex flex-col">
      <div className="h-14 p-2 border-b flex items-center">
        <Input placeholder="Search profile" />
      </div>
      <ScrollArea className="flex-1 px-3">
        {profiles.map((profile) => {
          return (
            <div key={profile.id} className="w-full h-12 pt-1">
              <Button
                onClick={() => setSelectedProfile(profile)}
                variant={
                  selectedProfile?.id === profile.id ? 'default' : 'ghost'
                }
                className={cn('w-full h-11 justify-start', {
                  'bg-blue-500 hover:bg-blue-500 text-primary-foreground hover:text-primary-foreground':
                    profile.syetem,
                })}
              >
                <span>{profile.name}</span>
              </Button>
            </div>
          );
        })}
      </ScrollArea>
    </div>
  );
}
