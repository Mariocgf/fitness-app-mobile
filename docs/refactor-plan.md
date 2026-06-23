# Plan de Refactorización — wellium (Frontend)

> **Objetivo:** reordenar y limpiar el código por fases, eliminando código muerto y duplicado, partiendo archivos sobrecargados en componentes/hooks reutilizables, y dejando la app legible y optimizada — **sin cambiar comportamiento visible** salvo donde se indique.

> **Cómo se usa este documento:** las fases están ordenadas por **riesgo creciente y dependencia**. Se ejecutan en orden. Cada fase tiene un *gate* de verificación que debe pasar antes de avanzar. Marcá los checkboxes a medida que avanzás. No saltees fases.

---

## 0. Diagnóstico inicial (línea base)

Medido sobre `app/` + `src/` al inicio del plan:

| Métrica | Valor |
|---------|-------|
| Archivos `.ts`/`.tsx` | **249** |
| Líneas de código totales | **~29.734** |
| Archivos del template Expo muertos (isla autocontenida) | **13 archivos / ~504 líneas** |
| Archivos con `console.log/warn/error` | **38** |
| Archivos con `StyleSheet.create` | **6** |
| Archivos > 400 líneas (candidatos a partir) | **12 archivos / ~7.701 líneas (≈26% del código en ≈5% de los archivos)** |
| Archivos con `: any` / `as any` | **25** |
| `TODO/FIXME/HACK` | **1 archivo** (muy limpio) |
| Capa de servicios | 18 servicios, todos sobre `api/client` (consistente — **no se toca**) |

**Lo que YA está bien (no se toca):**
- Organización feature-based (`components/features/<modulo>`, `hooks/`, `services/`, `store/`, `types/`, `utils/`). Es la estructura correcta.
- Capa de servicios homogénea sobre `axios` (`api/client.ts`).
- Biblioteca de átomos/comunes documentada en `docs/component-library.md` — el equipo ya reutiliza bien.
- Tema dark-only forzado, criterio claro de migración en `pending-changes.md`.

**Regla transversal de tamaño** (objetivo, no dogma):
- Pantallas (`app/**`): **≤ 250 líneas**
- Componentes: **≤ 300 líneas**
- Hooks: **≤ 200 líneas**
- Si un archivo supera el umbral, se parte en sub-componentes + hooks. Excepciones se documentan en el propio archivo con un comentario que justifique por qué.

---

## Fase 0 — Red de seguridad (antes de tocar nada) — ✅ HECHO

**Por qué primero:** no se refactoriza sin una red. Si los tests no corren hoy, cualquier cambio es a ciegas.

**Línea base registrada (2026-06-23, branch `redesing`):**

| Check | Resultado base |
|-------|----------------|
| `npx tsc --noEmit` | **0 errores** ✅ |
| `npm run lint` | **95 problemas (1 error, 94 warnings)** — todos preexistentes. Único error: `session/ExerciseGif.tsx` (display-name) |
| `npm test` (jest) | **10 tests fallan / 44 pasan** · **5 suites fallan / 14 pasan** — fallos preexistentes |

**Regla derivada:** ningún cambio posterior debe aumentar esos números (10 fallos / 95 lint / 0 tsc).

- [x] Línea base de tests/tsc/lint registrada.
- [x] Trabajo sobre branch `redesing` existente (no se pidió commit todavía → no se branchó aparte).

**Gate:** ✅ estado base conocido.
**Riesgo:** nulo. **Limpieza:** 0 líneas (preparación).

---

## Fase 1 — Eliminar código muerto del template Expo (máximo ROI, riesgo mínimo) — ✅ HECHO

> **Resultado (2026-06-23):** 15 archivos tocados, **510 líneas eliminadas** (13 archivos borrados + 2 layouts editados). Proyecto: **249 → 236 archivos**, **29.734 → 29.224 líneas**. Carpetas `src/components/common/ui/` y `src/components/common/__tests__/` quedaron vacías y se borraron. Verificación post: `tsc` 0 errores, `jest` 10 fallos (sin regresión; −2 tests pasados que eran del `themed-text` borrado), `lint` 95 (idéntico). Cero referencias residuales.



