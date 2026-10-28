
import { VitePWA } from 'vite-plugin-pwa';

export const pwaConfig = () =>
  VitePWA({
    registerType: 'autoUpdate',

    manifest: {
      name: 'Pack&Go',
      short_name: 'Pack&Go',
      description: 'Discover and book your next trip with Pack&Go.',
      theme_color: '#0f766e',
      background_color: '#ffffff',
      display: 'standalone',
      start_url: '/',

      icons: [
        {
          src: '/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: '/pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],

      screenshots: [
        {
          src: '/pwa-desktop.png',
          sizes: '1440x900',
          type: 'image/png',
          form_factor: 'wide',
          label: 'Pack&Go desktop experience',
        },
        {
          src: '/pwa-mobile.png',
          sizes: '540x960',
          type: 'image/png',
          label: 'Pack&Go mobile experience',
        },
      ],
    },

    workbox: {
      globPatterns: [
        '**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2}',
      ],

      navigateFallback: "/index.html",

      navigateFallbackDenylist: [
        /^\/offline\.html$/,
      ],

      runtimeCaching: [
        {
          urlPattern: ({ url }) =>
            url.origin === '${import.meta.env.VITE_API_URL}' &&
            [
              '/components/nav',
              '/components/get-trips',
            ].includes(url.pathname),

          handler: 'NetworkFirst',

          options: {
            cacheName: 'packgo-public-api',
            networkTimeoutSeconds: 3,

            cacheableResponse: {
              statuses: [0, 200],
            },

            expiration: {
              maxEntries: 30,
              maxAgeSeconds: 60 * 60 * 24,
            },
          },
        },
      ],
    },
  });
