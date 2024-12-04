import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '~/components/resizable';
import { GlobalContextProvider } from '~/context/global';
import { ThemeProvider } from '~/context/theme';
import { AppHeader } from '~/views/app-header';
import { Editor } from '~/views/editor';
import { Groups } from '~/views/groups';
import { TooltipProvider } from '~/components/tooltip';

export function App() {
  return (
    <div className="h-screen w-screen flex flex-col">
      <GlobalContextProvider>
        <ThemeProvider>
          <TooltipProvider>
            <AppHeader />
            <ResizablePanelGroup
              className="select-none"
              direction="horizontal"
              autoSaveId="main"
            >
              <ResizablePanel defaultSize={20} minSize={20} maxSize={30}>
                <Groups />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel className="flex flex-col" defaultSize={80}>
                <Editor />
              </ResizablePanel>
            </ResizablePanelGroup>
          </TooltipProvider>
        </ThemeProvider>
      </GlobalContextProvider>
    </div>
  );
}
