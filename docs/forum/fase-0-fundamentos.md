# Fase 0 — Fundamentos + tab (sin UI de features)

> Seguí las **reglas obligatorias** del [`README.md`](./README.md) (agent.md + lecciones + contrato).

**Estado: ✅ Hecha.**

## Objetivo
Dejar armada la base datos-y-servicios del módulo y el punto de entrada (tab + rutas), **sin UI de
features**. Así las fases 1-4 solo consumen estas capas y navegan sobre el scaffolding.

## Qué se hizo
- `src/types/forum.ts` — todos los DTOs del contrato (`PagedResponse<T>`, `ForumPostSummary`,
  `ForumPostDetail`, `ForumAttachedRoutine`/`ForumRoutineDay`/`ForumRoutineExercise`, `ForumFlag`,
  `ForumComment`, payloads, resultados de acción y `ForumErrorBody` en PascalCase).
- `src/services/forum.service.ts` — 9 endpoints (`createPost`, `fetchFeed`, `getPostDetail`,
  `copyRoutine`, `toggleLike`, `reportPost`, `createComment`, `fetchComments`, `reportComment`) con
  `unwrapApiData`, `mapForumError` (con overrides por código) y las clases `ContentBlockedError` (422,
  expone `flaggedTerms`) y `RoutineLimitError` (403 al copiar). Los 422 se parsean del cuerpo PascalCase.
- `colors.md` — módulo Foro/Comunidad = `sky-400`.
- `app/(tabs)/_layout.tsx` — 5º tab "Comunidad" (ícono `people`/`people-outline`).
- `app/(tabs)/community/_layout.tsx` (Stack) + `index.tsx` (placeholder, feed real en Fase 1).
- Verificado: `tsc --noEmit` = 0 errores en todo el proyecto; ESLint sin hallazgos en los archivos nuevos.

## Qué implementar

### Tipos — `src/types/forum.ts`
DTOs 1:1 con el contrato (ver [`frontend-integration.md`](./frontend-integration.md)):
- `PagedResponse<T>` — `{ page, pageSize, totalCount, items: T[] }` (reutilizable en feed y comentarios).
- `ForumPostSummary` — feed: `id, authorId, authorName, title, body, attachedRoutineVersionId, likeCount, likedByMe, commentCount, createdAt`. `authorName` puede venir **vacío** (autor eliminado).
- `ForumPostDetail` — `id, authorId, authorName, title, body, createdAt, commentCount, attachedRoutine, flags`.
- `AttachedRoutineSnapshot` — `{ versionId, days: RoutineDaySnapshot[] }`; día = `{ dayOfWeek, approxTimeSession, exercises }`; ejercicio = `{ exerciseId, name, gifUrl, order, sets, repType, minRep, maxRep, durationSeconds, rest, loadType, plannedWeightKg, primaryMuscleGroup }`.
- Uniones como **string**: `RepType = 'Fixed'|'Range'|'Timed'`, `LoadType = 'BodyWeight'|'ExternalWeight'`, `FlagKind = 'Injury'|'Equipment'`.
- `ForumFlag` — `{ kind: FlagKind, subject: string, affectedExerciseIds: string[] }`.
- `Comment` — `{ id, authorId, authorName, body, createdAt }`.
- Payloads: `CreatePostRequest` (`title`, `body`, `attachedRoutineVersionId?`), `CreateCommentRequest` (`body`), `ReportRequest` (`reason?`).
- Respuestas de acción: `CreatePostResult` (`id`, `createdAt`), `CopyRoutineResult` (`routineId`), `LikeToggleResult` (`liked`, `likeCount`), `ReportResult` (`reported`, `hidden`).
- **`ForumErrorBody`** (PascalCase): `{ StatusCode, Message, Timestamp, FlaggedTerms?: string[] }`.

### Service — `src/services/forum.service.ts`
Molde: `nutritionRoutine.service.ts` (mismo `apiClient`, `unwrapApiData`, Bearer, mapeo ES). Base `/api/forum`.
Funciones (todas reciben `token` y opcional `signal`):
- `createPost(payload, token)` → `CreatePostResult`.
- `fetchFeed(token, page, pageSize)` → `PagedResponse<ForumPostSummary>`.
- `getPostDetail(id, token)` → `ForumPostDetail`.
- `copyRoutine(id, token)` → `CopyRoutineResult`.
- `toggleLike(id, token)` → `LikeToggleResult`.
- `reportPost(id, reason, token)` → `ReportResult`.
- `createComment(id, payload, token)` → `{ id, createdAt }`.
- `fetchComments(id, token, page, pageSize)` → `PagedResponse<Comment>`.
- `reportComment(id, reason, token)` → `ReportResult`.

Errores (helper `mapForumError` + parseo del **cuerpo PascalCase**):
- `ContentBlockedError` (422) — clase con `flaggedTerms: string[]` leídos de `error.response.data.FlaggedTerms`.
  `isContentBlockedError(e)` helper. La usan crear post y comentar (Fase 3/4) para resaltar términos.
- `RoutineLimitError` (403 al copiar) — expone `error.response.data.Message` (texto accionable de upgrade).
  `isRoutineLimitError(e)` helper. La usa copiar rutina (Fase 2).
- 400/404/401 → mensajes ES amigables (`Post no encontrado.`, `No podés denunciar tu propio post.`, etc.).
- **404 = "no existe"**: contenido oculto por moderación devuelve 404; tratarlo como inexistente, sin manejo especial.

### Acento — `colors.md`
Agregar sección **Módulo Foro / Comunidad → `sky-400`** (claro y oscuro). Referencia: `#38bdf8`.

### Tab — `app/(tabs)/_layout.tsx`
Agregar 5º `<Tabs.Screen name="community">`, `title: 'Comunidad'`, ícono `people`/`people-outline`
(mismo patrón que los otros tabs). Ubicarlo después de `health` (o donde el orden lea mejor).

### Rutas (scaffolding) — `app/(tabs)/community/`
- `_layout.tsx` — `Stack` con `headerShown: false` (igual que `nutrition/_layout.tsx`).
- `index.tsx` — placeholder liviano: `SafeAreaView bg-zinc-950` + título "Comunidad". El feed real llega en Fase 1.
- (Los `[id].tsx` y `new.tsx` se agregan en sus fases.)

## Gotchas / lecciones aplicables
- **PascalCase en errores**: `error.response.data.FlaggedTerms`, NO `flaggedTerms`. Es el error más fácil de comer.
- Verificar la forma real de la respuesta: puede venir plana o `{ data: ... }` → usar `unwrapApiData` (patrón del repo).
- No montar nada pesado en el placeholder; es solo un contenedor hasta Fase 1.
- 5 tabs pueden apretar labels en pantallas chicas: verificar en Expo Go que no se corten.

## Verificación
- `node .\node_modules\typescript\bin\tsc --noEmit` → 0 errores en archivos nuevos.
- ESLint directo sobre los archivos nuevos.
- Smoke: abrir la app, ver el tab "Comunidad", tocarlo y ver el placeholder. Expo Go + web.

## Notas para la próxima fase
- El service ya expone `fetchFeed`; Fase 1 solo arma el hook `useForumFeed` y la card.
