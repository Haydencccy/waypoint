import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite config: allow requests proxied from your public domain via tunnel
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3550,
    // allow the tunneled hostname(s) - replace or add more as needed
    allowedHosts: ['hophk.ai-rwa.xyz'],
    // HMR config for HTTPS + FRP tunnel (fixes Chrome "mixed content" warning)
    hmr: {
      host: 'hophk.ai-rwa.xyz',
      port: 443,
      protocol: 'wss', // WebSocket Secure for HTTPS environments
    },
  },
})
