import { spawn } from 'node:child_process';

function main() {
  const cmds = [
    {
      name: 'tailwindcss',
      runner: 'node',
      args: ['--run', 'tailwindcss'],
      exited: false,
      cp: null,
      realCloseEvent: 'close',
    },
    {
      name: 'vite',
      runner: 'node',
      args: ['--run', 'dev'],
      exited: false,
      cp: null,
      realCloseEvent: 'exit',
    },
    {
      name: 'tauri',
      runner: 'cargo',
      args: ['run'],
      main: true,
      exited: false,
      cp: null,
      realCloseEvent: 'close',
    },
  ];

  for (const cmd of cmds) {
    const cp = spawn(cmd.runner, cmd.args);

    cp.stdout.on('data', (data) => {
      console.log(data.toString());
    });

    cp.stderr.on('data', (data) => {
      console.error(data.toString());
    });

    cp.on('error', (err) => {
      cmd.exited = true;
      console.error(err);
    });

    cp.on('spawn', () => {
      cmd.cp = cp;
    });

    cp.on(cmd.realCloseEvent, () => {
      cmd.exited = true;
      if (cmd.main) {
        for (const cmd of cmds) {
          if (cmd.exited) {
            continue;
          }
          cmd.cp.kill();
        }
      }
      if (cmds.every((cmd) => cmd.exited)) {
        process.exit();
      }
    });
  }
}

main();
