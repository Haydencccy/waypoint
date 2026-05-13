import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

import { PollTimeoutError, pollUntil } from './polling';

type PollTestResponse =
  | { status: 'in progress' }
  | {
      status: 'success';
      path: [string, string][];
      total_distance: number;
      total_time: number;
    };

describe('pollUntil', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('stops when the request returns a terminal value', async () => {
    const request = vi
      .fn<() => Promise<PollTestResponse>>()
      .mockResolvedValueOnce({ status: 'in progress' })
      .mockResolvedValueOnce({
        status: 'success',
        path: [['22.372081', '114.107877']],
        total_distance: 20000,
        total_time: 1800,
      });

    const promise = pollUntil<PollTestResponse>({
      request,
      shouldContinue: (value) => value.status === 'in progress',
      intervalMs: 100,
      maxAttempts: 4,
    });

    await vi.advanceTimersByTimeAsync(100);
    await expect(promise).resolves.toMatchObject({
      attempts: 2,
      value: {
        status: 'success',
      },
    });
  });

  it('throws a timeout error after the maximum attempts', async () => {
    const request = vi.fn<() => Promise<PollTestResponse>>().mockResolvedValue({ status: 'in progress' });

    const promise = pollUntil<PollTestResponse>({
      request,
      shouldContinue: (value) => value.status === 'in progress',
      intervalMs: 50,
      maxAttempts: 2,
    });

    const assertion = expect(promise).rejects.toBeInstanceOf(PollTimeoutError);

    await vi.advanceTimersByTimeAsync(50);
    await assertion;
    expect(request).toHaveBeenCalledTimes(2);
  });
});