**Por qué primero entre los cambios:** borra ruido sin tocar nada productivo. Verificado por grafo de imports: es una **isla autocontenida**. `explore.tsx` está oculto (`href: null`) y `modal.tsx` no se navega desde ningún lado. Al borrar esos dos, el resto queda huérfano en cascada.

**Archivos a eliminar (13 — ~504 líneas):**

| Archivo | Motivo |
|---------|--------|
| `app/modal.tsx` | Ruta nunca navegada (solo registrada en el Stack) |
| `app/(tabs)/explore.tsx` | Tab oculto (`href: null`), pantalla demo del starter |
| `src/components/common/themed-text.tsx` | Solo lo usaban modal/explore/collapsible |
| `src/components/common/__tests__/themed-text.test.tsx` | Test del archivo anterior |
| `src/components/common/themed-view.tsx` | Solo modal/explore/parallax/collapsible |
| `src/components/common/hello-wave.tsx` | **Sin importadores** (huérfano) |
| `src/components/common/parallax-scroll-view.tsx` | Solo explore |
| `src/components/common/external-link.tsx` | Solo explore |
| `src/components/common/haptic-tab.tsx` | **Sin importadores** (huérfano) |
| `src/components/common/ui/collapsible.tsx` | Solo explore |
| `src/components/common/ui/icon-symbol.tsx` | Solo explore + collapsible |
| `src/components/common/ui/icon-symbol.ios.tsx` | Par del anterior |
| `src/hooks/use-theme-color.ts` | Solo themed-text/themed-view (mueren con ellos) |

**Editar (no borrar):**
- [x] `app/_layout.tsx` → quitar `<Stack.Screen name="modal" ... />`.
- [x] `app/(tabs)/_layout.tsx` → quitar `<Tabs.Screen name="explore" options={{ href: null }} />`.

**NO borrar (verificado, sigue vivo):**
- `src/hooks/use-color-scheme.ts` / `use-color-scheme.web.ts` → usados por ambos `_layout`.
- `src/components/common/ui/` queda vacío tras borrar icon-symbol/collapsible → **borrar la carpeta** también.

**Procedimiento seguro:**
1. Borrar los 13 archivos + carpeta `ui/`.
2. Quitar las 2 referencias en los layouts.
3. `npx tsc --noEmit` → no debe aparecer ningún import roto.

**Gate:** `tsc` limpio (igual o mejor que base) + `npm test` sin regresión + la app arranca.
**Riesgo:** bajo. **Limpieza:** **13 archivos / ~504 líneas eliminadas.**

---

## Fase 2 — Higiene de logs y debug — ✅ HECHO

**Por qué:** 38 archivos tenían `console.*`. En producción ensucian, filtran datos y degradan performance. Los más cargados: `routine.service.ts` (14), `use-module-config-storage.ts` (14), `fitness/index.tsx` (8), `onboarding.tsx` (7).

**Decisión aplicada — Opción A (logger dev-only):**
- [x] Creado `src/utils/logger.ts` — solo emite si `__DEV__`. Es el único punto de logging (engancha Sentry acá a futuro).
- [x] `console.error`/`console.warn` (rutas de error en `catch`) → `logger.error`/`logger.warn` vía codemod (37 archivos), con su import.
- [x] `console.log` de debug puro (dumps de payload/token, `console.log(data)`, etc.) → **borrados** (17 statements). Los 2 multilínea (`routine.service` OK-dump, `fitness/index` Routine-loaded-dump) borrados a mano.
- [x] Fix colateral: `catch (error: any)` que quedó sin uso en `useActiveSession.ts` → `catch` sin binding (mata 1 warning + 1 `: any`).
- [x] Barrido final: `rg console\.` → **0** fuera de `logger.ts`. 94 llamadas a `logger.*` en 32 archivos.

> **Resultado (2026-06-23):** 38 archivos limpiados, `src/utils/logger.ts` creado. Verificación: `tsc` 0, `lint` 95 (idéntico a base), `jest` 10 fallos (sin regresión). Diff semántico confirmado (sin ruido de line-endings pese a `core.autocrlf=true`).

> **Nota encontrada:** quedan 2 directivas `eslint-disable @typescript-eslint/no-explicit-any` HUÉRFANAS (preexistentes) en `app/(tabs)/fitness/index.tsx:260,265` sobre `router.push(... as any)`. No son de esta fase → se limpian en Fase 7 (endurecer `any`).

