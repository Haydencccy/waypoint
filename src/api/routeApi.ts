import type { RouteFailure, RouteInProgress, RouteResponse, RouteSuccess, SubmitRouteResponse } from '../types';

const DEFAULT_BASE_URL = 'https://sg-mock-api.lalamove.com';

export class RouteApiError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'RouteApiError';
    this.status = status;
  }
}

export interface RouteApiOptions {
  baseUrl?: string;
  routePath?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isStringTuple(value: unknown): value is [string, string] {
  return Array.isArray(value) && value.length === 2 && value.every((item) => typeof item === 'string');
}

function isSubmitRouteResponse(value: unknown): value is SubmitRouteResponse {
  return isRecord(value) && typeof value.token === 'string';
}

function isRouteInProgress(value: unknown): value is RouteInProgress {
  return isRecord(value) && value.status === 'in progress';
}

function isRouteFailure(value: unknown): value is RouteFailure {
  return isRecord(value) && value.status === 'failure' && typeof value.error === 'string';
}

function isRouteSuccess(value: unknown): value is RouteSuccess {
  return (
    isRecord(value) &&
    value.status === 'success' &&
    Array.isArray(value.path) &&
    value.path.every(isStringTuple) &&
    typeof value.total_distance === 'number' &&
    typeof value.total_time === 'number'
  );
}

function isRouteResponse(value: unknown): value is RouteResponse {
  return isRouteInProgress(value) || isRouteFailure(value) || isRouteSuccess(value);
}

function buildUrl(baseUrl: string, routePath: string): string {
  const trimmedBaseUrl = baseUrl.replace(/\/$/, '');
  const normalizedRoutePath = routePath.startsWith('/') ? routePath : `/${routePath}`;
  return `${trimmedBaseUrl}${normalizedRoutePath}`;
}

async function readJson<T>(response: Response, validate: (value: unknown) => value is T): Promise<T> {
  let payload: unknown;

  try {
    const text = await response.text();
    payload = text.trim().length > 0 ? JSON.parse(text) : null;
  } catch {
    throw new RouteApiError('Unexpected response from server');
  }

  if (!validate(payload)) {
    throw new RouteApiError('Unexpected response from server');
  }

  return payload;
}

async function requestJson<T>(
  path: string,
  init: RequestInit,
  validate: (value: unknown) => value is T,
  baseUrl = DEFAULT_BASE_URL,
): Promise<T> {
  try {
    const response = await fetch(buildUrl(baseUrl, path), {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    });

    if (!response.ok) {
      if (response.status >= 500) {
        throw new RouteApiError('Server error, please try again', response.status);
      }

      throw new RouteApiError('Request failed, please try again', response.status);
    }

    return await readJson(response, validate);
  } catch (error) {
    if (error instanceof RouteApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }

    throw new RouteApiError('Network error, check your connection');
  }
}

export async function submitRoute(
  origin: string,
  destination: string,
  options: RouteApiOptions = {},
): Promise<SubmitRouteResponse> {
  const { baseUrl = DEFAULT_BASE_URL, routePath = '/route' } = options;

  return requestJson<SubmitRouteResponse>(
    routePath,
    {
      method: 'POST',
      body: JSON.stringify({ origin, destination }),
    },
    isSubmitRouteResponse,
    baseUrl,
  );
}

export async function fetchRouteResult(token: string, options: RouteApiOptions = {}): Promise<RouteResponse> {
  const { baseUrl = DEFAULT_BASE_URL, routePath = '/route' } = options;

  return requestJson<RouteResponse>(
    `${routePath.replace(/\/$/, '')}/${encodeURIComponent(token)}`,
    {
      method: 'GET',
    },
    isRouteResponse,
    baseUrl,
  );
}
