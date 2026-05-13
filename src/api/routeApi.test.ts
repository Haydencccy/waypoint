import { describe, expect, it, vi, beforeEach } from 'vitest';

import { fetchRouteResult, submitRoute, RouteApiError } from './routeApi';

function createJsonResponse(body: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body), {
    status: init?.status ?? 200,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
}

describe('routeApi', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  it('posts origin and destination and parses the token', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(createJsonResponse({ token: 'abc-123' }));

    await expect(submitRoute('Innocentre, Hong Kong', 'Hong Kong International Airport Terminal 1')).resolves.toEqual({
      token: 'abc-123',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://sg-mock-api.lalamove.com/route',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          origin: 'Innocentre, Hong Kong',
          destination: 'Hong Kong International Airport Terminal 1',
        }),
      }),
    );
  });

  it('fetches the route result and parses success payloads', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        status: 'success',
        path: [
          ['22.372081', '114.107877'],
          ['22.326442', '114.167811'],
        ],
        total_distance: 20000,
        total_time: 1800,
      }),
    );

    await expect(fetchRouteResult('9d3503e0-7236-4e47-a62f-8b01b5646c16')).resolves.toEqual({
      status: 'success',
      path: [
        ['22.372081', '114.107877'],
        ['22.326442', '114.167811'],
      ],
      total_distance: 20000,
      total_time: 1800,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://sg-mock-api.lalamove.com/route/9d3503e0-7236-4e47-a62f-8b01b5646c16',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('surfaces server errors as RouteApiError instances', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(new Response('Internal Server Error', { status: 500 }));

    await expect(submitRoute('A', 'B')).rejects.toMatchObject({
      message: 'Server error, please try again',
      status: 500,
    });
  });

  it('maps network failures to a connection message', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));

    await expect(fetchRouteResult('token')).rejects.toMatchObject({
      message: 'Network error, check your connection',
    });
  });

  it('rejects unexpected payloads', async () => {
    const fetchMock = vi.mocked(fetch);
    fetchMock.mockResolvedValueOnce(createJsonResponse({ status: 'success', path: [['22', '114']] }));

    await expect(fetchRouteResult('token')).rejects.toBeInstanceOf(RouteApiError);
  });
});
