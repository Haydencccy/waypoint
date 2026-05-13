# Route Finder

A React 18 + Vite + TypeScript app that submits a pickup and drop-off address to the Lalamove mock API, polls for the route status, and renders the returned waypoints on an OpenLayers base map.

## Stack

- React 18
- Vite
- TypeScript
- Vitest
- OpenLayers

## Getting Started

1. Install dependencies.

   ```bash
   npm install
   ```

2. Start the development server.

   ```bash
   npm run dev
   ```

No map API key is required. The base map uses OpenStreetMap tiles through OpenLayers.

## Mock API

The app talks to `https://sg-mock-api.lalamove.com`.

- `POST /route` submits a pickup and drop-off
- `GET /route/:token` polls for `in progress`, `failure`, or `success`

Deterministic endpoints are also available for development:

- `POST /mock/route/500`
- `POST /mock/route/success`
- `GET /mock/route/500`
- `GET /mock/route/inprogress`
- `GET /mock/route/failure`
- `GET /mock/route/success`

## Tests

Run the unit test suite with:

```bash
npm run test
```

## Production Build

Create a production bundle with:

```bash
npm run build
```

Preview the build with:

```bash
npm run preview
```

## Notes

- Keep route polling logic separate from the map implementation.
- Polling stops on success, failure, HTTP 500, network failure, and timeout.
- The UI keeps API calls in `src/api/`, polling logic in hooks and utilities, and presentation in components.
