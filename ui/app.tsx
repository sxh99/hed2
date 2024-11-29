import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '~/components/resizable';
import { AppContextProvider } from '~/context/app';
import { ThemeProvider } from '~/context/theme';
import { AppHeader } from '~/views/app-header';
import { Profiles } from '~/views/profiles';
import { Editor } from '~/views/editor';

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
              <Editor />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ThemeProvider>
      </AppContextProvider>
    </div>
  );
}
