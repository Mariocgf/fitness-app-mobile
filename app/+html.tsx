import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

const THEME_COLOR = '#09090b';

// Registro del service worker como string: se emite al HTML (SSR-safe), nunca se ejecuta
// durante el pre-render en Node. Solo en produccion, para no pelear con el hot-reload de
// `expo start --web` (ver docs/agent-implementation-lessons.md, leccion #127 SSR).
const serviceWorkerRegistration = `
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('/sw.js').catch(function () {});
    });
  }
`;

/**
 * Este archivo solo se usa en el export web estatico (expo-router `web.output: "static"`).
 * Metro nunca lo incluye en el bundle nativo (iOS/Android) — es exclusivo del `<head>` HTML.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />

        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content={THEME_COLOR} />

        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Wellium" />

        <ScrollViewStyleReset />

        {/* Fondo dark-only antes de hidratar React, evita flash blanco al abrir standalone */}
        <style
          dangerouslySetInnerHTML={{
            __html: `html,body,#root{background-color:${THEME_COLOR}}`,
          }}
        />

        {process.env.NODE_ENV === 'production' && (
          <script dangerouslySetInnerHTML={{ __html: serviceWorkerRegistration }} />
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}
