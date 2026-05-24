import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name:             'Raahi — AI Travel Planner',
        short_name:       'Raahi',
        description:      'Your AI travel companion for Incredible India 🇮🇳',
        theme_color:      '#C4663A',
        background_color: '#FAFAF8',
        display:          'standalone',
        orientation:      'portrait',
        scope:            '/',
        start_url:        '/',
        icons: [
          {
            src:   '/icon-192.png',
            sizes: '192x192',
            type:  'image/png',
          },
          {
            src:     '/icon-512.png',
            sizes:   '512x512',
            type:    'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler:    'CacheFirst',
            options: {
              cacheName: 'unsplash-images',
              expiration: {
                maxEntries:     50,
                maxAgeSeconds:  60 * 60 * 24 * 30,
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.tile\.openstreetmap\.org\/.*/i,
            handler:    'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: {
                maxEntries:    200,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
        ],
      },
    }),
  ],
})