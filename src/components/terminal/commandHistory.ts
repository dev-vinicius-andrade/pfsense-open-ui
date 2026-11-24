const HISTORY_KEY = 'pfsense-terminal-history';
const MAX_HISTORY = 200;

export class CommandHistory {
  private items: string[] = [];
  private index: number = -1;

  constructor() {
    try {
      const stored = sessionStorage.getItem(HISTORY_KEY);
      if (stored) this.items = JSON.parse(stored);
    } catch {
      /* ignore parse errors */
    }
  }

  add(command: string): void {
    if (!command.trim()) return;
    this.items = this.items.filter((c) => c !== command);
    this.items.push(command);
    if (this.items.length > MAX_HISTORY) this.items.shift();
    this.index = -1;
    try {
      sessionStorage.setItem(HISTORY_KEY, JSON.stringify(this.items));
    } catch {
      /* ignore storage errors */
    }
  }

  previous(): string | undefined {
    if (this.items.length === 0) return undefined;
    if (this.index === -1) this.index = this.items.length - 1;
    else if (this.index > 0) this.index--;
    return this.items[this.index];
  }

  next(): string | undefined {
    if (this.index === -1) return '';
    if (this.index < this.items.length - 1) {
      this.index++;
      return this.items[this.index];
    }
    this.index = -1;
    return '';
  }

  clear(): void {
    this.items = [];
    this.index = -1;
    sessionStorage.removeItem(HISTORY_KEY);
  }
}