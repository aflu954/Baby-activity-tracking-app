import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ mode }) => {
  // `vite build --mode artifact` makes one self-contained HTML file for hosting as a claude.ai artifact.
  const artifact = mode === 'artifact';
  return {
    define: artifact ? { 'import.meta.env.VITE_TARGET': JSON.stringify('artifact') } : {},
    resolve: artifact
      ? { alias: [{ find: /^@fontsource\/poppins\/.*\.css$/, replacement: fileURLToPath(new URL('./src/empty.css', import.meta.url)) }] }
      : {},
    build: artifact ? { outDir: 'dist-artifact', assetsInlineLimit: 100_000_000 } : {},
    plugins: [
      react(),
      artifact
        ? viteSingleFile()
        : VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['icon.svg'],
            manifest: {
              name: 'Sbaby Play',
              short_name: 'Sbaby',
              description: 'Daily play games for babies 0–24 months, with milestones and growth.',
              theme_color: '#fffaf7',
              background_color: '#fffaf7',
              display: 'standalone',
              start_url: '/',
              icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
            },
            workbox: { globPatterns: ['**/*.{js,css,html,svg,woff2}'] },
          }),
    ],
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  };
});
