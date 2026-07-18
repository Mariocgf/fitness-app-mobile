# Foro / Comunidad — Índice de implementación

Índice maestro de la implementación del módulo **Foro (tab "Comunidad")** en el Frontend
(RN + Expo). El detalle de cada fase vive en su propio archivo para poder retomar el
trabajo en un chat nuevo sin cargar todo el contexto.

Contrato de backend: [`./frontend-integration.md`](./frontend-integration.md) (API ya implementada, Fases 0-7 del back).

---

## ⚠️ Reglas obligatorias (leer antes de tocar código)

Esta implementación se rige por tres documentos. **No se avanza sin respetarlos:**

1. **[`../../agent.md`](../../agent.md)** — arquitectura y estilo:
   - Código (variables, funciones, archivos) en **inglés**; comentarios y docs en **español**.
   - `app/` = rutas/pantallas (contenedores livianos que orquestan hooks + componentes de `src`).
   - `src/` = dominio (`api`, `services`, `hooks`, `types`, `store`, `components`).
   - Estilos **solo NativeWind** (`className`); evitar `StyleSheet.create`.
   - Toda petición en `try/catch`; errores como mensajes ES amigables desde `services`/`hooks`.
   - Siempre loading states / skeletons mientras se espera al backend.

2. **[`../agent-implementation-lessons.md`](../agent-implementation-lessons.md)** — errores ya cometidos que NO se repiten. Los más relevantes para este módulo:
   - `docs/component-library.md` **no existe**: verificar átomos directo en `src/components/common`. Reutilizar antes de crear; atomizar lo repetido; `grep` antes de borrar huérfanos.
   - **No inventar campos que el DTO no trae** (ver *Mapeo maqueta → dato real* abajo). Degradar con criterio.
   - Overlays grandes = `View`/`Animated.View` absoluto, **nunca `Modal`** de RN (flota sobre navegación y tab bar).
   - CTA sobre tab bar nativo = `insets.bottom + TAB_BAR_HEIGHT` (de `routine-detail-shared`); rutas pusheadas fuera de `(tabs)` = solo `insets.bottom`.
   - App **dark-only** `zinc`; status bar `style="light"`.
   - No poner funciones inestables (`getToken`, callbacks) en deps de effects que hacen `setState`; fijar con `useRef`.
   - Verificar con `tsc --noEmit` + ESLint directo (`node .\node_modules\eslint\bin\eslint.js`), no solo `expo lint`. Smoke test en Expo Go **y** web/PWA.

3. **[`./frontend-integration.md`](./frontend-integration.md)** — contrato + sus **3 reglas de oro** (repetidas abajo por su peso).

> **Si aparece un error nuevo durante la implementación, registrarlo en
> [`../agent-implementation-lessons.md`](../agent-implementation-lessons.md)** (tabla `| Error | Qué pasó | Corrección aplicada |`).

---

## Reglas de oro del contrato (no negociables)

1. **No existe el "compatible ✓".** El detalle trae `flags` (advertencias). Lista vacía **NO** es "aprobado":
   solo significa "no se detectaron incompatibilidades". **Nunca** un badge verde de "compatible con vos".
   Mostrá advertencias cuando hay flags, **nada** cuando no. El sistema **advierte, no bendice**.
2. **El feed trae el `body` COMPLETO.** No hay "excerpt": **truncá vos** en la card.
3. **Errores en PascalCase, éxitos en camelCase.** OK → `likeCount` (camelCase). Errores → `StatusCode`,
   `Message`, `FlaggedTerms` (**PascalCase**, los serializa otro componente). Ojo al parsear cuerpos de error.

---

## Mapeo maqueta → dato real (crítico)

La maqueta de referencia es **inspiración visual, no contrato**. Se respeta el ESTILO (card oscura
redondeada, header de autor, footer social) pero mapeado a los campos que el backend **sí** devuelve.
**No se renderiza lo que no tiene fuente** (misma regla que "Marca/Nivel/Vistas inventadas" de las lecciones):

