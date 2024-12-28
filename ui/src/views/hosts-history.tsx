import { format } from 'date-fns';
import { useAtom } from 'jotai';
import { Copy, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { hostsHistoryAtom } from '~/atom';
import { Button, CommonHeader, ScrollArea, Separator } from '~/components';
import type { HostHistory } from '~/types';
import { CodeEditor } from './code-editor';

export function HostsHistory() {
  const [hostsHistory, setHostsHistory] = useAtom(hostsHistoryAtom);
  const [active, setActive] = useState<HostHistory | undefined>(
    hostsHistory?.[0],
  );

  const handleRemove = () => {
    if (!active) {
      return;
    }
    let idx = hostsHistory.findIndex(
      (item) => item.createdAt === active.createdAt,
    );
    if (hostsHistory.length - 1 <= 0) {
      idx = -1;
    } else if (idx > hostsHistory.length - 2) {
      idx = 0;
    }
    const newHistory = hostsHistory.filter(
      (item) => item.createdAt !== active.createdAt,
    );
    setHostsHistory(newHistory);
    setActive(newHistory[idx]);
  };

  const handleCopy = () => {
    if (!active) {
      return;
    }
    navigator.clipboard.writeText(active.content);
  };

  return (
    <div className="h-[70vh] border border-border rounded flex">
      <ScrollArea className="h-full w-[200px] px-2.5 py-1.5">
        {hostsHistory.map((item) => {
          return (
            <Button
              key={item.createdAt}
              variant={
                active?.createdAt === item.createdAt ? 'default' : 'ghost'
              }
              className="w-full rounded-sm mt-1"
              onClick={() => setActive(item)}
            >
              <span>{format(item.createdAt, 'yyyy/MM/dd hh:kk:mm')}</span>
            </Button>
          );
        })}
      </ScrollArea>
      <Separator orientation="vertical" />
      <div className="min-w-[600px] max-w-[800px] w-[50vw]">
        <CommonHeader className="h-9 px-1 justify-end">
          <Button variant="ghost" size="sm" onClick={handleCopy}>
            <Copy />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleRemove}>
            <Trash2 className="size-3 text-red-500 cursor-pointer" />
          </Button>
        </CommonHeader>
        <CodeEditor
          style={{ height: 'calc(100% - 2.25rem)' }}
          value={active?.content}
          readOnly
        />
      </div>
    </div>
  );
}
