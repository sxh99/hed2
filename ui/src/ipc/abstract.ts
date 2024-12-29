export abstract class Ipc {
  abstract readSystemHosts(): Promise<string>;
  abstract writeSystemHosts(content: string): Promise<void>;
  abstract viewGitHub(): Promise<void>;
  abstract openHostsDir(): Promise<void>;
}