**Gate:** ✅ sin `console.*` sueltos, sin regresión.
**Riesgo:** bajo. **Limpieza:** 38 archivos, ~17 logs de debug eliminados + ruido de `console` silenciado en prod.

---

## Fase 3 — Consistencia de estilos (absorber `pending-changes.md`)

**Por qué:** ya existe `pending-changes.md` con la auditoría de estilos (migrar `StyleSheet.create`/`style` fijo a `className`, limpiar restos light/`dark:`). Es trabajo real y acotado: solo **6 archivos** con `StyleSheet.create`. Esta fase **ejecuta y cierra** ese documento.

**Acciones:**
- [ ] Aplicar las migraciones clase **A** y **C** de `pending-changes.md` (valores fijos → `className`).
- [ ] Dejar justificadas in-code las clase **B** y **D** (runtime/props nativas, no migrables).
- [ ] Limpiar prefijos `dark:` y ramas light en componentes que se toquen (la app es dark-only).
- [ ] Una vez aplicado: **borrar `pending-changes.md`** (su contenido queda absorbido acá) o marcarlo como `DONE`.

**Gate:** `rg "StyleSheet.create"` solo en archivos justificados. Sin diferencias visuales (revisión manual de las pantallas tocadas).
**Riesgo:** bajo-medio (es visual; revisar a ojo). **Limpieza:** `pending-changes.md` (464 líneas) + simplificación de estilos.

---

## Fase 4 — Deduplicación → componentes y hooks compartidos — 🟡 PARCIAL

> **Resultado (2026-06-23):**
> - ✅ **`cssInterop` centralizado.** Estaba duplicado en **39 archivos** (39× `cssInterop(Ionicons)` + 1× `MaterialCommunityIcons`, mismo config). Creado `src/utils/icon-interop.ts` (registro global único) + import de side-effect en `app/_layout.tsx`; eliminadas las 39 llamadas locales y sus imports. Verificado: `tsc` 0, diffs semánticos limpios (manejó bloques de 3 y de 9 líneas), `jest` 10 (sin regresión). **Lint bajó 95 → 67.**
> - ✅ **`SubMenuItem`/`ConfigMenuItem` — N/A.** El doc viejo reportaba `SubMenuItem` duplicado inline en 3 settings views + `ConfigMenuItem` huérfano. **Verificado: ya está resuelto por el rediseño** — no hay defs inline de `SubMenuItem`/`MenuItem`, y `ConfigMenuItem` se usa desde `SettingsSection`. Nada que hacer.
> - ⏸️ **`OnboardingStepLayout` — diferido a Fase 5.** El wrapper `View + ScrollView(flexGrow)` se repite en los steps, pero `OnboardingHeader`/`OnboardingFooter` ya están extraídos y el padding varía por step (`contentContainerStyle` runtime). Extraerlo toca el layout de TODAS las pantallas de onboarding → necesita verificación visual. Encaja mejor al partir `FitnessConfigStep` en Fase 5.

**Por qué:** el corazón del pedido. Antes de partir archivos grandes, extraer lo repetido para que esa extracción no duplique a su vez.

**Procedimiento de detección (hacer primero, documentar hallazgos acá):**
- [ ] Buscar bloques JSX repetidos (scaffolds de modal/sheet, filas de lista, headers).
- [ ] Buscar lógica repetida en pantallas (fetch + loading + error, formateos).
- [ ] Contrastar contra `docs/component-library.md`: si ya existe un átomo, **usarlo**; si la duplicación es nueva, extraer un átomo nuevo y **documentarlo** en esa biblioteca.

**Candidatos ya identificados (confirmar en ejecución):**
- Scaffolds de bottom-sheet/modal: `BottomSheetModal` ya es canónico, pero `SwapCandidateModal` y `RoutineDetailModal` mantienen el suyo (documentado y justificado). **Revisar** si tras los rediseños convergen lo suficiente para un segundo scaffold `SheetWithHandle`.
- `: any` / `as any` en 25 archivos → tipar correctamente reduce bugs y mejora autocompletado.
- Patrón "lista + buscador" (`TagSelect` vs `SearchableSelect`): documentado por qué no se unificaron — **no forzar**, solo revisar si apareció un 3.º consumidor.

