import type { Line } from '~/types';

function contentToLines(content: string): Line[] {
  const lines: Line[] = [];
  const sep = process.platform === 'win32' ? '\r\n' : '\n';

  for (const line of content.split(sep).map((l) => l.trim())) {
    //
  }
  return lines;
}

function parseValidLine(line: string): Line | null {
  return null;
}
