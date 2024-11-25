import { invoke } from '@tauri-apps/api/core';
import { useState } from 'react';
import { Button, Input } from '~/components';
import { SidebarProvider, SidebarTrigger } from '~/components/sidebar';
import { Profiles } from '~/views/profiles';
import { AppContextProvider } from '~/context';

export function App() {
  const [greetMsg, setGreetMsg] = useState('');
  const [name, setName] = useState('');

  async function greet() {
    const newGreetMsg: string = await invoke('greet', { name });
    setGreetMsg(newGreetMsg);
  }

  return (
    <div className="h-screen w-screen">
      <SidebarProvider>
        <AppContextProvider>
          <Profiles />
          <div>
            <SidebarTrigger />
            <div>
              <div>
                <Input
                  value={name}
                  onChange={(e) => setName(e.currentTarget.value)}
                  placeholder="Enter a name..."
                />
                <Button className="ml-2" onClick={greet}>
                  Greet
                </Button>
              </div>
              <div className="mt-2">{greetMsg}</div>
            </div>
          </div>
        </AppContextProvider>
      </SidebarProvider>
    </div>
  );
}
