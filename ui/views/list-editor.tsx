import { Check, Ban } from 'lucide-react';
import { ScrollArea, Badge } from '~/components';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/card';
import { ToggleGroup, ToggleGroupItem } from '~/components/toggle-group';
import { useGlobalState } from '~/context/global';
import type { Host } from '~/types';

export function ListEditor() {
  const { selectedGroup } = useGlobalState();

  if (!selectedGroup) {
    return null;
  }

  return (
    <ScrollArea className="flex-1 px-3 py-2">
      {selectedGroup.list.map((item) => {
        return (
          <Card className="mt-2" key={`${item.group}-${item.ip}`}>
            <CardHeader>
              <Ip
                ip={item.ip}
                group={
                  selectedGroup.name !== item.group ? item.group : undefined
                }
              />
            </CardHeader>
            <CardContent>
              <Hosts hosts={item.hosts} />
            </CardContent>
          </Card>
        );
      })}
    </ScrollArea>
  );
}

function Ip(props: { ip: string; group?: string }) {
  const { ip, group } = props;

  return (
    <CardTitle className="flex items-center gap-1">
      {group && <Badge className="text-[12px]">{group}</Badge>}
      <span>{ip}</span>
    </CardTitle>
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
          <ToggleGroupItem key={host.content} value={host.content}>
            <span className="select-text cursor-text">
              {host.content.repeat(5)}
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
