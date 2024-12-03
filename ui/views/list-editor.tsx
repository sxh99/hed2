import { Check, Ban, FilePenLine } from 'lucide-react';
import { ScrollArea, Badge, Button } from '~/components';
import { ToggleGroup, ToggleGroupItem } from '~/components/toggle-group';
import { useGlobalState } from '~/context/global';
import type { Host, Item } from '~/types';

export function ListEditor() {
  const { selectedGroup } = useGlobalState();

  if (!selectedGroup) {
    return null;
  }

  return (
    <ScrollArea className="flex-1 px-3">
      {selectedGroup.list.map((item) => {
        return (
          <div
            className="border border-r-2 border-border/50 dark:border-border rounded-md mt-3 p-4 last:mb-3"
            key={`${item.group}-${item.ip}`}
          >
            <Title item={item} selectedGroupName={selectedGroup.name} />
            <Hosts hosts={item.hosts} />
          </div>
        );
      })}
    </ScrollArea>
  );
}

function Title(props: { item: Item; selectedGroupName: string }) {
  const { item, selectedGroupName } = props;

  return (
    <div className="flex justify-between pb-4 group">
      <div className="flex items-center gap-2">
        {selectedGroupName !== item.group && (
          <Badge className="leading-3">{item.group}</Badge>
        )}
        <span className="select-all cursor-text text-lg font-semibold">
          {item.ip}
        </span>
        <Button
          className="group-hover:visible invisible"
          variant="ghost"
          size="icon"
        >
          <FilePenLine />
        </Button>
      </div>
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
          <ToggleGroupItem key={host.content} value={host.content} size="lg">
            <span className="select-all cursor-text">
              {host.content.repeat(3)}
            </span>
            {host.enabled ? (
              <Check className="text-green-400" />
            ) : (
              <Ban className="text-slate-400" />
            )}
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
