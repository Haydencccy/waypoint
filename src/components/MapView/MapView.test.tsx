import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Waypoint } from '../../types';
import { MapView } from './MapView';

const mapMocks = vi.hoisted(() => {
  const viewInstance = {
    fit: vi.fn(),
    setCenter: vi.fn(),
    setZoom: vi.fn(),
  };

  const vectorSourceInstance = {
    clear: vi.fn(),
    addFeature: vi.fn(),
    getExtent: vi.fn(() => [0, 0, 1, 1]),
  };

  const mapInstance = {
    getView: vi.fn(() => viewInstance),
    addOverlay: vi.fn(),
    setTarget: vi.fn(),
  };

  const FeatureMock = vi.fn(function FeatureMock(this: { options?: unknown; setStyle?: ReturnType<typeof vi.fn>; set?: ReturnType<typeof vi.fn> }, options: unknown) {
    this.options = options;
    this.setStyle = vi.fn();
    this.set = vi.fn();
  });

  return {
    viewInstance,
    vectorSourceInstance,
    mapInstance,
    FeatureMock,
  };
});

vi.mock('ol/Map', () => ({ default: vi.fn(() => mapMocks.mapInstance) }));
vi.mock('ol/View', () => ({ default: vi.fn(() => mapMocks.viewInstance) }));
vi.mock('ol/Feature', () => ({ default: mapMocks.FeatureMock }));
vi.mock('ol/Overlay', () => ({ default: vi.fn(() => ({})) }));
vi.mock('ol/geom', () => ({
  Circle: vi.fn(),
  LineString: vi.fn(),
  Point: vi.fn(),
}));
vi.mock('ol/layer/Tile', () => ({ default: vi.fn(() => ({})) }));
vi.mock('ol/layer/Vector', () => ({ default: vi.fn(() => ({})) }));
vi.mock('ol/source/XYZ', () => ({ default: vi.fn(() => ({})) }));
vi.mock('ol/source/Vector', () => ({ default: vi.fn(() => mapMocks.vectorSourceInstance) }));
vi.mock('ol/control', () => ({ defaults: vi.fn(() => ({ extend: vi.fn() })) }));
vi.mock('ol/proj', () => ({ fromLonLat: vi.fn(([lng, lat]: [number, number]) => [lng, lat]) }));
vi.mock('ol/style', () => ({
  Circle: vi.fn(),
  Fill: vi.fn(),
  Stroke: vi.fn(),
  Style: vi.fn(),
  Text: vi.fn(),
}));

describe('MapView', () => {
  it('loads the map and renders markers for each waypoint', async () => {
    const waypoints: Waypoint[] = [
      ['22.372081', '114.107877'],
      ['22.326442', '114.167811'],
      ['22.284419', '114.15951'],
    ];

    render(<MapView waypoints={waypoints} />);

    await waitFor(() => {
      expect(mapMocks.mapInstance.addOverlay).toHaveBeenCalledTimes(1);
      expect(mapMocks.vectorSourceInstance.clear).toHaveBeenCalledTimes(1);
      expect(mapMocks.vectorSourceInstance.addFeature).toHaveBeenCalledTimes(4);
    });

    expect(screen.getByText('Waypoint 1')).toBeInTheDocument();
    expect(screen.getByText('22.372081, 114.107877')).toBeInTheDocument();
    expect(screen.getByText('OpenLayers')).toBeInTheDocument();
  });
});
