import fs from 'node:fs';
import path from 'node:path';
import { type BrowserWindow, app } from 'electron';

export class WidnowState {
  width = 1000;
  height = 700;
  readonly minWidth = 1000;
  readonly minHeight = 700;
  private filePath = path.join(app.getPath('userData'), 'window-state.json');

  saveWindowState(window: BrowserWindow) {
    const [width, height] = window.getSize();
    fs.writeFileSync(this.filePath, JSON.stringify({ width, height }));
    console.log(`save window state to '${this.filePath}'`);
  }

  restoreWindowState() {
    if (!fs.existsSync(this.filePath)) {
      return;
    }
    try {
      const content = fs.readFileSync(this.filePath, 'utf-8');
      const obj: Partial<{ width: number; height: number }> =
        JSON.parse(content);
      console.log('resotre window state', obj);
      if (
        !obj.width ||
        !obj.height ||
        obj.width < this.minWidth ||
        obj.height < this.minHeight
      ) {
        return;
      }
      this.width = obj.width;
      this.height = obj.height;
    } catch (_) {
      //
    }
  }
}
