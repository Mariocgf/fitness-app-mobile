# Fase 3 — Crear post + resaltado de FlaggedTerms

> Seguí las **reglas obligatorias** del [`README.md`](./README.md). Depende de Fase 0/1.

**Estado: ✅ Hecha.**

## Qué se hizo
- **Duda del `versionId` RESUELTA** (sin inventar): el modelo `Routine` de Fitness expone `activeVersionId`
  (la versión cuyo contenido está en `days[]`, la que ve el usuario). El `RoutineSummary` de los listados NO
  lo trae, así que al elegir una rutina se pide `getRoutineById` y se usa `activeVersionId` (fallback a
  `latestVersionId`). Si ninguna existe, la rutina no se puede adjuntar (toast, no se inventa un id).
- `src/hooks/useCreatePost.ts` — dueño del form (title/body/attachedRoutine). Submit → `createPost`.
  422 (`ContentBlockedError`) → guarda `flaggedTerms`; editar el cuerpo limpia el aviso.
- `src/components/features/forum/HighlightedTextInput.tsx` — resalta los términos marcados **DENTRO del
  cuadro** con la técnica de "backdrop" (un `<Text>` detrás pinta los rectángulos rojos, texto transparente;
  el `TextInput` encima muestra el texto real y el cursor). Funciona en nativo y PWA. Reemplazó al preview
  read-only `FlaggedTermsText` (borrado). Lo usan el cuerpo de crear post y el `CommentComposer`.
- `src/components/features/forum/AttachRoutinePicker.tsx` — selector **inline** de rutinas propias
  (reutiliza `useRoutinePreview`), SIN `Modal` → idéntico en nativo y PWA. Resuelve `activeVersionId` al elegir.
- `app/(tabs)/community/new.tsx` — pantalla del form: `KeyboardAvoidingView` (`padding` solo en iOS),
  `keyboardShouldPersistTaps="handled"`, banner de términos marcados (chips + resaltado en el cuadro), CTA
  "Publicar" en el header. Éxito → `toast` + `router.navigate('/community')` (vuelve al feed, que se refresca
  al reenfocarse y muestra el post arriba). **NO** navega al detalle del post recién creado: un GET-by-id
  inmediato puede 404 por consistencia eventual y mostraba "esta publicación ya no está disponible" aunque el
  post SÍ se creó. El feed usa `useFocusEffect` (salteando el primer montaje) para refrescar al volver.
- `_layout.tsx` — registrada la ruta `new` (push normal, NO modal: un modal taparía el tab bar y rompería el
  cálculo `TAB_BAR_HEIGHT`, además de comportarse distinto en web). Salda la deuda del botón "Publicar" del feed.
- Verificado: `tsc` 0 errores, ESLint limpio.

## Objetivo
El usuario escribe un post (título + body), opcionalmente **adjunta una rutina propia**, y publica. Si el
back rechaza por política de contenido (**422**), devuelve los `FlaggedTerms` y el front los **resalta en el
input** para que el usuario los corrija. Este es el segundo flujo que el usuario pidió explícitamente.

## Qué implementar

### Hook — `src/hooks/useCreatePost.ts`
- Estado: `title`, `body`, `attachedRoutineVersionId?`, `isSubmitting`, `error`, `flaggedTerms: string[]`.
- `submit()` → `createPost({ title, body, attachedRoutineVersionId }, token)`.
  - Éxito → devuelve `{ id, createdAt }`; la pantalla navega al detalle o vuelve al feed y refresca.
  - **422** (`ContentBlockedError`) → setear `flaggedTerms = e.flaggedTerms`; NO se publicó. No navegar.
  - 400 (título/body vacíos, o rutina ajena/inexistente) / 401 → error ES.
- Validación local mínima: título y body no vacíos (el back igual valida).

### Pantalla — `app/(tabs)/community/new.tsx`
- `SafeAreaView bg-zinc-950`, header con back + CTA "Publicar" (deshabilitado si falta título/body o `isSubmitting`).
- Input de **título** y **body** (multilínea). Acento `sky` en focus.
- **Adjuntar rutina (opcional)**: selector de **una versión de rutina TUYA** (`attachedRoutineVersionId`).
  - Reutilizar el listado de "mis rutinas" de Fitness (`useRoutinePreview`/`useMyRoutines` o `getRoutineById`)
    para elegir cuál adjuntar. **Debe ser una rutina propia** (el back rechaza rutina ajena con 400).
  - `null` = post solo texto (válido).
  - ⚠️ Confirmar de dónde sale el **`versionId`** (¿el `id` de la rutina o un id de versión?). Si el modelo de
    Fitness no expone `versionId` directo, dejar el adjuntar-rutina **detrás de bandera** y registrar la duda en
    las lecciones antes de inventar el id (regla "no inventar campos").

### Componente — `src/components/features/forum/FlaggedTermsText.tsx` (o realce en el input)
- Tras un 422, resaltar cada término de `flaggedTerms` dentro del body (fondo rojo/warning sobre la palabra).
- Como los `TextInput` de RN no pintan rangos internos, opciones:
  1. Mostrar un **banner** arriba del input: "Estos términos no están permitidos: `matate`. Editá el texto para publicar."
     con los términos en chips rojos, + resaltado visual del body en un preview read-only (`FlaggedTermsText`).
  2. Limpiar `flaggedTerms` en cuanto el usuario edita el body (para que el aviso no quede pegado).
- El filtro es **angosto** (amenazas/autodaño, ej. "matate"), NO insultos. No filtrar del lado del cliente:
  solo reaccionar al 422 del back.

## Gotchas / lecciones aplicables
- **PascalCase**: los términos vienen en `error.response.data.FlaggedTerms`. `ContentBlockedError` ya lo expone (Fase 0).
- No poner `getToken` en deps de effects con `setState` (lección de loops).
- CTA "Publicar" sobre tab bar / teclado: cuidar `KeyboardAvoidingView` + `insets`. Si es ruta dentro de `(tabs)`,
  sumar `TAB_BAR_HEIGHT`.
- No implementar imágenes en el post (fuera de esta versión).

## Verificación
- `tsc --noEmit` + ESLint directo.
- Smoke: publicar texto simple funciona y aparece en el feed (más nuevo primero). Publicar con un término
  prohibido (ej. "matate") devuelve 422, NO publica, y resalta el término. Adjuntar rutina propia publica con rutina.
