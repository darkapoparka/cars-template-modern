import { describe, expect, it } from 'vitest';
import { cn } from './utils';

const expectClasses = (actual: string, expected: readonly string[]) => {
  const classes = new Set(actual.split(' '));
  for (const className of expected) {
    expect(classes.has(className)).toBe(true);
  }
};

describe('cn semantic typography', () => {
  it('keeps custom font sizes alongside text colors', () => {
    expectClasses(cn('text-meta text-zinc-600'), [
      'text-meta',
      'text-zinc-600',
    ]);
    expectClasses(cn('text-white text-compact-control'), [
      'text-white',
      'text-compact-control',
    ]);
  });

  it('resolves standard and semantic font-size conflicts by order', () => {
    expect(cn('text-sm text-compact-control')).toBe('text-compact-control');
    expect(cn('text-lg text-card-title')).toBe('text-card-title');
    expect(cn('text-card-title text-lg')).toBe('text-lg');
  });
});
