/// <reference types="vite/client" />

declare interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
}

declare interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare interface Window {
  google?: typeof google;
}
