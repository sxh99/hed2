import { type ChildProcessWithoutNullStreams, spawn } from 'node:child_process';
import path from 'node:path';
import kill from 'tree-kill';

interface Cmd {
  name: string;
  runner: string;
  args: string[];
  closed: boolean;
  cp?: ChildProcessWithoutNullStreams;
  cwd?: string;
}

function main() {
  const cwd = process.cwd();
  const cmds: Cmd[] = [
    {
      name: 'tailwindcss',
      runner: 'node',
      args: ['--run', 'tailwindcss'],
      closed: false,
      cwd: path.join(cwd, 'ui'),
    },
    {
      name: 'vite',
      runner: 'node',
      args: ['--run', 'dev'],
      closed: false,
      cwd: path.join(cwd, 'ui'),
    },
    {
      name: 'tauri',
      runner: 'cargo',
      args: ['run'],
      closed: false,
      cwd: undefined,
    },
  ];

  const checkAndExit = () => {
    if (cmds.every((cmd) => cmd.closed)) {
      process.exit(0);
    }
  };

  const killAll = () => {
    for (const cmd of cmds) {
      if (cmd.closed) {
        continue;
      }
      if (cmd.cp?.pid) {
        kill(cmd.cp.pid);
      }
    }
  };

  for (const cmd of cmds) {
    const cp = spawn(cmd.runner, cmd.args, { cwd: cmd.cwd });

    cp.stdout.on('data', (data) => {
      console.log(data.toString());
    });

    cp.stderr.on('data', (data) => {
      console.error(data.toString());
    });

    cp.on('error', (err) => {
      cmd.closed = true;
      console.error(err);
      checkAndExit();
    });

    cp.on('spawn', () => {
      cmd.cp = cp;
    });

    cp.on('close', () => {
      cmd.closed = true;
      if (cmd.name === 'tauri') {
        killAll();
      }
      checkAndExit();
    });
  }

  process.on('SIGINT', () => {
    killAll();
  });
}

main();
