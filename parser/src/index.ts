import { isIP } from 'is-ip';

type Line =
  | {
      type: 'valid';
      value: {
        ip: string;
        hosts: string[];
        enabled: boolean;
      };
    }
  | { type: 'empty' }
  | { type: 'group'; value: string }
  | { type: 'other'; value: string };

export interface Item {
  ip: string;
  hosts: Host[];
  group: string;
}

export interface Host {
  content: string;
  enabled: boolean;
}

export interface Group {
  name: string;
  text: string;
  list: Item[];
}

interface Range {
  start: number;
  end: number;
}

export const SYSTEM_GROUP = 'System';

function splitWhitespace(text: string): string[] {
  if (text.includes('\r\n')) {
    return text.replaceAll('\r\n', '\n').split('\n');
  }
  return text.split('\n');
}

export function isGroup(token: string) {
  return (
    token.length > 3 &&
    token.startsWith('#[') &&
    token.endsWith(']') &&
    token !== `#[${SYSTEM_GROUP}]`
  );
}

export function textToLines(text: string): {
  lines: Line[];
  rawLines: string[];
} {
  const lines: Line[] = [];
  const rawLines = splitWhitespace(text);

  for (const line of rawLines) {
    const tokens = line.split(' ').filter((s) => s.length);

    if (!tokens.length) {
      lines.push({ type: 'empty' });
      continue;
    }

    if (tokens.length === 1) {
      const token = tokens[0];
      if (isGroup(token)) {
        lines.push({
          type: 'group',
          value: token.slice(2, token.length - 1).trim(),
        });
        continue;
      }
    }

    if (tokens.length > 1) {
      const enabled = tokens[0] !== '#';
      const mayIp = tokens[enabled ? 0 : 1];

      if (isIP(mayIp)) {
        const hosts: string[] = [];
        const skip = enabled ? 1 : 2;

        for (const host of tokens.slice(skip)) {
          const sharpIdx = host.indexOf('#');
          if (sharpIdx !== -1) {
            const slice = host.slice(0, sharpIdx);
            if (slice.length) {
              hosts.push(slice);
            }
            break;
          }
          hosts.push(host);
        }

        if (hosts.length) {
          lines.push({
            type: 'valid',
            value: {
              ip: mayIp,
              hosts,
              enabled,
            },
          });
          continue;
        }
      }
    }

    lines.push({ type: 'other', value: line });
  }

  return { lines, rawLines };
}

export function linesToList(lines: Line[], specifiedGroup?: string): Item[] {
  const tmpMap: Map<string, Item> = new Map();
  const itemMap: Map<string, Item> = specifiedGroup ? tmpMap : new Map();
  const groupSet: Set<string> = new Set();
  let currentGroup = specifiedGroup;

  for (const line of lines) {
    if (line.type === 'valid') {
      const { ip, hosts: hostStrs, enabled } = line.value;

      const hosts: Host[] = hostStrs.map((content) => ({ content, enabled }));
      const key = currentGroup ? `${currentGroup}_${ip}` : ip;

      const item = tmpMap.get(key);
      if (item) {
        item.hosts.push(...hosts);
      } else {
        tmpMap.set(key, { ip, hosts, group: currentGroup ?? SYSTEM_GROUP });
      }
    }
    if (!specifiedGroup && line.type === 'group') {
      const { value: group } = line;

      if (currentGroup && currentGroup !== group) {
        continue;
      }

      if (tmpMap.size) {
        for (const [k, v] of tmpMap) {
          const item = itemMap.get(k);
          if (item) {
            item.hosts.push(...v.hosts);
          } else {
            itemMap.set(k, v);
          }
        }
        tmpMap.clear();
      }

      if (currentGroup === group) {
        currentGroup = undefined;
        groupSet.add(group);
      } else {
        currentGroup = groupSet.has(group) ? undefined : group;
      }
    }
  }

  if (tmpMap.size && !specifiedGroup) {
    for (const [_, v] of tmpMap) {
      v.group = SYSTEM_GROUP;
      const item = itemMap.get(v.ip);
      if (item) {
        item.hosts.push(...v.hosts);
      } else {
        itemMap.set(v.ip, v);
      }
    }
  }

  for (const item of itemMap.values()) {
    const set: Set<string> = new Set();
    const dedup: Host[] = [];
    for (const host of item.hosts) {
      if (!set.has(host.content)) {
        dedup.push(host);
        set.add(host.content);
      }
    }
    item.hosts = dedup;
  }

  return [...itemMap.values()];
}

