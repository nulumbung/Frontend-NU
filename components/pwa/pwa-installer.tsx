'use client';

import { useEffect } from 'react';

/**
 * PWA Service Worker Registration
 * Automatically registers the service worker for offline support and caching
 */
export function PWAInstaller() {
  useEffect(() => {
    // Only register in production and on client side
    if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') {
      return;
    }

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      console.log('[PWA] Service Workers not supported');
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });

        console.log('[PWA] Service Worker registered successfully', registration);

        // Check for updates periodically
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[PWA] New service worker available, waiting for reload');
              // Notify user about update (optional)
              // You can show a toast notification here
            }
          });
        });

        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      } catch (error) {
        console.error('[PWA] Service Worker registration failed:', error);
      }
    };

    // Register after a small delay to avoid blocking initial render
    const timeoutId = setTimeout(registerServiceWorker, 1000);

    return () => clearTimeout(timeoutId);
  }, []);

  return null;
}
