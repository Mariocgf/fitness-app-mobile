# Fase 4 — Interacciones sociales (like, comentarios, reportar)

> Seguí las **reglas obligatorias** del [`README.md`](./README.md). Depende de Fase 0/1/2.

**Estado: ✅ Hecha.**

## Qué se hizo
- **Like optimista** en el feed (`useForumFeed.toggleLike`): actualiza al toque, reconcilia con el total real
  del backend y **revierte al snapshot exacto** si falla. El detalle NO trae likes (el contrato no los
  devuelve) → no se muestran ahí (no se inventan). `ForumPostCard` ahora tiene el corazón interactivo
  (`onToggleLike`) y el ícono de comentario abre el detalle.
- **Comentarios** (`useForumComments`): listar paginado (más nuevos primero) + crear. Al crear con éxito
  **refetchea la 1ª página** (evita fabricar `authorName`, que el back no devuelve al crear). 422
  (`ContentBlockedError`) → resalta `FlaggedTerms` en el composer (mismo patrón que crear post).
  Componentes: `CommentItem` (autor/tiempo/cuerpo + denunciar) y `CommentComposer` (input + banner 422).
- **Denunciar** post y comentario vía `confirm` (cross-platform, mismo host en nativo/PWA). `hidden: true`
  → post: `router.back()`; comentario: `removeComment` local. 400 ("tu propio contenido") → toast del back.
- **Detalle rediseñado**: "Copiar rutina" pasó de CTA flotante a **botón inline** (tras el snapshot) para
  liberar el fondo; los comentarios (lista + composer) van dentro de un `KeyboardAvoidingView`
  (`padding` solo iOS) con `keyboardShouldPersistTaps="handled"`. Sin `Modal` ni sticky absoluto → robusto
  en nativo y PWA.
- Verificado: `tsc` 0 errores, ESLint limpio (saqué un `const SKY` sin usar en `CommentComposer`).

### Ajustes posteriores — comentar más directo + preview en el feed
- **Tocar el ícono de comentar en la card** navega al detalle con `?focusComment=1`, que auto-enfoca el
  `CommentComposer` (prop `autoFocus`) para escribir sin pasos extra.
- **Preview de comentarios en la card del feed** (`useCommentPreview`): muestra los últimos 2 comentarios
  por post. Como el feed NO devuelve comentarios (solo `commentCount`) y no hay endpoint batch, se piden por
  post — pero **lazy, de a 2 y solo si `commentCount > 0`**; la virtualización de `FlatList` hace que solo las
  cards visibles disparen la llamada. Es best-effort: si falla, la card no muestra preview (no rompe).

### Ajuste posterior — teclado del composer (inline, sube al enfocar)
- El `CommentComposer` va **inline al final** del `ScrollView` (después de la lista), NO como barra fija (una
  barra siempre visible quedaba fea). Al **enfocarlo** (tap directo o llegando con `?focusComment=1` →
  `autoFocus`) sube encima del teclado y la pantalla **scrollea hasta él** (`onFocus` → `scrollToEnd`).
- Se sacó el `KeyboardAvoidingView` (su `keyboardVerticalOffset` + el padding del tab bar dejaban una
  **franja negra** entre input y teclado). En su lugar: `automaticallyAdjustKeyboardInsets` (iOS) +
  `adjustResize` (Android, default) para insertar el scroll sobre el teclado, y `paddingBottom` **dinámico**
  (`isKeyboardVisible ? 24 : insets.bottom + TAB_BAR_HEIGHT + 24`, con `useKeyboardHeight`) para que no quede
  gap con el teclado abierto ni el input tapado por el tab bar cuando está cerrado.
- Tocar el ícono de comentar en la card del feed → navega con `?focusComment=1` → `autoFocus` dispara
  `onFocus` → `scrollToEnd`: baja al input, lo enfoca y abre el teclado.
- **Pendiente de smoke test (Android):** confirmar el comportamiento del teclado en dispositivo real.

## Objetivo
Cerrar el contrato social: **like** (toggle optimista), **comentarios** (listar + crear, con manejo 422),
y **reportar** post/comentario (umbral de denuncias → contenido oculto).

## Qué implementar

### Like — toggle optimista
- En `ForumPostCard` (feed) y en el detalle: el corazón usa `likedByMe` + `likeCount`.
- `toggleLike(id, token)` → `{ liked, likeCount }`. **UI optimista**: actualizar al toque y reconciliar con la
  respuesta; revertir si falla. El like es **status, sin créditos ni recompensa** (no mostrar puntaje/score).
- 404 → post inexistente: revertir + toast.

### Comentarios — `src/hooks/useForumComments.ts` + UI
- `fetchComments(id, token, page, pageSize)` → `PagedResponse<Comment>` (planos, más nuevos primero, paginado).
- `createComment(id, { body }, token)` → `{ id, createdAt }`. Tras crear: prepend optimista o refetch de la 1ª página.
- Componentes: `CommentList` (lista + loadMore) y `CommentInput` (textarea + enviar).
- **Comentarios planos** (sin anidar, sin respuestas a respuestas).
- Errores: 400 (vacío/muy largo), 404 (post oculto/inexistente → no se comenta un post no visible),
  **422** (`ContentBlockedError`) → resaltar `FlaggedTerms` en el input del comentario (reutilizar el patrón de Fase 3).
- Comentarios ocultos por moderación simplemente no aparecen en el listado.

### Reportar — post y comentario
- `reportPost(id, reason?, token)` y `reportComment(id, reason?, token)` → `{ reported, hidden }`.
- Acción desde un menú `···` en la card/detalle y en cada comentario. `reason` opcional (ej. sheet con motivos).
- **Idempotente**: denunciar dos veces no suma. `hidden: true` = superó el umbral de **3 denunciantes distintos**
  → el contenido queda oculto: sacarlo del feed/detalle/listado (tratarlo como "ya no existe").
- 400 → **no podés denunciar lo tuyo** (toast claro). 404 → inexistente.

## Gotchas / lecciones aplicables
- UI optimista: guardar el estado previo para revertir ante error; no dejar el contador desincronizado.
- **PascalCase** en el 422 del comentario: `FlaggedTerms` (mismo `ContentBlockedError` de Fase 0).
- No mostrar score/puntaje ni "vistas" (no existen; ver mapeo del README).
- No reintroducir `Modal` de RN para el sheet de reportar si flota mal sobre el tab bar → usar overlay absoluto
  o el sheet ya usado en el repo (`BottomSheetModal` propio). Consultar `src/components/common` antes de crear.
- `authorName` vacío en comentarios → "Usuario eliminado" (igual que en el feed).

## Verificación
- `tsc --noEmit` + ESLint directo.
- Smoke: like togglea y persiste tras refresh; comentar aparece arriba; comentar con término prohibido devuelve
  422 y resalta; reportar propio da 400; reportar de otros responde `reported: true`; al 3er denunciante el
  contenido desaparece. Expo Go + web.

---

## Cierre del módulo
Con la Fase 4 el contrato de [`frontend-integration.md`](./frontend-integration.md) queda cubierto salvo lo
explícitamente **fuera de esta versión**: subir/mostrar imágenes, badges/reconocimiento, contador de vistas.
No implementar esos hasta que el backend los exponga.