export function textToGroups(text: string): Group[] {
  const { lines, rawLines } = textToLines(text);
  const rangeMap: Map<string, Range> = new Map();
  const currentRange: Range = { start: 0, end: 0 };
  let currentGroup: string | null = null;

  lines.forEach((line, idx) => {
    if (line.type !== 'group') {
      return;
    }

    const { value: group } = line;

    if (currentGroup) {
      if (currentGroup === group) {
        currentGroup = null;
        currentRange.end = idx;
        if (!rangeMap.has(group)) {
          rangeMap.set(group, { ...currentRange });
        }
      }
    } else {
      currentGroup = group;
      currentRange.start = idx;
    }
  });

  const groupMap: Map<string, Group> = new Map();

  for (const [group, range] of rangeMap) {
    const groupLines = rawLines.slice(range.start + 1, range.end);
    groupMap.set(group, { name: group, text: groupLines.join('\n'), list: [] });
  }

  const systemGroup: Group = {
    name: SYSTEM_GROUP,
    text,
    list: linesToList(lines),
  };

  for (const item of systemGroup.list) {
    const group = groupMap.get(item.group);
    if (group) {
      group.list.push(item);
    }
  }

  return [systemGroup, ...groupMap.values()];
}

function chunk(hosts: Host[], count: number): Host[][] {
  const result: Host[][] = [];
  let currentChunk: Host[] = [];

  for (const host of hosts) {
    if (currentChunk.length >= count) {
      result.push([...currentChunk]);
      currentChunk = [];
    }
    currentChunk.push(host);
  }

  if (currentChunk.length) {
    result.push(currentChunk);
  }

  return result;
}

function hostsChunk(hosts: Host[], ip: string): Line[] {
  const lines: Line[] = [];

  const enabledHosts = [];
  const disabledHosts = [];

  for (const host of hosts) {
    if (host.enabled) {
      enabledHosts.push(host);
    } else {
      disabledHosts.push(host);
    }
  }

  const mapFn = (chunk: Host[], enabled: boolean): Line => {
    return {
      type: 'valid',
      value: { ip, hosts: chunk.map((v) => v.content), enabled },
    };
  };

  lines.push(...chunk(enabledHosts, 10).map((v) => mapFn(v, true)));
  lines.push(...chunk(disabledHosts, 10).map((v) => mapFn(v, false)));

  return lines;
}

interface listToLinesOptions {
  groupNameMap?: Record<string, string>;
}

