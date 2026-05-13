import { useEffect, useState } from 'react';

import { fetchRouteResult as fetchRouteResultRequest, RouteApiError } from '../api/routeApi';
import type { RouteFailure, RouteResponse, RouteSuccess } from '../types';
import {
  DEFAULT_MAX_POLL_ATTEMPTS,
  DEFAULT_POLL_INTERVAL_MS,
  PollAbortedError,
  PollTimeoutError,
  pollUntil,
} from '../utils/polling';

export interface UseRoutePollOptions {
  intervalMs?: number;
  maxRetries?: number;
  fetcher?: (token: string) => Promise<RouteResponse>;
}

export interface UseRoutePollState {
  status: 'idle' | 'loading' | 'success' | 'error';
  route: RouteSuccess | null;
  error: string | null;
  isLoading: boolean;
  attempts: number;
}

const INITIAL_STATE: UseRoutePollState = {
  status: 'idle',
  route: null,
  error: null,
  isLoading: false,
  attempts: 0,
};

function normalizePollError(error: unknown): string {
  if (error instanceof PollTimeoutError) {
    return error.message;
  }

  if (error instanceof RouteApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Request failed, please try again';
}

export function useRoutePoll(token: string | null, options: UseRoutePollOptions = {}): UseRoutePollState {
  const {
    intervalMs = DEFAULT_POLL_INTERVAL_MS,
    maxRetries = DEFAULT_MAX_POLL_ATTEMPTS,
    fetcher = fetchRouteResultRequest,
  } = options;

  const [state, setState] = useState<UseRoutePollState>(INITIAL_STATE);

  useEffect(() => {
    if (!token) {
      setState(INITIAL_STATE);
      return;
    }

    let active = true;
    const controller = new AbortController();

    setState({
      status: 'loading',
      route: null,
      error: null,
      isLoading: true,
      attempts: 0,
    });

    void pollUntil<RouteResponse>({
      request: () => fetcher(token),
      shouldContinue: (response) => response.status === 'in progress',
      intervalMs,
      maxAttempts: maxRetries,
      signal: controller.signal,
    })
      .then(({ attempts, value }) => {
        if (!active) {
          return;
        }

        if (value.status === 'success') {
          setState({
            status: 'success',
            route: value,
            error: null,
            isLoading: false,
            attempts,
          });
          return;
        }

        const failure = value as RouteFailure;
        setState({
          status: 'error',
          route: null,
          error: failure.error,
          isLoading: false,
          attempts,
        });
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        if (error instanceof PollAbortedError) {
          return;
        }

        setState({
          status: 'error',
          route: null,
          error: normalizePollError(error),
          isLoading: false,
          attempts: 0,
        });
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [fetcher, intervalMs, maxRetries, token]);

  return state;
}