**Regla:** extraer solo con **2+ usos reales o 1 uso + intención clara**. No abstraer de más (el propio `component-library.md` ya marca cuándo NO unificar — respetarlo).

**Gate:** cada componente/hook nuevo está en `component-library.md` y reemplaza ≥2 duplicados.
**Riesgo:** medio. **Limpieza:** variable; se cuantifica al ejecutar (líneas duplicadas removidas por extracción).

---

## Fase 5 — Partir archivos sobrecargados (el bloque grande) — 🟡 EN CURSO

> **Modo de trabajo (acordado con el usuario):** el usuario corre la app y verifica visualmente cada cambio. Se va de a un archivo, de menor a mayor riesgo. Si una descomposición es demasiado compleja/acoplada, **se saltea** (lo dijo explícitamente).
>
> **Progreso:**
> - 🟢 `app/(tabs)/fitness/index.tsx` (681 → **616**): extraído `DraftCard` (card "Rutina en creación") a `features/routine/DraftCard.tsx` + removido el import de reanimated que solo usaba ese componente. Verificado por el usuario en la app ✅. **Extracción profunda de lógica DIFERIDA:** la pantalla está muy acoplada (8+ refs, `measureInWindow`, 6 setters de contexto, ~20 handlers interdependientes); un `useFitnessHome` movería ~390 líneas / ~35 valores con ROI bajo y superficie de verificación enorme. Decisión: no forzar.
> - 🟢 `routine/AddExerciseSheet.tsx` (498 → **325**): extraída toda la lógica de búsqueda/filtros/paginación (~200 líneas: estado + 3 efectos debounce/filtros/búsqueda + handlers + `reset`) al hook `src/hooks/useExerciseSearch.ts` (216 líneas). Descomposición limpia (sin contexto ni mediciones de layout). `tsc` 0, `lint` 67. Verificado por el usuario ✅.
> - 🟢 `nutrition/FoodSearchSheet.tsx` (451 → **296**): su lógica ya estaba en hooks (`useFoodSearch`, `useFoodBarcodeScanner`), así que se extrajeron las dos sub-vistas presentacionales: `FoodDetailPanel.tsx` (126, detalle del alimento + helper `NutritionFact`) y `FoodScannerView.tsx` (108, scanner de barras + `FOOD_BARCODE_TYPES`). El sheet quedó como orquestador + lista de resultados. `tsc` 0, `lint` 67. Verificado por el usuario ✅.
> - 🗑️ `common/MyTabBar.tsx` (763) + `features/home/RoutineFabMenu.tsx` (52) = **815 líneas BORRADAS**. Al ir a descomponer `MyTabBar` se descubrió que es **código muerto**: ningún `import`, ningún `tabBar={...}` en los layouts (la app usa el tab bar nativo de los 4 tabs sin FAB central). El FAB viejo fue reemplazado en el rediseño y los archivos quedaron huérfanos. Confirmado por el usuario. `tsc` 0, `lint` 67, `jest` sin regresión. **Lección: verificar uso real ANTES de refactorizar.** Quedan 2 comentarios (en `routine-detail-context.tsx` y `CreateRoutineView.tsx`) + plomería del contexto FAB (`saveRoutineRef`, `setActions`, etc.) escrita pero ya no leída → el usuario la normalizará en una pasada futura del rediseño (no se toca ahora).
> - 🟢 `onboarding/FitnessConfigStep.tsx` (545 → **378**): wizard de 4 subpasos. Toda la lógica (8 estados + 4 efectos restaurar/cargar-subgoals/cargar-equipo/autosave + handlers + envío) → hook `src/hooks/useFitnessConfigStep.ts` (245). El componente quedó render-only (las 4 pantallas, view-heavy). `tsc` 0, `lint` 67, `jest` 10 fallan (sin regresión). **Hallazgo:** `FitnessConfigStep.test.tsx` está desactualizado (espera texto "Tu objetivo" que el rediseño cambió a "Sub objetivo") → es uno de los 10 tests rotos de base, NO lo rompió este cambio. Pendiente arreglo en Fase 8. Verificado por el usuario ✅.
> - 🟢 `routine/RoutineDetailView.tsx` (1059 → **781**): se extrajeron las 3 piezas presentacionales autocontenidas, **SIN tocar el core de animación/gestos/swap** (decisión del usuario): `SwapAwareExerciseItem.tsx` (180, card de ejercicio con pulso propio + `StatCol` + `getExerciseReps`), `ConfirmSuggestionsModal.tsx` (74) y `BlockingWarningModal.tsx` (43). `SkeletonItem` (8 líneas) se dejó inline (no vale un archivo). Limpiados imports colgados (`formatReps`, `ExerciseThumbnail`). `tsc` 0, `lint` 67, `jest` 10 fallan (sin regresión). Verificado por el usuario ✅. **La lógica de swap (~10 estados + handlers + `setActions` + menú contextual) se dejó EN el componente: está muy entretejida con el render/contexto → extracción diferida (caso "complejo" a saltear).**
> - 🟢 `app/onboarding.tsx` (501 → **122**): máquina de estados completa (16 estados + 3 efectos init/goals/módulos + 5 handlers + `sortModules` + `globalGoalName`) → hook `src/hooks/useOnboardingFlow.ts` (456). La pantalla quedó render-only (llama al hook + renderiza el paso). Extracción limpia (sin refs/layout/contexto, a diferencia de fitness/index). El hook es grande pero es UNA máquina de estados cohesiva. `tsc` 0, `lint` 67, `jest` 10 fallan (sin regresión). Verificado por el usuario ✅.
> - 🟢 `routine/RoutineEditMode.tsx` (825 → **543**): YA estaba rediseñado (zinc dark, 0 slate) → se procedió. Extraídas las piezas presentacionales autocontenidas SIN tocar el core de drag&drop/animación: `EditExerciseCard.tsx` (121, card + `EditStat`), `StatPickerSheet.tsx` (142, sheet con `WheelPicker` JS + `buildRange`) y `EditDayPickerModal.tsx` (41). Limpiados imports colgados (`MaterialCommunityIcons`, `Swipeable`, `ExerciseThumbnail`, `WeightOption`, `Modal`, `ScrollView`). `tsc` 0, `lint` 67, `jest` 10 fallan (sin regresión). Pendiente verificación visual del usuario (editar rutina manual).
> - ⏸️ `routine/CreateRoutineView.tsx` (975): DIFERIDO por decisión del usuario (va a rediseñar el estilo primero). Ver nota detallada arriba ("DIFERIDO hasta el rediseño de estilo").
> - 🟢 `app/(tabs)/fitness/routines.tsx` (414 → **275**): lógica de la pantalla "Mis rutinas" (token + `useMyRoutines` + 6 estados + contexto + 2 useMemo + 11 handlers) → hook `src/hooks/useRoutinesScreen.ts` (218). La pantalla quedó con los render-helpers + `listHeader` + JSX. Menos acoplada que fitness/index (sin refs/measureInWindow). `tsc` 0, `lint` 67, `jest` 10 fallan (sin regresión). Pendiente verificación visual del usuario (lista, filtros, abrir/activar/eliminar rutina).
> - ⏸️ `hooks/useActiveSession.ts` (513): DIFERIDO/SALTADO por riesgo. Es la máquina de estados de la **sesión activa en vivo** (~18 estados interdependientes + 7 useEffect que son los timers countdown/global/descanso/ejercicio + handlers). Responsabilidad ÚNICA y cohesiva (ya delega audio a `useSessionAudio`). Las deps de los timers ya son delicadas (varios `exhaustive-deps` de base). Partirlo = altísimo riesgo de timers rotos / stale closures para ganancia mínima, con superficie de verificación enorme (correr una sesión completa). **Decisión: NO tocar.**
>
> **Cierre de Fase 5:** todos los archivos grandes están resueltos o diferidos a propósito. Pendientes intencionales: `CreateRoutineView` (espera restyle del usuario), `useActiveSession` (muy riesgoso), `routine.service` 464 (cohesivo, 16 funcs API → partir sería artificial), `useOnboardingFlow` 456 (hook cohesivo recién creado).



