import fs from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { IS_DEV } from './consts.js';

export async function readHosts(): Promise<string> {
  const hostsPath = await getHostsPath();
  return fs.readFile(hostsPath, 'utf-8');
}

export async function writeHosts(content: string): Promise<void> {
  const hostsPath = await getHostsPath();
  const tmpFile = path.join(tmpdir(), 'hed2_tmp');
  await fs.writeFile(
    tmpFile,
    process.platform === 'win32' ? content.replaceAll('\n', '\r\n') : content,
  );
  await fs.copyFile(tmpFile, hostsPath);
  await fs.rm(tmpFile);
}

export async function isHostsReadonly(): Promise<boolean> {
  const hostsPath = await getHostsPath();
  try {
    await fs.access(hostsPath, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

export async function getHostsPath(): Promise<string> {
  if (IS_DEV) {
    return path.join(import.meta.dirname, '../', '../', 'tmp', 'hosts');
  }
  if (process.platform === 'win32') {
    const systemDrive = process.env.SYSTEMDRIVE;
    if (!systemDrive) {
      throw new Error('SYSTEMDRIVE environment variable is not set');
    }
    return path.join(
      systemDrive,
      'Windows',
      'System32',
      'drivers',
      'etc',
      'hosts',
    );
  }
  return '/etc/hosts';
}
