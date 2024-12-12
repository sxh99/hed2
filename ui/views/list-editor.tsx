import { type PrimitiveAtom, useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  Ban,
  Check,
  Copy,
  EllipsisVertical,
  FilePenLine,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  currentGroupAtom,
  itemAtomsAtom,
  removeSameGroupItemAtom,
  setSameGroupItemAtom,
} from '~/atom';
import {
  Badge,
  Button,
  CommonHeader,
  InputWithValidate,
  ScrollArea,
  SearchInput,
} from '~/components';
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
import { SYSTEM_GROUP_NAME } from '~/consts';
import { useBoolean, useSearch } from '~/hooks';
import type { Item } from '~/types';
import { cn } from '~/utils/cn';
import { ipc } from '~/utils/ipc';
import { EditorKindToggle } from './editor-kind-toggle';

export function ListEditor(props: { className?: string }) {
  const { className } = props;

  const search = useSearch();

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <CommonHeader>
        <EditorKindToggle />
        <SearchInput
          className="w-1/2"
          name="searchItem"
          placeholder="Search ip or host..."
          value={search.value}
          onValueChange={search.setValue}
        />
        <Button variant="outline" size="icon">
          <Plus />
        </Button>
      </CommonHeader>
      <ScrollArea className="flex-1 px-3">
        <List search={search.deferredValue} />
      </ScrollArea>
    </div>
  );
}

function List(props: { search: string }) {
  const { search } = props;
  const [itemAtoms, setItems] = useAtom(itemAtomsAtom);

  const handleItemRemove = (itemAtom: PrimitiveAtom<Item>) => {
    setItems({ type: 'remove', atom: itemAtom });
  };

  return itemAtoms.map((itemAtom) => (
    <ListItem
      key={`${itemAtom}`}
      itemAtom={itemAtom}
      onItemRemove={handleItemRemove}
      search={search}
    />
  ));
}

function ListItem(props: {
  itemAtom: PrimitiveAtom<Item>;
  onItemRemove: (itamAtom: PrimitiveAtom<Item>) => void;
  search: string;
}) {
  const { itemAtom, onItemRemove, search } = props;

  const [item, setItem] = useAtom(itemAtom);
  const setSameGroupItem = useSetAtom(setSameGroupItemAtom);
  const removeSameGroupItem = useSetAtom(removeSameGroupItemAtom);

  if (
    !(
      item.ip.includes(search) ||
      item.hosts.some((item) => item.content.includes(search))
    )
  ) {
    return null;
  }

  const handleItemChange = (v: Partial<Item>) => {
    const newItem = { ...item, ...v };
    setItem(newItem);
    setSameGroupItem(item.ip, newItem);
  };

  const handleItemRemove = () => {
    onItemRemove(itemAtom);
    removeSameGroupItem(item);
  };

  return (
    <div className="border border-border/50 dark:border-border rounded-md mt-3 p-4 last:mb-3">
      <Title
        ip={item.ip}
        group={item.group}
        onItemChagne={handleItemChange}
        onItemRemove={handleItemRemove}
      />
      <Hosts hosts={item.hosts} onItemChagne={handleItemChange} />
    </div>
  );
}