**Por qué:** 12 archivos concentran ~7.701 líneas (≈26% del código). Son difíciles de leer, testear y mantener. Se parten en sub-componentes presentacionales + custom hooks (lógica/estado), siguiendo el patrón container/presentational ya usado en el proyecto.

> ### ⏸️ `routine/CreateRoutineView.tsx` (975) — DIFERIDO hasta el rediseño de estilo
>
> El usuario va a **rediseñar el estilo** de este archivo primero. Se deja de lado a propósito. **Cuando se llegue a ese momento, el refactor debe contemplar (además del restyle):**
> 1. **Migración de estilo:** tiene **39 referencias `slate-` + prefijos `dark:`** (theming light/dark viejo). La app es dark-only → migrar a `zinc` directo, sin `dark:`.
> 2. **Descomposición:** extraer la lógica del formulario a un hook `useCreateRoutineForm` (estado + validación + guardado) y partir el render en sub-componentes por sección (igual patrón que `RoutineEditMode`/`FitnessConfigStep`). Apunta a ≤ 300 líneas.
> 3. **⚠️ Plomería FAB huérfana:** escribe `saveRoutineRef.current = doSave` e `isFormValidRef.current = isValid` (registro en `routine-detail-context` que el viejo `MyTabBar` leía para el botón "Guardar"). **`MyTabBar` ya se borró** → ese registro ya no lo lee nadie. Al rediseñar hay que **re-cablear el disparador de guardado** (botón propio en la vista, no el FAB del tab bar) y limpiar `saveRoutineRef`/`isFormValidRef`/`isCreatingRoutine` del contexto si ya no se usan. Verificar bien que crear+guardar+activar rutina siga funcionando.
> 4. **Reutilizar** los átomos extraídos en `RoutineEditMode` (card de ejercicio, pickers) cuando apliquen, para no duplicar.

