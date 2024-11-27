export interface Profile {
  id: number;
  name: string;
  system?: boolean;
  hostsInfo: HostsInfo;
}

export interface HostsInfo {
  content: string;
  lines: Line[];
  list: Item[];
}

export interface Line {
  type: 'valid' | 'comment' | 'empty' | 'other';
  content?: string;
  ip?: string;
  hosts?: string[];
  comment?: string;
  enabled?: bool;
}

export interface Item {
  id: number;
  ip: string;
  hosts: Host[];
}

export interface Host {
  id: number;
  content: string;
  enabled: boolean;
}
