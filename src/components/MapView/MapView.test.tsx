import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Waypoint } from '../../types';
import { MapView } from './MapView';

function createGoogleMapsMock() {
  const fitBounds = vi.fn();
  const setCenter = vi.fn();
  const setZoom = vi.fn();
  const markerSetMap = vi.fn();
  const polylineSetMap = vi.fn();
  const extend = vi.fn();

  const Map = vi.fn().mockImplementation(() => ({ fitBounds, setCenter, setZoom }));
  const Marker = vi.fn().mockImplementation(() => ({ setMap: markerSetMap }));
  const Polyline = vi.fn().mockImplementation(() => ({ setMap: polylineSetMap }));
  const LatLngBounds = vi.fn().mockImplementation(() => ({ extend }));

  vi.stubGlobal('google', {
    maps: {
      Map,
      Marker,
      Polyline,
      LatLngBounds,
    },
  } as never);

  return {
    Map,
    Marker,
    Polyline,
    LatLngBounds,
    fitBounds,
    setCenter,
    setZoom,
    markerSetMap,
    polylineSetMap,
    extend,
  };
}

describe('MapView', () => {
  it('loads the map and renders markers for each waypoint', async () => {
    const google = createGoogleMapsMock();
    const loaderFactory = vi.fn(() => ({ load: vi.fn().mockResolvedValue(undefined) }));
    const waypoints: Waypoint[] = [
      ['22.372081', '114.107877'],
      ['22.326442', '114.167811'],
      ['22.284419', '114.15951'],
    ];

    render(<MapView waypoints={waypoints} apiKey="test-key" loaderFactory={loaderFactory} />);

    await waitFor(() => {
      expect(loaderFactory).toHaveBeenCalledWith('test-key');
    });

    await waitFor(() => {
      expect(google.Map).toHaveBeenCalledTimes(1);
      expect(google.Marker).toHaveBeenCalledTimes(3);
      expect(google.Polyline).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByText('Waypoint 1')).toBeInTheDocument();
    expect(screen.getByText('22.372081, 114.107877')).toBeInTheDocument();
  });
});
