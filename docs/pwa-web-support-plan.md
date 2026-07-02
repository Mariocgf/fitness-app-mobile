# Plan: Soporte Web + PWA (sin romper nativo)

> Estado del análisis: **verificado contra el código y `node_modules`** (no supuestos).
> Rama de trabajo: `pwa`. Stack: Expo SDK 54, expo-router 6, React Native 0.81, React 19,
> react-native-web 0.21, NativeWind 4, Clerk, TanStack Query, capa offline con expo-sqlite.

---

## 0. TL;DR

La app **ya corre sobre `react-native-web`** (script `web`, `web.output: "static"` en `app.json`,
NativeWind y Reanimated son web-compatibles). Lo que falta se divide en dos frentes:

1. **Desbloquear web**: hay APIs nativas sin fallback de plataforma que rompen la app en el navegador.
   La más grave es `expo-secure-store` (el token cache de Clerk), que hace que **la sesión no persista**.
2. **Convertirla en PWA real**: hoy `dist/` **no tiene `manifest.json` ni service worker**, así que
   no es instalable ni funciona offline como PWA.

**Regla de oro para no romper nativo:** toda diferencia de plataforma se resuelve con
**módulos `.web.ts` / `.native.ts`** o `Platform.OS === 'web'`. Metro elige el archivo correcto por
extensión en build-time; el bundle nativo **nunca ve** el código web. Riesgo sobre iOS/Android: cero.

---

## 1. Estado actual (lo que YA está listo)

| Pieza | Estado | Nota |
|-------|--------|------|
| `react-native-web@0.21` | ✅ instalado | dependencia directa |
| Script `web` | ✅ `expo start --web` | en `package.json` |
| `app.json → web.output` | ✅ `"static"` | export estático (SSG) |
| `app.json → web.favicon` | ✅ presente | pero falta el resto del manifest PWA |
| NativeWind / Tailwind | ✅ web-compatible | mismo `global.css` |
| Reanimated / worklets | ✅ web-compatible | |
| expo-router | ✅ web-compatible | rutas → URLs |
| `react-dom` / `react-native-web` | ✅ presentes | |
| Build web previo | ✅ existe `dist/` | pero **sin manifest ni SW** |

---

## 2. Bloqueadores por API nativa (verificado en `node_modules`)

### 2.1 ✅ `expo-secure-store` — RESUELTO (no era bloqueante real)
- **Hallazgo inicial:** `node_modules/expo-secure-store/build/ExpoSecureStore.web.js` es literalmente
  `export default {}` → parecía que `getItemAsync`/`setItemAsync` lanzarían en web y romperían la sesión.
- **Corrección (verificado en `node_modules/@clerk/clerk-expo/dist/provider/ClerkProvider.js:64-70`):**
  en web (`isNative() === false`) Clerk se instancia con `Clerk: null` + `standardBrowser: true`, y el
  `tokenCache` **solo se pasa a la instancia nativa** — en web Clerk **ignora** el `tokenCache` por completo;
  la sesión la persiste `clerk-js` vía cookies/localStorage propios, no vía este objeto. El `tokenCache`
  inline era config muerta en web, no un bloqueante.
- **Fix aplicado:** se reemplazó el objeto inline de `app/_layout.tsx:75-93` por el `tokenCache` oficial de
  `@clerk/clerk-expo/token-cache` (`isNative() ? createTokenCache() : void 0`, documentado como
  "undefined on web"). Mismo comportamiento en nativo (SecureStore, con `keychainAccessible: AFTER_FIRST_UNLOCK`),
  cero archivos nuevos, sin reinventar algo que el SDK ya resuelve. Detalle completo en
  `docs/agent-implementation-lessons.md`.
- **Pendiente real:** la persistencia de sesión web (si falla) depende de `clerk-js`/cookies/dominio del
  dev server, no del tokenCache. Se valida empíricamente en el smoke test de Fase 1, no se asume.