export function listToLines(
  list: Item[],
  oldLines: Line[],
  options?: listToLinesOptions,
): Line[] {
  const { groupNameMap = {} } = options ?? {};

  const lines: Line[] = [];
  const sysHostsMap: Map<string, Host[]> = new Map();
  const otherItemMap: Map<string, Item[]> = new Map();

  for (const item of list) {
    if (item.group === SYSTEM_GROUP) {
      const hosts = sysHostsMap.get(item.ip);
      if (hosts) {
        hosts.push(...item.hosts);
      } else {
        sysHostsMap.set(item.ip, item.hosts);
      }
    } else {
      const groupName = groupNameMap[item.group] ?? item.group;
      const items = otherItemMap.get(groupName);
      if (items) {
        items.push(item);
      } else {
        otherItemMap.set(groupName, [item]);
      }
    }
  }

  let currentGroup: string | null = null;

  const pushItemToLines = (items: Item[], group: string) => {
    lines.push({ type: 'group', value: group });
    let first = true;
    for (const item of items) {
      if (!first) {
        lines.push({ type: 'empty' });
      }
      lines.push(...hostsChunk(item.hosts, item.ip));
      first = false;
    }
    lines.push({ type: 'group', value: group });
  };

  for (const line of oldLines) {
    if (line.type === 'valid') {
      if (currentGroup) {
        continue;
      }

      const { ip } = line.value;

      const hosts = sysHostsMap.get(ip);
      if (hosts) {
        if (!hosts.length) {
          lines.push({ type: 'empty' });
          continue;
        }
        lines.push(...hostsChunk(hosts, ip));
        sysHostsMap.set(ip, []);
      } else {
        lines.push({ type: 'empty' });
      }
    } else if (line.type === 'group') {
      const { value: group } = line;

      if (currentGroup) {
        if (currentGroup === group) {
          currentGroup = null;
          const items = otherItemMap.get(group);
          if (!items?.length) {
            continue;
          }
          const newGroupName = groupNameMap[group];
          pushItemToLines(items, newGroupName ?? group);
          otherItemMap.set(group, []);
        }
      } else {
        currentGroup = group;
      }
    } else {
      lines.push(line);
    }
  }

  for (const [ip, hosts] of sysHostsMap) {
    if (!hosts.length) {
      continue;
    }
    lines.push({ type: 'empty' });
    lines.push(...hostsChunk(hosts, ip));
  }

  for (const [group, items] of otherItemMap) {
    if (!items.length) {
      continue;
    }
    lines.push({ type: 'empty' });
    pushItemToLines(items, group);
  }

  return lines;
}

export function linesToText(lines: Line[]): string {
  const textLines: string[] = [];
  let isPreEmpty = lines.length > 0 && lines[0].type === 'empty';

  for (const line of lines) {
    if (line.type === 'valid') {
      const { ip, hosts, enabled } = line.value;
      const vs: string[] = [];
      if (!enabled) {
        vs.push('#');
      }
      vs.push(ip);
      vs.push(...hosts);
      textLines.push(vs.join(' '));
    }
    if (line.type === 'group') {
      textLines.push(`#[${line.value}]`);
    }
    if (line.type === 'other') {
      const s = line.value.trim();
      if (s === '#[]' || s === `#[${SYSTEM_GROUP}]`) {
        isPreEmpty = true;
        continue;
      }
      textLines.push(s);
    }
    if (line.type === 'empty') {
      if (!isPreEmpty) {
        textLines.push('');
      }
    }
    isPreEmpty = line.type === 'empty';
  }

  if (!isPreEmpty) {
    textLines.push('');
  }

  return textLines.join('\n');
}

export function listToText(
  list: Item[],
  oldText: string,
  options?: listToLinesOptions & {
    specifiedGroup?: string;
  },
): string {
  const { specifiedGroup, ...restOptions } = options ?? {};
  const { lines } = textToLines(oldText);
  if (specifiedGroup) {
    lines.unshift({ type: 'group', value: specifiedGroup });
    lines.push({ type: 'group', value: specifiedGroup });
  }
  let newLines = listToLines(list, lines, restOptions);
  if (specifiedGroup) {
    newLines = newLines.filter((line) => line.type !== 'group');
  }
  return linesToText(newLines);
}

export function textToList(text: string, group?: string): Item[] {
  const { lines } = textToLines(text);
  return linesToList(lines, group);
}

export function replaceGroupText(
  group: string,
  text: string,
  fullText: string,
): string {
  const { lines, rawLines } = textToLines(fullText);
  const range: Range = { start: -1, end: -1 };

  lines.forEach((line, idx) => {
    if (line.type !== 'group' || line.value !== group) {
      return;
    }
    if (range.start === -1) {
      range.start = idx;
      return;
    }
    if (range.end === -1) {
      range.end = idx;
    }
  });

  if (range.start !== -1 && range.end !== -1) {
    rawLines.splice(
      range.start + 1,
      range.end - range.start - 1,
      ...splitWhitespace(text),
    );
  }

  return rawLines.join('\n');
}

function format(text: string): string {
  const { lines } = textToLines(text);
  return linesToText(lines);
}

export const parser = {
  textToGroups,
  listToText,
  textToList,
  replaceGroupText,
  format,
};

export { isIP };
