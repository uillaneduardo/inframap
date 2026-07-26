import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
        manifest: {
          name: 'InfraMap',
          short_name: 'InfraMap',
          description: 'Plataforma de documentação e diagramação visual de infraestrutura de TI, datacenters e redes.',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@inframap/domain': path.resolve(__dirname, './packages/domain/src'),
        '@inframap/project-schema': path.resolve(__dirname, './packages/project-schema/src'),
        '@inframap/editor-core': path.resolve(__dirname, './packages/editor-core/src'),
        '@inframap/validation': path.resolve(__dirname, './packages/validation/src'),
        '@inframap/ui': path.resolve(__dirname, './packages/ui/src'),
        '@inframap/i18n': path.resolve(__dirname, './packages/i18n/src'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
    },
  };
});
