declare const PKG_NAME: string;
declare const PKG_VERSION: string;
interface Window {
  electronAPI: {
    readSystemHosts: () => Promise<string>;
    writeSystemHosts: (content: string) => Promise<void>;
    viewGithub: () => void;
    openHostsDir: () => void;
    setTheme: (theme: string) => void;
  };
}