### 2.2 ✅ `expo-sqlite` — capa offline en web (IMPLEMENTADO, ver Fase 2)
- **Hallazgo:** `expo-sqlite` **SÍ** trae impl web (`wa-sqlite` WASM, `worker.ts`, `WebStorage.js`).
- **Dónde pega:** `src/offline/db.ts` (SQLite + migraciones), `src/offline/repository.ts`, `OfflineSyncGate`.
- **DECISIÓN TOMADA → Opción B (offline real):** habilitar wa-sqlite (WASM) en web y validar migraciones.
  Offline funcional en el navegador, paridad con nativo.
  - ✅ **CORRECCIÓN (verificado en `node_modules/expo-sqlite/web/wa-sqlite/`):** esta versión usa
    **`AccessHandlePoolVFS`** (OPFS Access Handle Pool) — `navigator.storage.getDirectory()` +
    `createSyncAccessHandle()` en un Worker. **NO usa `SharedArrayBuffer`** para las APIs async que usa
    la capa offline (0 coincidencias de `crossOriginIsolated` en todo `expo-sqlite/web`).
    → **NO hacen falta headers COOP/COEP.** El hosting deja de ser una restricción dura.
  - ✅ **CORRECCIÓN 2 (verificado en `worker.ts:405` y `AccessHandlePoolVFS.js:218-235`):** una DB con
    **nombre de archivo** (no `:memory:`, que es nuestro caso: `wellium-offline.db`) usa SIEMPRE el VFS
    persistente. **NO hay fallback silencioso a `MemoryVFS`** — sin OPFS, `maybeInitAsync` **lanza**
    `Error('Failed to initialize AccessHandlePoolVFS')`. `MemoryVFS` solo aplica a paths `:memory:`.
    → Se implementó detección propia (`src/offline/storage-support.ts` / `.web.ts`) que lanza un error
    tipado (`OfflineStorageUnavailableError`, `db.ts`) **antes** de llegar a ese throw críptico, para que
    los consumidores degraden a network-only de forma controlada.
  - **Requisitos reales:** (1) contexto seguro **HTTPS** (o localhost) — necesario igual para SW/PWA;
    (2) navegador con OPFS + `createSyncAccessHandle` (Chrome 108+, Safari 17+, Firefox 111+);
    (3) `PRAGMA journal_mode = WAL` se **omite en web** (`db.ts`, guard `Platform.OS !== 'web'`):
    `AccessHandlePoolVFS` no provee shared-memory para el WAL-index; web queda en journal `delete`.
    `ALTER TABLE ADD COLUMN` (v2) sí corre igual en ambas plataformas dentro de
    `withExclusiveTransactionAsync`.
  - (Descartada) Opción A network-only: era la rápida, pero sin offline en web.
- **Build:** `wasm` no estaba en `assetExts` de Metro (ni en los defaults) — el worker de wa-sqlite
  importa `wa-sqlite.wasm`. Se agregó a `metro.config.js → resolver.assetExts` (inerte en nativo, el
  único `import` de `.wasm` del repo vive en `expo-sqlite/web/`).
- **Nota migraciones:** `ALTER TABLE ... ADD COLUMN` (v2) corre igual en ambas plataformas; `PRAGMA
  journal_mode = WAL` queda excluido en web por guard de plataforma (ver arriba). Pendiente: validar
  empíricamente en `npm run web` si el guard de WAL era estrictamente necesario o defensivo.

### 2.3 🟡 `expo-camera` — escáner de alimentos
- **Dónde pega:** `src/components/features/nutrition/FoodScannerView.tsx` (sin `Platform` guard),
  `FoodSearchSheet.tsx`. La cámara funciona en web (getUserMedia) pero el **escaneo de códigos de
  barras** es limitado/no garantizado.
- **Fix:** degradar con elegancia en web → ocultar el escáner o caer a búsqueda manual. Guard por plataforma.

