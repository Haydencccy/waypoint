import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 33030, // 必須同 Nginx proxy_pass 嗰個 port 一樣
    strictPort: true,
    allowedHosts: ['hophk.ai-rwa.xyz'],
    hmr: {
      host: 'hophk.ai-rwa.xyz',
      clientPort: 443, // 強烈建議用 clientPort 代替 port: 443，確保 Vite 知道係客端連入嚟嘅 port
      protocol: 'wss',
    },
  },
})