| Elemento de la maqueta | ¿Existe en el back? | Qué hacemos |
|---|---|---|
| Avatar + nombre + "Posted 3m ago" | `authorName` + `createdAt` (sin avatar/verificado) | Nombre + tiempo relativo. Avatar = inicial/placeholder. Sin ✓ verificado. |
| Cuerpo + hashtags en color | `body` (texto plano) | Body truncado. Hashtags = se resaltan en `sky-400` parseando `#palabra` del texto (cosmético). |
| Imagen / mapa de fondo | ❌ No soportado esta versión | **No se renderiza.** |
| Minutos / kcal / km / score | ❌ No hay métricas de workout por post | **No se renderizan.** |
| Contador de vistas (👁 5.874) | ❌ Fuera de esta versión | **No se renderiza.** |
| ❤️ 215 (likes) | `likeCount` + `likedByMe` | Sí. Interacción en Fase 4. |
| 💬 11 (comentarios) | `commentCount` | Sí. Listar/crear en Fase 4. |
| 🔖 Save | ❌ No hay "bookmark" | Se mapea a **"Copiar rutina"** (endpoint real, Fase 2) **solo** si el post tiene rutina adjunta. |
| Botón "ver rutina" | `attachedRoutineVersionId ≠ null` | Sí → abre el detalle con el snapshot de la rutina. |

---

## Arquitectura transversal

**Capas** (siguen los patrones existentes del repo — mirar `nutritionRoutine.service.ts` como molde):

- `src/types/forum.ts` — DTOs del contrato: `ForumPostSummary`, `ForumPostDetail`, `AttachedRoutineSnapshot`,
  `ForumFlag`, `Comment`, `PagedResponse<T>`, payloads de crear post/comentar/reportar, y `ForumErrorBody`
  (PascalCase, con `FlaggedTerms`).
- `src/services/forum.service.ts` — todos los endpoints `/api/forum/*` + `unwrapApiData` local +
  `mapForumError` (mapea 400/401/403/404/422 a ES) + `ContentBlockedError` (422, expone `flaggedTerms`) +
  `RoutineLimitError` (403 al copiar, expone el `Message` accionable).
- `src/hooks/` — `useForumFeed` (paginado), `useForumPost` (detalle), `useForumComments`, `useCreatePost`.
- `src/components/features/forum/` — UI (`ForumPostCard`, `AttachedRoutineSnapshotView`, `FlagWarningList`,
  `CreatePostView`, `CommentList`, `CommentInput`, `FlaggedTermsText`, …).
- `app/(tabs)/community/` — rutas: `_layout.tsx` (Stack), `index.tsx` (feed), `[id].tsx` (detalle), `new.tsx` (crear).

**Acento visual**: **`sky-400`** (`#38bdf8`). El foro es transversal (no Fitness/Nutrición/Salud), así que
estrena acento propio para no chocar con `lime`/`amber`/`rose`. Se agrega a [`../../colors.md`](../../colors.md).
Fondo `zinc-950`, cards `zinc-900`, bordes `zinc-800` (dark-only, igual que el resto).

**Tab**: 5º tab **"Comunidad"** en `app/(tabs)/_layout.tsx`, ícono `people`/`people-outline`.

**Auth**: todos los endpoints requieren Bearer JWT (Clerk) → `getToken()` en cada service. Sin token = 401.

**Paginación**: `page` (1-based, default 1) + `pageSize` (default 10, máx 50). Más nuevos primero.

---

## Fases

| Fase | Estado | Documento | Resumen |
|---|---|---|---|
| 0 | ✅ Hecha | [`fase-0-fundamentos.md`](./fase-0-fundamentos.md) | Tipos, service (todos los endpoints), errores PascalCase, acento `sky`, tab "Comunidad", scaffolding de rutas. Sin UI de features. |
| 1 | ✅ Hecha | [`fase-1-feed.md`](./fase-1-feed.md) | Feed paginado + `ForumPostCard` (estilo maqueta → campos reales) + truncado + estados + autor eliminado. |
| 2 | ✅ Hecha | [`fase-2-detalle-rutina.md`](./fase-2-detalle-rutina.md) | Detalle del post: snapshot de rutina (días/ejercicios), flags resaltadas, botón "Copiar rutina" (403 upgrade). |
| 3 | ✅ Hecha | [`fase-3-crear-post.md`](./fase-3-crear-post.md) | Crear post: título/body + adjuntar rutina propia (opcional) + manejo 422 con `FlaggedTerms` resaltados en el input. |
| 4 | ✅ Hecha | [`fase-4-interacciones.md`](./fase-4-interacciones.md) | Like (toggle optimista), comentarios (listar + crear con 422), reportar post/comentario (umbral → oculto). |

> **Módulo completo.** El contrato de `frontend-integration.md` queda cubierto salvo lo explícitamente fuera de
> esta versión (imágenes, badges, contador de vistas). Deuda menor pendiente: refrescar el feed al volver de
> crear/dar like (hoy requiere pull-to-refresh).

> Cadena de dependencias: **0 → 1 → 2 → 3 → 4**. Cada fase deja `tsc`/ESLint verdes y un smoke test
> (Expo Go + web) antes de pasar a la siguiente.
