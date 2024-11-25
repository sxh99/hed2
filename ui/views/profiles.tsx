import { useState, useEffect } from 'react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '~/components/sidebar';
import { Input } from '~/components/index';
import type { Profile } from '~/types';
import { useAppContext } from '~/context';

export function Profiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState<string>('');
  const { selectedProfile, setSelectedProfile } = useAppContext();

  useEffect(() => {
    const mockData: Profile[] = new Array(20).fill(0).map((_, i) => {
      return {
        name: `profile-${i + 1}`,
      };
    });
    setProfiles(mockData);
  }, []);

  const displayProfiles = profiles.filter((profile) =>
    profile.name.includes(search),
  );

  return (
    <Sidebar>
      <SidebarHeader>
        <Input
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          placeholder="Search profile"
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {displayProfiles.map((profile) => (
            <SidebarMenuItem key={profile.name}>
              <SidebarMenuButton
                size="lg"
                onClick={() => setSelectedProfile(profile)}
                isActive={selectedProfile?.name === profile.name}
              >
                {profile.name}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
