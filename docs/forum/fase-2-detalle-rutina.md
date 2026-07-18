# Fase 2 — Detalle del post + rutina adjunta + flags

> Seguí las **reglas obligatorias** del [`README.md`](./README.md). Depende de Fase 0/1.

**Estado: ✅ Hecha.**

## Qué se hizo
- `src/hooks/useForumPost.ts` — detalle por id (request abortable, token por ref). 404 → "ya no disponible".
- `src/components/features/forum/FlagWarningList.tsx` — arma el texto de cada flag (Injury/Equipment) en tono
  ámbar/warning. **`flags: []` → devuelve `null`** (no renderiza NADA; regla de oro #1, jamás un verde).
- `src/components/features/forum/AttachedRoutineSnapshotView.tsx` — snapshot read-only: días → ejercicios
  (ordenados por `order`), sets/reps (según `repType`)/carga (según `loadType`)/descanso, thumbnail (gif real o
  `IconTile`). Resalta en ámbar los ejercicios cuyo `exerciseId ∈ flag.affectedExerciseIds`.
- `app/(tabs)/community/[id].tsx` — pantalla detalle (SwipeBackWrapper + header + scroll + CTA flotante),
  autor, cuerpo completo con hashtags, `FlagWarningList`, snapshot, contador de comentarios (Fase 4).
  **"Copiar rutina"** (mapea el "Save"): éxito → toast con acción "Ver mis rutinas"; **403 (`RoutineLimitError`)**
  → toast con el `Message` accionable + CTA "Mejorar plan" a `/profile/subscription`.
- `_layout.tsx` — registrada la ruta `[id]`. Verificado: `tsc` 0 errores, ESLint limpio.

### Ajuste posterior — snapshot en acordeón
- `AttachedRoutineSnapshotView` ahora muestra los días **ordenados de lunes a domingo**, **en español**
  (reutiliza `ROUTINE_DAY_FULL_LABELS` de `nutritionRoutine.utils`, que ya mapea `Monday`→`Lunes`) y en
  **acordeón** (todos colapsados por defecto; se expanden al tocar) para no ocupar espacio. El toggle usa
  `LayoutAnimation` (habilitado en Android; no-op inocuo en web). El header del día muestra cantidad de
  ejercicios + tiempo aprox. Cada día es una card colapsable con chevron.

## Objetivo
Al tocar "Ver rutina" (o la card) se abre el detalle del post: título, body completo, autor, y —si tiene—
el **snapshot de la rutina** con sus días/ejercicios, las **flags** (advertencias) resaltadas, y el botón
**"Copiar rutina"**. Este es el corazón de la regla de oro #1: **advertir, no bendecir**.

## Qué implementar

### Hook — `src/hooks/useForumPost.ts`
- `getPostDetail(id, token)` → estado `post: ForumPostDetail | null`, `isLoading`, `error`.
- 404 → tratar como "no existe" (moderación pudo ocultarlo); mostrar estado "Esta publicación ya no está disponible."

### Pantalla — `app/(tabs)/community/[id].tsx`
- `SafeAreaView bg-zinc-950`, header con back. Título + autor + tiempo + body completo (sin truncar acá).
- Si `attachedRoutine ≠ null` → `<AttachedRoutineSnapshotView routine={...} flags={...} />`.
- Si `attachedRoutine === null` → post solo texto; no mostrar sección de rutina.
- Sección de **comentarios** (`commentCount`) → se completa en Fase 4; acá puede quedar el contador + placeholder.

### Componente — `src/components/features/forum/AttachedRoutineSnapshotView.tsx`
Renderiza el snapshot (read-only, no es la rutina editable del módulo Fitness):
- Por cada día: `dayOfWeek` + `approxTimeSession` (min) + lista de ejercicios (ordenar por `order`).
- Por ejercicio: `name`, y según `repType`:
  - `Fixed` → reps fijas; `Range` → `minRep`-`maxRep`; `Timed` → `durationSeconds` s.
  - `loadType`: `ExternalWeight` → `plannedWeightKg` kg; `BodyWeight` → "peso corporal".
  - `sets`, `rest` (s). `gifUrl` opcional (thumbnail).
- **Resaltar** los ejercicios cuyo `exerciseId ∈ affectedExerciseIds` de alguna flag (borde/fondo `sky` o
  el color de warning) — matchean con `exercise.exerciseId`.

### Componente — `src/components/features/forum/FlagWarningList.tsx`
- Cada flag es **estructura, no frase** → armar el texto en el front:
  - `kind: 'Injury'` → "Puede afectar tu lesión: **{subject}**" (ej. "Hombro").
  - `kind: 'Equipment'` → "Requiere equipo que no tenés: **{subject}**" (ej. "barbell").
- Tono de **advertencia** (ámbar/warning o `sky` sobrio), nunca verde de "aprobado".
- `flags: []` → **no renderizar nada** (ni contenedor). Silencio, no aprobación. Regla de oro #1.

### Copiar rutina — botón "Copiar rutina" (mapea el "Save" de la maqueta)
- Solo si el post tiene rutina adjunta. `copyRoutine(id, token)` → `{ routineId }` (rutina nueva **inactiva**, gratis).
- Éxito: toast "Rutina copiada a tus rutinas" + opción de navegar a `routineId` (queda inactiva, no desplaza la activa).
- **403** (`RoutineLimitError`) → mostrar prompt de upgrade con el `Message` accionable del error
  (Free/Nutrición topean; Fitness/Full copian sin límite). Reutilizar el patrón de `notifyInsufficientCredits`/upgrade si aplica.
- 400 (sin rutina) / 404 (post o rutina no disponible) → toast ES.

## Gotchas / lecciones aplicables
- **NUNCA** un badge verde de "compatible con vos". Advertencias cuando hay flags, nada cuando no. Regla de oro #1.
- No inventar filas del ejercicio que el DTO no trae (nivel/tipo, etc.) — solo los campos del snapshot.
- El snapshot es **read-only**: no reutilizar el editor de rutina de Fitness; es una vista de solo lectura.
- Si el detalle vive dentro de `(tabs)`, el tab bar nativo se renderiza encima → CTA con `TAB_BAR_HEIGHT + insets.bottom`.
- 404 = ocultado por moderación o inexistente: mismo manejo, sin caso especial.

## Verificación
- `tsc --noEmit` + ESLint directo.
- Smoke: post con rutina muestra días/ejercicios; con flags resalta los ejercicios afectados y lista las
  advertencias; sin flags no muestra NADA verde. Copiar rutina crea rutina inactiva; 403 muestra upgrade.
