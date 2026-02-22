// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { detectWebGL } from '@/components/treatment-plan/webgl-support';

describe('webgl-support', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false when canvas.getContext returns null', () => {
    vi.spyOn(document, 'createElement').mockReturnValue({
      getContext: () => null,
    } as unknown as HTMLCanvasElement);

    expect(detectWebGL()).toBe(false);
  });

  it('returns false during SSR (no window)', () => {
    const origWindow = globalThis.window;
    // @ts-ignore - Simulating SSR by removing window
    delete (globalThis as Record<string, unknown>).window;

    try {
      // Need to call the function directly since module is already loaded
      // The function checks typeof window === 'undefined'
      expect(detectWebGL()).toBe(false);
    } finally {
      // Restore
      (globalThis as Record<string, unknown>).window = origWindow;
    }
  });
});
