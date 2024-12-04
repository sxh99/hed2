import { useState } from 'react';
import { Check, Ban, FilePenLine, EllipsisVertical } from 'lucide-react';
import { ScrollArea, Badge, Button } from '~/components';
import { ToggleGroup, ToggleGroupItem } from '~/components/toggle-group';
import { useGlobalState, useGlobalAction } from '~/context/global';
import type { Host, Item } from '~/types';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '~/components/dropdown-menu';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from '~/components/context-menu';
import { AdvancedInput } from '~/components/advanced-input';
import { ipc } from '~/utils/ipc';

export function ListEditor() {
  const { selectedGroupName, groups } = useGlobalState();

  const group = groups.find((group) => group.name === selectedGroupName);

  if (!group) {
    return null;
  }

  return (
    <ScrollArea className="flex-1 px-3">
      {group.list.map((item) => {
        return (
          <div
            className="border border-r border-border/50 dark:border-border rounded-md mt-3 p-4 last:mb-3"
            key={`${item.group}-${item.ip}`}
          >
            <Title item={item} groupName={group.name} />
            <Hosts hosts={item.hosts} />
          </div>
        );
      })}
    </ScrollArea>
  );
}

function Title(props: {
  item: Item;
  groupName: string;
}) {
  const { item, groupName } = props;

  const [showIpInput, setShowIpInput] = useState(false);
  const { setItemIp } = useGlobalAction();

  const handleEditIp = () => {
    setShowIpInput(true);
  };

  const handleEditIpCancel = () => {
    setShowIpInput(false);
  };

  const handleEditIpOk = (newIp: string) => {
    if (newIp && newIp !== item.ip) {
      setItemIp(groupName, item.ip, newIp);
    }
    setShowIpInput(false);
  };

  const handleIpValidate = async (newIp: string) => {
    if (!newIp || newIp === item.ip) {
      return;
    }
    const isIp = await ipc.isIp(newIp);
    if (!isIp) {
      return `\`${newIp}\` is not a valid ip`;
    }
  };

  return (
    <div className="flex justify-between pb-4 group">
      <div className="flex items-center gap-2">
        {groupName !== item.group && (
          <Badge className="leading-3">{item.group}</Badge>
        )}
        {showIpInput ? (
          <AdvancedInput
            className="w-[320px]"
            name="newIp"
            placeholder={item.ip}
            initValue={item.ip}
            onOk={handleEditIpOk}
            onCancel={handleEditIpCancel}
            onValidate={handleIpValidate}
            initSelectAll
          />
        ) : (
          <span className="select-text cursor-text text-lg font-semibold">
            {item.ip}
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
          <DropdownMenuItem>Foo</DropdownMenuItem>
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
