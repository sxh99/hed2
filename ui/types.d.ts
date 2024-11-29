export interface Profile {
  // id: number;
  name: string;
  system?: boolean;
  hostsInfo: HostsInfo;
}

export interface HostsInfo {
  text: string;
  lines: Line[];
  list: Item[];
}

export interface Item {
  ip: string;
  hosts: Host[];
}

export interface Host {
  content: string;
  enabled: boolean;
}
