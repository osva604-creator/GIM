/* Service worker usando Workbox para estrategia Stale-While-Revalidate
   - precache de assets esenciales
   - runtime caching StaleWhileRevalidate para scripts, estilos e imágenes
*/

importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

if (workbox) {
  const ASSETS = [
    './',
    './index.html',
    './css/styles.css',
    './js/app.js',
    './manifest.webmanifest',
    './icons/weight.svg',
    './icons/icon-192.png',
    './icons/icon-512.png'
  ];

  workbox.core.skipWaiting();
  workbox.core.clientsClaim();

  // Precache los recursos esenciales (lista estática)
  workbox.precaching.precacheAndRoute(ASSETS.map((url) => ({url})));

  // Stale-While-Revalidate para scripts y estilos
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'script' || request.destination === 'style',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-resources',
      plugins: [
        new workbox.expiration.ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 7 * 24 * 60 * 60 })
      ]
    })
  );

  // Stale-While-Revalidate para imágenes
  workbox.routing.registerRoute(
    ({request}) => request.destination === 'image',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'images',
      plugins: [
        new workbox.expiration.ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 })
      ]
    })
  );

  // Fallback: network first for document navigations (intentar actualizar la shell)
  workbox.routing.registerRoute(
    ({request}) => request.mode === 'navigate',
    new workbox.strategies.NetworkFirst({
      cacheName: 'documents',
      plugins: [
        new workbox.expiration.ExpirationPlugin({ maxEntries: 20 })
      ]
    })
  );

} else {
  // Si Workbox no carga, fallback simple
  self.addEventListener('install', (event) => { self.skipWaiting(); });
  self.addEventListener('activate', (event) => { self.clients.claim(); });
}