### 2.4 🟢 Bajo riesgo (guardar para evitar ruido/errores)
- `expo-haptics` (`RulerPicker.tsx`) → no-op en web, envolver en guard.
- `expo-av` + `expo-speech` (`useSessionAudio.ts`) → funcionan vía Web Audio / Web Speech, pero
  **el autoplay requiere gesto del usuario**; validar que el primer beep salga tras interacción.
- `expo-navigation-bar` (`_layout.tsx:290`) → **ya está guardado** con `Platform.OS !== 'android'`. ✅
- `expo-updates` → OTA no aplica a web; es no-op, no molesta.
- `netinfo`, `expo-blur`, `expo-linear-gradient`, `expo-image` → web-compatibles.

---

## 3. Lo que falta para ser PWA (no solo "web")

Hoy `dist/` tiene `_expo/`, `assets/`, `assetmap.json`, `metadata.json` — **pero no** `manifest.json`
ni service worker. Para PWA instalable + offline shell hace falta:

1. **Web App Manifest**: `name`, `short_name`, `description`, `start_url`, `display: "standalone"`,
   `theme_color`, `background_color`, `orientation`, e **íconos** (incluye `maskable` 192/512).
2. **Íconos PWA + Apple**: `apple-touch-icon`, `<meta name="theme-color">`, `<meta name="apple-mobile-web-app-*">`.
3. **Service Worker**: precache del app-shell + estrategia offline (fallback page). Expo static export
   **no genera SW por defecto**; hay que agregarlo (Workbox/Serwist o SW manual en `public/`).
4. **`<head>` custom**: en expo-router se inyecta con `app/+html.tsx` (link al manifest, metas, theme-color).
5. **`public/`**: los archivos en `public/` se copian al root de `dist/` (ahí van `manifest.json`,
   `sw.js`, íconos).

---

## 4. Plan por fases (incremental, sin romper nativo)

> Cada fase es mergeable por separado. Nada toca el bundle nativo salvo lo marcado.

### Fase 0 — Baseline y evidencia
- Correr `npm run web`, navegar login → onboarding → tabs, anotar TODOS los errores de consola.
- Objetivo: lista real de lo que revienta hoy (confirma/ajusta este doc).

### Fase 1 — ✅ Token cache por plataforma (COMPLETADA)
- Se reemplazó el `tokenCache` inline de `_layout.tsx` por el built-in `@clerk/clerk-expo/token-cache`
  (nativo → SecureStore vía `createTokenCache()`; web → `undefined`, que Clerk ya ignora en ese entorno).
  Ver corrección de diagnóstico en §2.1.
- **Criterio de aceptación:** nativo sin cambios de comportamiento (typecheck + lint OK). Persistencia de
  sesión web se valida en el smoke test manual (`npm run web` → login → recargar) — no es un efecto de este
  cambio, sino de `clerk-js`/cookies; si falla, es un follow-up aparte, no repetir esta fase.

### Fase 2 — ✅ Offline real en web (Opción B, IMPLEMENTADA — pendiente smoke test)
- `metro.config.js`: `wasm` agregado a `resolver.assetExts` para que Metro sirva `wa-sqlite.wasm`.
- `src/offline/storage-support.ts` (+ `.web.ts`, nuevo): feature-detect de OPFS
  (`navigator.storage.getDirectory` + `isSecureContext`). Nativo siempre `true`.
- `src/offline/db.ts`: `getOfflineDb` lanza `OfflineStorageUnavailableError` (tipado) en web sin OPFS,
  **antes** de que el VFS lance su error críptico (ver §2.2 corrección 2). `PRAGMA journal_mode = WAL`
  excluido en web (`Platform.OS !== 'web'`) — `AccessHandlePoolVFS` no tiene shared-memory para WAL.
  Path nativo sin cambios de comportamiento.
