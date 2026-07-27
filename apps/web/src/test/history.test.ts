import { describe, it, expect } from 'vitest';
import { HistoryStack } from '@inframap/editor-core';

describe('HistoryStack (Undo / Redo)', () => {
  it('handles push, undo, and redo correctly', () => {
    const history = new HistoryStack<string[]>(10);

    const state0 = ['a'];
    const state1 = ['a', 'b'];
    const state2 = ['a', 'b', 'c'];

    history.push(state0);
    history.push(state1);

    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);

    const undoneState = history.undo(state2);
    expect(undoneState).toEqual(state1);
    expect(history.canRedo()).toBe(true);

    const undoneState2 = history.undo(state1);
    expect(undoneState2).toEqual(state0);

    const redoneState = history.redo(state0);
    expect(redoneState).toEqual(state1);
  });

  it('respects maximum stack size limit', () => {
    const history = new HistoryStack<number>(3);

    history.push(1);
    history.push(2);
    history.push(3);
    history.push(4);

    // Oldest element (1) should be shifted out
    let undone = history.undo(5); // gets 4
    undone = history.undo(4); // gets 3
    undone = history.undo(3); // gets 2
    expect(undone).toBe(2);
    expect(history.canUndo()).toBe(false);
  });
});
