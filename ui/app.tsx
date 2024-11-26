import { AppContextProvider } from '~/context/app';
import { ThemeProvider } from '~/context/theme';
import { AppHeader } from '~/views/app-header';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '~/components/resizable';
import { Profiles } from '~/views/profiles';

export function App() {
  return (
    <div className="h-screen w-screen flex flex-col">
      <AppContextProvider>
        <ThemeProvider>
          <AppHeader />
          <ResizablePanelGroup direction="horizontal" autoSaveId="main">
            <ResizablePanel defaultSize={20} minSize={20} maxSize={30}>
              <Profiles />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={80}>
              <div className="w-full h-14 flex justify-between items-center px-4 py-1 border-b border-border/40 bg-background/95 dark:border-border">
                todo
              </div>
              <div>todo</div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ThemeProvider>
      </AppContextProvider>
    </div>
  );
}