**Orden sugerido (de más a menos crítico):**

| # | Archivo | Líneas | Estrategia de partición |
|---|---------|-------:|-------------------------|
| 1 | `routine/RoutineDetailView.tsx` | 1059 | Extraer hook de animación/expansión, hook de selección de día (swipe), y sub-componentes de header/menú. Ya comparte piezas vía `routine-detail-shared.tsx` — ampliarlo. |
| 2 | `routine/CreateRoutineView.tsx` | 975 | Hook `useCreateRoutineForm` (estado del form) + sub-componentes por sección del formulario. |
| 3 | `routine/RoutineEditMode.tsx` | 825 | Hook de edición in-place (drag&drop, wheel pickers) + reuso de `routine-detail-shared`. |
| 4 | `common/MyTabBar.tsx` | 764 | Separar el **FAB menu** (lógica de contexto + menú de acciones) en su componente; dejar el tab bar puro. |
| 5 | `app/(tabs)/fitness/index.tsx` | 681 | Mover lógica a hooks (varios ya existen: `useMyRoutines`, `useRoutinePreview`); pantalla = composición. |
| 6 | `onboarding/FitnessConfigStep.tsx` | 545 | Sub-componentes por subStep (0..3) ya que cada uno es independiente. |
| 7 | `hooks/useActiveSession.ts` | 517 | Partir en hooks más chicos (timer, fases, RPE, persistencia) compuestos por uno orquestador. |
| 8 | `app/onboarding.tsx` | 501 | Extraer máquina de pasos a hook; pantalla = render por step. |
| 9 | `routine/AddExerciseSheet.tsx` | 498 | Hook de búsqueda/filtros + sub-componentes (filtros, resultados, detalle). |
| 10 | `services/routine.service.ts` | 471 | Revisar si mezcla responsabilidades (CRUD vs generación IA vs mapeo) → separar. |
| 11 | `nutrition/FoodSearchSheet.tsx` | 451 | Reusar `useFoodSearch`; sub-componentes de resultado. |
| 12 | `app/(tabs)/fitness/routines.tsx` | 414 | Composición sobre `useMyRoutines` + cards ya existentes. |

**Regla por archivo:** cada partición debe (1) no cambiar comportamiento, (2) bajar el archivo principal bajo el umbral, (3) los sub-componentes nuevos van documentados si son reutilizables.

