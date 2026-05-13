import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import type { RouteResponse } from '../types';
import { useRoutePoll } from './useRoutePoll';

describe('useRoutePoll', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('transitions to success when the poll resolves with a success route', async () => {
    const fetcher = vi
      .fn<(token: string) => Promise<RouteResponse>>()
      .mockResolvedValueOnce({ status: 'in progress' })
      .mockResolvedValueOnce({
        status: 'success',
        path: [['22.372081', '114.107877']],
        total_distance: 20000,
        total_time: 1800,
      });

    const { result } = renderHook(({ token }) => useRoutePoll(token, { fetcher, intervalMs: 100, maxRetries: 4 }), {
      initialProps: { token: 'abc' as string | null },
    });

    expect(result.current.status).toBe('loading');

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(result.current.status).toBe('success');
    expect(result.current.route).toEqual({
      status: 'success',
      path: [['22.372081', '114.107877']],
      total_distance: 20000,
      total_time: 1800,
    });
  });

  it('surfaces failure messages from the API', async () => {
    const fetcher = vi.fn<(token: string) => Promise<RouteResponse>>().mockResolvedValueOnce({
      status: 'failure',
      error: 'Location not accessible by car',
    });

    const { result } = renderHook(() => useRoutePoll('abc', { fetcher, intervalMs: 100, maxRetries: 4 }));

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('Location not accessible by car');
    expect(result.current.isLoading).toBe(false);
  });
});
