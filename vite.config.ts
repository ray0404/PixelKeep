import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      disable: process.env.NODE_ENV === 'development',
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico', 
        'apple-touch-icon.png', 
        'mask-icon.svg',
        'nanobanana-output/*.png'
      ],
      workbox: {
        mode: 'development',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // <== 365 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          }
        ]
      },
      manifest: {
        name: 'PixelKeep',
        short_name: 'PixelKeep',
        description: 'Secure, pixel-art encrypted notes and quest log.',
        theme_color: '#1e1b4b',
        background_color: '#1e1b4b',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        share_target: {
          action: '/share-target',
          method: 'GET',
          params: {
            title: 'title',
            text: 'text',
            url: 'url'
          }
        },
        file_handlers: [
          {
            action: '/share-target',
            accept: {
              'text/plain': ['.txt', '.md', '.markdown'],
              'application/json': ['.json'],
              'text/csv': ['.csv'],
              'text/html': ['.html', '.htm'],
              'image/png': ['.png'],
              'image/jpeg': ['.jpg', '.jpeg'],
              'image/webp': ['.webp'],
              'image/gif': ['.gif'],
              'audio/mpeg': ['.mp3'],
              'audio/wav': ['.wav'],
              'audio/ogg': ['.ogg'],
              'audio/mp4': ['.m4a']
            }
          }
        ],
        shortcuts: [
          {
            name: 'Scribe New Scroll',
            short_name: 'New Note',
            description: 'Capture a new thought in the vault',
            url: '/#/notes/new',
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'Start New Quest',
            short_name: 'New Quest',
            description: 'Add a new task to your quest log',
            url: '/#/tasks/new',
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }]
          }
        ]
      }
    })
  ],
  worker: {
    format: 'es',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
  },
})
