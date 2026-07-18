# Fase 1 — Feed + ForumPostCard

> Seguí las **reglas obligatorias** del [`README.md`](./README.md). Depende de Fase 0.

**Estado: ✅ Hecha.**

## Objetivo
El tab "Comunidad" muestra el feed paginado de posts con la card de estilo maqueta, mapeada a
**campos reales** (ver *Mapeo maqueta → dato real* del README). Sin detalle todavía (Fase 2).

## Qué se hizo
- `src/utils/relative-time.ts` — `formatRelativeTime` (granularidad minutos/horas/días → fecha corta).
  Complementa a `formatRelativeDay` (que es de días) para el "hace 3 min" del feed.
- `src/components/features/forum/HashtaggedText.tsx` — resalta `#hashtags` en `sky-400` (cosmético,
  parsea el texto). Reutilizable en card y detalle.
- `src/components/features/forum/ForumPostCard.tsx` — card dark: avatar-inicial + autor ("Usuario
  eliminado" si vacío) + tiempo relativo, título, body truncado (`numberOfLines`), "Ver rutina" solo si
  `attachedRoutineVersionId ≠ null`, footer con like/comentarios (SOLO lectura; interacción en Fase 4).
  **No** renderiza imagen/métricas/vistas/score (no existen).
- `src/hooks/useForumFeed.ts` — feed paginado: `refresh`/`loadMore`, token por `getTokenRef`, sin fetch
  duplicado, guardas `inFlightRef` contra disparos solapados, `hasNextPage = posts.length < totalCount`.
- `app/(tabs)/community/index.tsx` — `FlatList` con pull-to-refresh, scroll infinito, estados
  loading/empty/error, `paddingBottom` = `insets.bottom + TAB_BAR_HEIGHT + 16`. Header con CTA "Publicar".
- Verificado: `tsc --noEmit` = 0 errores; ESLint sin hallazgos. Se consolidaron los imports de
  `react-native`/`safe-area-context` (lección `import/no-duplicates`).

## Deuda puntual (se salda en Fase 2/3)
- Tocar una card navega a `/community/{id}` y "Publicar" a `/community/new`; esas rutas todavía NO existen
  (llegan en Fase 2 y 3). Hasta entonces Expo Router muestra "Unmatched Route" al tocar. Cableado a propósito.

## Qué implementar

### Hook — `src/hooks/useForumFeed.ts`
- Estado: `posts: ForumPostSummary[]`, `isLoading`, `isRefreshing`, `isLoadingMore`, `error`, `hasNextPage`, `page`.
- `refresh()` (page 1) y `loadMore()` (siguiente página, concatena). `hasNextPage` = `posts.length < totalCount`.
- Token vía `getTokenRef` (ref estable, **no** en deps del effect — lección de loops).
- Primera carga en `useFocusEffect` **o** `useEffect`, no ambos (lección de fetch duplicado).

### Card — `src/components/features/forum/ForumPostCard.tsx`
Dark-only, `bg-zinc-900`, `rounded-2xl`, `border-zinc-800`, acento `sky-400`. Layout inspirado en la maqueta:
- **Header**: avatar-placeholder (inicial del autor en un `IconTile`/círculo `zinc-800`) + `authorName` +
  tiempo relativo desde `createdAt` (util `formatRelativeTime` — reutilizar si existe, si no crear en `src/utils`).
  - `authorName` vacío → **"Usuario eliminado"** (placeholder, lección de autor eliminado).
- **Título** (`title`, bold) + **body truncado** (`numberOfLines={3}` o helper de truncado; el back manda el body COMPLETO).
  - Hashtags: resaltar `#palabra` en `sky-400` (cosmético, parseando el texto). Átomo `HashtaggedText` si conviene.
- **Footer social**: `❤️ likeCount` + `💬 commentCount` (solo lectura en esta fase; interacción en Fase 4).
- Si `attachedRoutineVersionId ≠ null` → botón/label **"Ver rutina"** (acento sky). En esta fase puede navegar
  al detalle (Fase 2) o quedar como `onPress` que la pantalla resuelve.
- **No** renderizar: imagen, métricas de workout, vistas, "Save" (ver mapeo). No inventar.

### Pantalla — `app/(tabs)/community/index.tsx`
- Reemplaza el placeholder de Fase 0. `SafeAreaView bg-zinc-950` + título "Comunidad".
- `FlatList` de `ForumPostCard` con `onEndReached → loadMore`, `refreshing/onRefresh → refresh`,
  `ListFooterComponent` con spinner cuando `isLoadingMore`.
- Estados: **loading** (skeletons de card), **empty** ("Todavía no hay publicaciones."), **error** (mensaje ES + retry).
- `contentContainerStyle` con `paddingBottom` que sume `TAB_BAR_HEIGHT + insets.bottom` (tab bar nativo encima).
- Botón flotante o header-action **"Publicar"** que navega a `community/new` (la pantalla llega en Fase 3;
  hasta entonces puede quedar deshabilitado o navegar a un placeholder).

## Gotchas / lecciones aplicables
- Truncar en la card, no pedir excerpt (no existe). Regla de oro #2.
- Skeletons mientras carga (agent.md §6). Reutilizar patrón de skeleton del repo, no inventar uno nuevo sin mirar.
- Consultar `src/components/common` antes de crear átomos (avatar, hashtag text): reutilizar `IconTile`/`FillBar`/etc.
- Padding inferior sobre tab bar nativo: `TAB_BAR_HEIGHT` (de `routine-detail-shared`), no `mb`.

## Verificación
- `tsc --noEmit` + ESLint directo.
- Smoke: feed carga, scroll infinito trae más, pull-to-refresh, empty/error se ven. Card sin campos inventados.
