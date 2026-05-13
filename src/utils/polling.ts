export const DEFAULT_POLL_INTERVAL_MS = 1500;
export const DEFAULT_MAX_POLL_ATTEMPTS = 10;

export class PollTimeoutError extends Error {
  constructor(message = 'Request timed out') {
    super(message);
    this.name = 'PollTimeoutError';
  }
}

export class PollAbortedError extends Error {
  constructor(message = 'Polling was cancelled') {
    super(message);
    this.name = 'PollAbortedError';
  }
}

export interface PollUntilOptions<T> {
  request: () => Promise<T>;
  shouldContinue: (value: T) => boolean;
  intervalMs?: number;
  maxAttempts?: number;
  signal?: AbortSignal;
}

export interface PollSuccess<T> {
  attempts: number;
  value: T;
}

export async function pollUntil<T>({
  request,
  shouldContinue,
  intervalMs = DEFAULT_POLL_INTERVAL_MS,
  maxAttempts = DEFAULT_MAX_POLL_ATTEMPTS,
  signal,
}: PollUntilOptions<T>): Promise<PollSuccess<T>> {
  return new Promise<PollSuccess<T>>((resolve, reject) => {
    let attempts = 0;
    let settled = false;
    let activeRequest = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const cleanup = () => {
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
      signal?.removeEventListener('abort', handleAbort);
    };

    const settleResolve = (value: PollSuccess<T>) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      resolve(value);
    };

    const settleReject = (error: unknown) => {
      if (settled) {
        return;
      }
      settled = true;
      cleanup();
      reject(error);
    };

    const handleAbort = () => {
      settleReject(new PollAbortedError());
    };

    const runAttempt = async () => {
      if (settled || activeRequest) {
        return;
      }

      if (attempts >= maxAttempts) {
        settleReject(new PollTimeoutError());
        return;
      }

      activeRequest = true;
      attempts += 1;

      try {
        const result = await request();
        if (!shouldContinue(result)) {
          settleResolve({ attempts, value: result });
          return;
        }

        if (attempts >= maxAttempts) {
          settleReject(new PollTimeoutError());
        }
      } catch (error) {
        settleReject(error);
      } finally {
        activeRequest = false;
      }
    };

    if (signal?.aborted) {
      settleReject(new PollAbortedError());
      return;
    }

    signal?.addEventListener('abort', handleAbort, { once: true });

    void runAttempt();
    intervalId = setInterval(() => {
      void runAttempt();
    }, intervalMs);
  });
}