function Title(
  props: Pick<Item, 'ip' | 'group'> & {
    onItemChagne: (v: Partial<Item>) => void;
    onItemRemove: () => void;
  },
) {
  const { ip, group, onItemChagne, onItemRemove } = props;

  const currentGroup = useAtomValue(currentGroupAtom);
  const ipInputVisible = useBoolean();

  const handleEditIpOk = (newIp: string) => {
    if (newIp !== ip) {
      onItemChagne({ ip: newIp });
    }
    ipInputVisible.off();
  };

  const handleIpValidate = async (newIp: string) => {
    if (newIp === ip) {
      return;
    }
    const isIp = await ipc.isIp(newIp);
    if (!isIp) {
      return `\`${newIp}\` is not a valid ip`;
    }
  };

  const showBedge = currentGroup.system && group !== SYSTEM_GROUP_NAME;

  return (
    <div className="flex justify-between pb-4 group">
      <div className="flex items-center gap-2">
        {showBedge && <Badge className="leading-3">{group}</Badge>}
        {ipInputVisible.value ? (
          <InputWithValidate
            className="w-[320px]"
            name="newIp"
            placeholder={ip}
            initValue={ip}
            onOk={handleEditIpOk}
            onCancel={ipInputVisible.off}
            onValidate={handleIpValidate}
            selectAllWhenMounted
          />
        ) : (
          <span className="select-text cursor-text text-lg font-semibold">
            {ip}
          </span>
        )}
        {!ipInputVisible.value && (
          <Button
            className="group-hover:visible invisible"
            variant="ghost"
            size="icon"
            onClick={ipInputVisible.on}
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
          <DropdownMenuItem destructive onClick={onItemRemove}>
            <Trash2 />
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function Hosts(
  props: Pick<Item, 'hosts'> & {
    onItemChagne: (v: Partial<Item>) => void;
  },
) {
  const { hosts, onItemChagne } = props;

  const newHostInputVisible = useBoolean();

  const enabledHosts = hosts
    .filter((host) => host.enabled)
    .map((host) => host.content);

  const handleEnabledHostsChange = (enabledContents: string[]) => {
    onItemChagne({
      hosts: hosts.map((host) => {
        return { ...host, enabled: enabledContents.includes(host.content) };
      }),
    });
  };

  const handleHostRemove = (v: string) => {
    onItemChagne({ hosts: hosts.filter((host) => host.content !== v) });
  };

  const handleNewHostOk = (v: string) => {
    onItemChagne({ hosts: [...hosts, { content: v, enabled: false }] });
    newHostInputVisible.off();
  };

  const handleNewHostValidate = (v: string) => {
    if (hosts.some((host) => host.content === v)) {
      return `\`${v}\` is already exists`;
    }
  };

  const handleEditHostOk = (oldContent: string, newContent: string) => {
    onItemChagne({
      hosts: hosts.map((host) => {
        return host.content === oldContent
          ? { ...host, content: newContent }
          : host;
      }),
    });
  };

  return (
    <ToggleGroup
      className="flex-wrap justify-start gap-2"
      type="multiple"
      variant="outline"
      value={enabledHosts}
      onValueChange={handleEnabledHostsChange}
    >
      {hosts.map((host) => (
        <Host
          key={host.content}
          host={host}
          onEditOk={handleEditHostOk}
          onEditValidate={handleNewHostValidate}
          onHostRemove={handleHostRemove}
        />
      ))}
      {newHostInputVisible.value ? (
        <InputWithValidate
          className="w-[300px]"
          name="newHost"
          placeholder="new host"
          onOk={handleNewHostOk}
          onValidate={handleNewHostValidate}
          onCancel={newHostInputVisible.off}
        />
      ) : (
        <Button
          variant="outline"
          size="icon"
          className="h-10 w-10"
          onClick={newHostInputVisible.on}
        >
          <Plus />
        </Button>
      )}
    </ToggleGroup>
  );
}

function Host(props: {
  host: Item['hosts'][number];
  onEditOk: (ov: string, nv: string) => void;
  onEditValidate: (v: string) => string | undefined;
  onHostRemove: (v: string) => void;
}) {
  const { host, onEditOk, onEditValidate, onHostRemove } = props;

  const editHostInputVisible = useBoolean();

  const handleEditHostOk = (v: string) => {
    if (v !== host.content) {
      onEditOk(host.content, v);
    }
    editHostInputVisible.off();
  };

  const handleEditHostValidate = (v: string) => {
    if (v === host.content) {
      return;
    }
    return onEditValidate(v);
  };

  if (editHostInputVisible.value) {
    return (
      <InputWithValidate
        className="w-[300px]"
        name="editHost"
        placeholder={host.content}
        initValue={host.content}
        onOk={handleEditHostOk}
        onCancel={editHostInputVisible.off}
        onValidate={handleEditHostValidate}
        selectAllWhenMounted
      />
    );
  }

  return (
    <ToggleGroupItem value={host.content} size="lg" className="px-0">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div className="flex items-center gap-2 h-full w-full px-2.5">
            <span>{host.content}</span>
            {host.enabled ? (
              <Check className="text-green-400" />
            ) : (
              <Ban className="text-slate-400" />
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              editHostInputVisible.on();
            }}
          >
            <FilePenLine />
            Edit
          </ContextMenuItem>
          <ContextMenuItem
            onClick={(e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(host.content);
            }}
          >
            <Copy />
            Copy
          </ContextMenuItem>
          <ContextMenuItem
            destructive
            onClick={(e) => {
              e.stopPropagation();
              onHostRemove(host.content);
            }}
          >
            <Trash2 />
            Remove
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    </ToggleGroupItem>
  );
}
