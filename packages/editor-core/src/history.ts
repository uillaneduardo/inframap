export class HistoryStack<T> {
  private past: T[] = [];
  private future: T[] = [];
  private maxStackSize: number;

  constructor(maxStackSize = 50) {
    this.maxStackSize = maxStackSize;
  }

  push(state: T): void {
    this.past.push(state);
    if (this.past.length > this.maxStackSize) {
      this.past.shift();
    }
    this.future = [];
  }

  undo(currentState: T): T | null {
    if (this.past.length === 0) return null;
    const previous = this.past.pop()!;
    this.future.push(currentState);
    return previous;
  }

  redo(currentState: T): T | null {
    if (this.future.length === 0) return null;
    const next = this.future.pop()!;
    this.past.push(currentState);
    return next;
  }

  canUndo(): boolean {
    return this.past.length > 0;
  }

  canRedo(): boolean {
    return this.future.length > 0;
  }

  clear(): void {
    this.past = [];
    this.future = [];
  }
}