**Gate por archivo:** tests verdes + revisión visual de la pantalla afectada + el archivo principal quedó ≤ umbral.
**Riesgo:** medio-alto (son los archivos más sensibles). **Hacer de a uno, con commit por archivo.**
**Limpieza:** redistribución de ~7.700 líneas en archivos legibles; el archivo grande baja, el total puede crecer levemente (más archivos) pero la **complejidad por archivo cae**.

---

## Fase 6 — Pantallas finas: lógica a hooks

**Por qué:** complementa la fase 5. Las pantallas (`app/**`) deben ser composición; la lógica vive en hooks. El proyecto ya tiene ~25 hooks bien hechos — extender ese patrón a las pantallas que aún mezclan fetch/efectos/estado en el render.

**Acciones:**
- [ ] Identificar pantallas con `useEffect`/`useState` de negocio inline → mover a hook `use<Pantalla>`.
- [ ] Verificar que cada pantalla > 250 líneas tras la fase 5 tenga su hook.

**Gate:** pantallas legibles, lógica testeable por separado.
**Riesgo:** medio. **Limpieza:** separación de responsabilidades (mantenibilidad).

---

## Fase 7 — Optimización y buenas prácticas

**Por qué:** una vez ordenado, optimizar sobre código limpio (no antes — optimizar código duplicado es tirar esfuerzo).

**Acciones:**
- [ ] `React.memo` / `useCallback` / `useMemo` en filas de listas y componentes que re-renderan en scroll (medir antes con el profiler, no a ciegas).
- [ ] `FlatList`: `keyExtractor` estable, `getItemLayout` donde aplique, evitar funciones inline en `renderItem`.
- [ ] Imágenes/GIFs de ejercicios: confirmar `expo-image` con cache (`cachePolicy`).
- [ ] TanStack Query: revisar `staleTime`/`gcTime` y `select` para no recomputar.
- [ ] Endurecer los 25 `any`/`as any` con tipos reales.

**Gate:** sin regresión funcional; mejoras medibles donde se aplicó profiler.
**Riesgo:** medio. **Limpieza:** performance + type-safety.

---

## Fase 8 — Verificación final y cierre

- [ ] `npm test` verde (igual o mejor que base).
- [ ] `npx tsc --noEmit` sin errores nuevos.
- [ ] `npm run lint` sin nuevos warnings.
- [ ] Smoke test manual: login → onboarding → cada tab → sesión activa → nutrición → salud.
- [ ] Actualizar `docs/component-library.md` con los átomos/hooks nuevos.
- [ ] Recontar métricas y completar la tabla "Resultado" de abajo.

---

## Resultado (se completa al terminar)

| Métrica | Antes | Después |
|---------|------:|--------:|
| Archivos totales | 249 | 248 *(tras Fase 5; −16 muertos, +15 hooks/componentes nuevos)* |
| Líneas totales | ~29.734 | **~28.573** *(−1.161 netas, pese a sumar 15 archivos nuevos)* |
| Archivos eliminados (muertos) | — | **16** (13 template + `MyTabBar` + `RoutineFabMenu` + `.bak`) ✅ |
| Líneas muertas eliminadas | — | **~1.330** ✅ |
| Archivos > 400 líneas | 12 | 7 (3 hechos con core intacto + 2 cohesivos + 2 diferidos a propósito) |
| Archivos con `console.*` | 38 | **0** ✅ *(solo `logger.ts`)* |
| `cssInterop` duplicado | 39 | **1** ✅ *(`icon-interop.ts`)* |
| Componentes/hooks nuevos reutilizables | — | **15** |
| `tsc` / `lint` / `jest` | 0 / 95 / 10❌ | **0 / 67 / 10❌** *(sin regresión; lint −28)* |

---

## Preguntas abiertas (resolver antes de ejecutar)

1. **Logs (Fase 2):** ¿`logger` dev-only (recomendado) o borrar los `console.*`?
2. **Alcance (Fase 5):** ¿partimos los 12 archivos grandes o arrancamos por un subconjunto (ej. los 4 de `routine/`) y evaluamos?
3. **Ejecución:** ¿querés que ejecute fase por fase pidiendo tu OK entre cada una, o autónomo hasta el primer gate que falle?
4. **Barrels:** no hay `index.ts` de barril en `components/`. ¿Sumamos barrels para imports más limpios o lo dejamos como está (más explícito)?
