import type { Group as RawGroup } from 'hed2-parser';
export type { Item, Host } from 'hed2-parser';

export interface Group extends RawGroup {
  system: boolean;
  enabled: boolean;
}

export interface ItemFormValue {
  ip: string;
  hosts: string;
}

export interface EditorCfg {
  kind: string;
  showAll: boolean;
}

export interface ThemeCfg {
  display: string;
  className: string;
}

export interface HostHistory {
  createdAt: string;
  content: string;
}
