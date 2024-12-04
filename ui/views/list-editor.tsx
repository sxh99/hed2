import { useAtomValue, useSetAtom } from 'jotai';
import {
  Ban,
  Check,
  EllipsisVertical,
  FilePenLine,
  Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { currentGroupAtom, setItemIpAtom } from '~/atom';
import { Badge, Button, ScrollArea } from '~/components';
import { AdvancedInput } from '~/components/advanced-input';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '~/components/context-menu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/dropdown-menu';
import { ToggleGroup, ToggleGroupItem } from '~/components/toggle-group';
import type { Host } from '~/types';
import { ipc } from '~/utils/ipc';
import { cn } from '~/utils/cn';

const isMac = navigator.userAgent.includes('Mac');

export function ListEditor() {
  const currentGroup = useAtomValue(currentGroupAtom);

  if (!currentGroup) {
    return null;
  }

  return (
    <ScrollArea className="flex-1 px-3">
      {currentGroup.list.map((item) => {
        return (
          <div
            className={cn(
              'border border-border/50 dark:border-border rounded-md mt-3 p-4 last:mb-3',
              isMac && 'border-r-2',
            )}
            key={`${item.group}-${item.ip}`}
          >
            <Title
              ip={item.ip}
              group={item.group}
              isCurrentSystemGroup={currentGroup.system}
            />
            <Hosts hosts={item.hosts} />
          </div>
        );
      })}
    </ScrollArea>
  );
}

function Title(props: {
  ip: string;
  group: string;
  isCurrentSystemGroup: boolean;
}) {
  const { ip, group, isCurrentSystemGroup } = props;

  const [showIpInput, setShowIpInput] = useState(false);
  const setItemIp = useSetAtom(setItemIpAtom);

  const handleEditIp = () => {
    setShowIpInput(true);
  };

  const handleEditIpCancel = () => {
    setShowIpInput(false);
  };

  const handleEditIpOk = (newIp: string) => {
    if (newIp && newIp !== ip) {
      setItemIp(ip, newIp);
    }
    setShowIpInput(false);
  };

  const handleIpValidate = async (newIp: string) => {
    if (!newIp || newIp === ip) {
      return;
    }
    const isIp = await ipc.isIp(newIp);
    if (!isIp) {
      return `\`${newIp}\` is not a valid ip`;
    }
  };

  const showBedge = isCurrentSystemGroup && group !== 'System';

  return (
    <div className="flex justify-between pb-4 group">
      <div className="flex items-center gap-2">
        {showBedge && <Badge className="leading-3">{group}</Badge>}
        {showIpInput ? (
          <AdvancedInput
            className="w-[320px]"
            name="newIp"
            placeholder={ip}
            initValue={ip}
            onOk={handleEditIpOk}
            onCancel={handleEditIpCancel}
            onValidate={handleIpValidate}
            initSelectAll
          />
        ) : (
          <span className="select-text cursor-text text-lg font-semibold">
            {ip}
          </span>
        )}
        {!showIpInput && (
          <Button
            className="group-hover:visible invisible"
            variant="ghost"
            size="icon"
            onClick={handleEditIp}
          >
            <FilePenLine />
          </Button>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <EllipsisVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem className="text-red-500 focus:text-red-500">
            <Trash2 />
            Delete
          </DropdownMenuItem>
          <DropdownMenuItem>Bar</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function Hosts(props: { hosts: Host[] }) {
  const { hosts } = props;

  const enabledHosts = hosts
    .filter((host) => host.enabled)
    .map((host) => host.content);

  return (
    <ToggleGroup
      className="flex-wrap justify-start gap-2"
      type="multiple"
      variant="outline"
      value={enabledHosts}
    >
      {hosts.map((host) => {
        return (
          <ToggleGroupItem
            key={host.content}
            value={host.content}
            size="lg"
            className="px-0"
          >
            <ContextMenu>
              <ContextMenuTrigger asChild>
                <div className="flex items-center gap-1 h-full w-full px-2.5">
                  <span className="select-text cursor-text">
                    {host.content.repeat(3)}
                  </span>
                  {host.enabled ? (
                    <Check className="text-green-400" />
                  ) : (
                    <Ban className="text-slate-400" />
                  )}
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem>Foo</ContextMenuItem>
                <ContextMenuItem>Bar</ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
