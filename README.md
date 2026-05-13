# Route Finder

A React 18 + Vite + TypeScript app that submits a pickup and drop-off address to the Lalamove mock API, polls for the route status, and renders the returned waypoints on Google Maps.

## Stack

- React 18
- Vite
- TypeScript
- Vitest
- Google Maps JavaScript API

## Getting Started

1. Install dependencies.

   ```bash
   npm install
   ```

2. Create your local environment file.

   ```bash
   cp .env.example .env
   ```

3. Add your Google Maps API key to `.env`.

   ```bash
   VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

4. Start the development server.

   ```bash
   npm run dev
   ```

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

- Keep the real API key out of version control. `.env` is ignored and `.env.example` documents the required variable.
- Polling stops on success, failure, HTTP 500, network failure, and timeout.
- The UI keeps API calls in `src/api/`, polling logic in hooks and utilities, and presentation in components.