- Consumidores auditados (`app/session.tsx`, `meal/[id].tsx`, `fitness/index.tsx`,
  `RoutineEditMode.tsx`, `useNutritionOfflineRoutine.ts`): ya tenían try/catch genérico → degradan solos
  mostrando el mensaje del error tipado. Único gap real: `useOfflineModuleStatus.ts` no tenía catch
  (unhandled rejection) → se agregó, degrada a `EMPTY_STATUS`.
- **Sin headers COOP/COEP** (ver §2.2). Servir sobre **HTTPS** (o localhost).
- **Pendiente (no verificable estáticamente):** smoke test `npm run web` — bundling del worker+wasm sin
  404, persistencia real tras F5 (DevTools → Application → OPFS → `wellium-offline.db`), migraciones v1/v2
  corriendo sin throw, y confirmar si el guard de WAL era obligatorio (tiraba error) o defensivo.
- **Criterio:** en web los datos offline **persisten tras recargar**; sin errores de SQLite; sin OPFS
  degrada a network-only sin crashear.

### Fase 3 — ✅ Degradación de features nativas (IMPLEMENTADA — pendiente smoke test)
- **Escáner de alimentos (`FoodSearchSheet.tsx`):** el botón `scan-outline` que abre `FoodScannerView`
  se envolvió en `Platform.OS !== 'web'`. En web nunca se monta `CameraView`; queda la búsqueda manual
  (ya era la vista por defecto). `FoodScannerView.tsx` no se tocó (queda inalcanzable en web).
  `useCameraPermissions()` se deja sin guard (no se puede llamar condicionalmente, rules of hooks;
  no crashea en web vía getUserMedia).
- **`RulerPicker.tsx`:** `Haptics.selectionAsync()` (única llamada, dentro del throttle de `handleScroll`)
  ahora corre bajo `if (Platform.OS !== 'web')`. Sigue vivo — consumido por
  `FitnessTrainingPreferencesConfig.tsx`, no era código muerto.
- **`useSessionAudio.ts` (DECISIÓN: audio funciona en web):** solo se guardó `configureSessionAudio()`
  (early-return en web antes de `Audio.setAudioModeAsync`, que trae keys 100% iOS/Android). Los beeps
  (`Audio.Sound`) y la voz (`Speech.speak` → Web Speech API) se dejaron intactos: la sesión arranca con
  un tap del usuario, así que hay gesto previo para desbloquear autoplay en el navegador. Si el smoke
  test muestra ruido de `expo-av` en consola web, el plan B es early-return también en los effects de
  reproducción (silencio total en web) — no se aplicó a priori.
- **Sin cambios nuevos:** typecheck (`tsc --noEmit`) y ESLint sobre los 3 archivos, limpios.
- **Criterio:** ninguna pantalla crashea en web; features no soportadas degradan con mensaje claro.
  **Pendiente (no verificable estáticamente):** smoke test `npm run web` (búsqueda de alimentos sin botón
  de escáner, ruler sin errores de haptics, audio/voz de sesión tras el tap de inicio) + regresión nativa
  (Android/Expo Go: escáner, haptics y audio funcionando igual que antes).

### Fase 4 — PWA shell (el corazón del pedido)
- Completar `app.json → web` (name, themeColor, backgroundColor, display, orientation) o `app/+html.tsx`.
- Crear `public/manifest.json` + íconos (192/512 + maskable) + `apple-touch-icon`.
- `app/+html.tsx`: `<link rel="manifest">`, metas de theme-color y apple.
- Service Worker (Serwist/Workbox o manual) en `public/sw.js` — **solo precache de app-shell + assets**
  (sin cachear API); registro condicionado a `Platform.OS === 'web'`.
- **Criterio:** Lighthouse PWA installable ✅; aparece prompt de instalación; abre standalone y offline.

### Fase 5 — Layout centrado en web (DECIDIDO: app centrada, no responsive completo)
- La UI es mobile-first; en desktop se ve una columna estirada. Agregar contenedor con `max-width`
  centrado (~480px) para el viewport web, sin tocar el layout nativo (usar `.web.tsx` o guard).
- **Criterio:** desktop web se ve como app centrada tipo móvil, no estirada.

### Fase 6 — Verificación final
- Ver checklist §5.

---

## 5. Checklist de verificación

- [ ] `npm run web` levanta sin errores de consola en login/onboarding/tabs.
- [ ] Sesión Clerk **persiste tras recargar** en web.
- [ ] Ninguna pantalla crashea por API nativa (secure-store, sqlite, camera, haptics, av).
- [ ] `dist/manifest.json` existe y es válido (name, icons, display, theme/background).
- [ ] Service worker registrado y precachea el shell.
- [ ] Lighthouse → PWA **installable** y offline fallback funciona.
- [ ] Instalable en Android (Chrome) e iOS (Add to Home Screen).
- [ ] Deep links / rutas directas (`/profile`, `/(tabs)/health`) cargan por URL.
- [ ] **Build nativo (iOS/Android) sigue idéntico** — sin regresiones (probar en Expo Go o dev build).

---

## 6. Decisiones

1. ✅ **Offline en web (Fase 2): Opción B — offline real** (wa-sqlite / OPFS `AccessHandlePoolVFS`). DECIDIDO.
   - **NO** requiere headers COOP/COEP (corregido, ver §2.2). Solo HTTPS.
2. ✅ **Hosting:** Vercel **o** VM propia en Oracle Cloud. Ambos sirven el `dist/` estático sobre HTTPS
   sin problema. No hace falta config especial de headers para SQLite. (Oracle: falta cert TLS + un
   web server como nginx/Caddy sirviendo `dist/`).

3. ✅ **Alcance del SW: solo app-shell + assets.** DECIDIDO. El offline de datos lo cubre SQLite/OPFS;
   el SW NO cachea respuestas de API (evita duplicar lógica de sync). Precache del shell → instalable
   y abre offline.
4. ✅ **Layout desktop: app centrada tipo móvil (`max-width`).** DECIDIDO. Contenedor centrado (~480px)
   para el viewport web; el layout nativo no se toca.

### Abiertas

- Ninguna. Plan cerrado y listo para implementar (empezar por Fase 1).

---

## 7. Riesgos

- **SQLite en web (OPFS):** ya no depende de headers COOP/COEP (usa `AccessHandlePoolVFS`). Riesgo real:
  navegadores sin OPFS (Safari <17, browsers viejos) → el VFS **lanza** en vez de degradar solo
  (verificado, no cae a `MemoryVFS`: ese VFS es solo para `:memory:`). Mitigado con detección propia
  (`storage-support.web.ts`) + error tipado (Fase 2, implementado). Pendiente: validar contención OPFS
  entre múltiples pestañas (fuera de alcance de Fase 2).
- **Autoplay de audio en web:** el navegador bloquea sonido sin gesto previo.
- **Clerk en web:** validar que el flujo OAuth (`expo-auth-session`/`expo-web-browser`) redirija bien
  con el `scheme`/redirect web.
- **Reanimated en web:** casi todo anda, pero algunas animaciones complejas pueden diferir; validar.

---

## 8. Archivos relevantes (mapa)

- `app.json` — config `web` (a completar para PWA).
- `app/_layout.tsx:75-93` — `tokenCache` (Fase 1).
- `src/offline/db.ts`, `src/offline/repository.ts`, `src/offline/OfflineSyncGate.tsx` — capa offline (Fase 2).
- `src/components/features/nutrition/FoodScannerView.tsx`, `FoodSearchSheet.tsx` — cámara (Fase 3).
- `src/components/common/RulerPicker.tsx` — haptics (Fase 3).
- `src/hooks/useSessionAudio.ts` — audio (Fase 3).
- `metro.config.js`, `babel.config.js` — build (ajustes menores si hace falta para SW/wasm).
- `app/+html.tsx` (a crear) — `<head>` PWA.
- `public/manifest.json`, `public/sw.js`, íconos (a crear) — PWA assets.
