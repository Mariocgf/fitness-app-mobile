# Component Library

> **REGLA:** Antes de crear cualquier componente nuevo, buscá aquí primero. Si existe algo reutilizable, usalo. Si necesitás una variante, extendé el componente existente.

> **TEMA — la app es dark-only.** El esquema se fuerza a `dark` en `app.json` (`userInterfaceStyle: "dark"`) y en runtime (`Appearance.setColorScheme('dark')` en `app/_layout.tsx`). **No agregues variantes light ni prefijos `dark:` en componentes nuevos** — escribí directo el color oscuro (ej. `bg-zinc-900`, no `bg-white dark:bg-zinc-900`). El código light viejo se va limpiando incrementalmente a medida que se tocan los archivos.

---

## Home — `src/components/features/home/`

### `ModuleCard`

Card de módulo para el dashboard home. Muestra un título, info contextual opcional, un divisor y una acción de navegación.

**Props:**
| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `title` | `string` | ✅ | Nombre principal de la sección (ej. "Fuerza Pro", "Nutrición") |
| `subtitle` | `string` | ❌ | Texto secundario bajo el título (ej. día de la semana) |
| `meta` | `string` | ❌ | Info de detalle en una línea (ej. "6 ejercicios • 45 min") |
| `description` | `string` | ❌ | Texto de estado cuando no hay datos activos |
| `actionLabel` | `string` | ✅ | Texto del CTA (ej. "Continuar rutina", "Crear plan") |
| `onAction` | `() => void` | ✅ | Callback al presionar el CTA |
| `isLoading` | `boolean` | ❌ | Muestra indicador de carga en lugar del contenido |

**Uso:**
```tsx
<ModuleCard
  title="Fuerza Pro"
  subtitle="Lunes"
  meta="6 ejercicios • 45 min"
  actionLabel="Continuar rutina"
  onAction={() => router.navigate('/(tabs)/fitness')}
/>
```

**Cuándo usar:** En el dashboard home para mostrar el estado resumido de cada módulo (Rutina, Nutrición, Salud).

---

### `GreetingHeader`

Encabezado de la pantalla home con saludo según hora del día y pregunta de acción.

**Props:**
| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `userName` | `string` | ✅ | Primer nombre del usuario autenticado |

**Uso:**
```tsx
<GreetingHeader userName={user?.firstName ?? 'Usuario'} />
```

**Salida visual:**
```
Buenos días, Mario     ← pequeño, slate-400
¿Qué hacemos hoy?     ← grande, blanco, bold
```

---

### `ActionCard`

Card **"Tu rutina activa"** del módulo Fitness (dark-only `zinc`, acento `lime-400`). Hero de la pantalla de Fitness rediseñado desde la maqueta: icon-tile con acento, nombre, día de hoy (`calendar`), meta `N ejercicios • tiempo` y CTA **"Continuar rutina →"** (`lime-400`, texto `zinc-900`). Tiene 3 estados: `initial` (sin rutina → "Generar rutina"), `loading` (generando con IA), `success` (rutina activa). Soporta `ref` para medir su layout y animar la expansión al detalle. El día/meta se computan internamente desde `routine.days[0]` (no se pasan por prop).

> **No incluye la foto de atleta** de la maqueta: no hay asset ni campo de imagen por rutina en el DTO. Se degrada a icon-tile (ver `agent-implementation-lessons.md`).

**Props:**
| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `cardState` | `'initial' \| 'loading' \| 'success'` | ✅ | Estado actual del card |
| `onGenerate` | `() => void` | ✅ | Dispara generación de rutina |
| `onViewPlan` | `() => void` | ✅ | Abre el detalle de la rutina |
| `routine` | `Routine \| null` | ❌ | Rutina activa del usuario |
| `isLoadingInitial` | `boolean` | ❌ | Muestra skeleton mientras sincroniza |

**Cuándo usar:** En la pantalla de Fitness (`app/(tabs)/fitness/`) para mostrar el estado de la rutina con acciones ricas.

---

### `DietCard`

Card del plan nutricional. Conectado al `NutritionRoutineContext`. Tiene estados: sin plan (generar), generando (loading), draft pendiente (revisar), plan activo (ver).

**Cuándo usar:** En el tab de Nutrición. No recibe props — consume el contexto directamente.

---

## Common — `src/components/common/`

### `SectionCard`

Wrapper de card genérico con `bg-white dark:bg-slate-900 border rounded-2xl`. Usar para contenedores de sección sin lógica propia.

### `InputCard`

Card con input interno. Usar para formularios dentro de cards (ej. registro de métricas).

### `CheckableCard`

Card seleccionable con checkbox. Usar para listas de opciones donde se puede marcar/desmarcar.

### `SelectableCard`

Card con selección única (radio). Usar en pasos de onboarding y configuración de módulos.

### `ProgressBar`

Barra de progreso horizontal. Props: `progress: number (0–1)`, `className?`.

### `FillBar`

**Átomo.** Barra de relleno horizontal: track `bg-zinc-800` + relleno del acento, con `progress` (0–1) acotado internamente. **Reutilizar SIEMPRE** en vez de copiar `<View h-2 rounded-full bg-zinc-800><View bg-amber-400 width%/></View>`.

**Props:** `progress: number`, `accent?: 'amber' | 'lime' | 'mono'` (default `amber`), `heightClassName?` (default `'h-2'`), `className?` (clases extra del track, ej. `'w-full'`).

**En uso:** `MacroProgressRow` (barra de macro del Resumen), `MacroBreakdownCard` (columnas del detalle de comida).

### `IconTile`

**Átomo.** Tile cuadrado con ícono centrado (`rounded-2xl items-center justify-center`). Es el contenedor redondeado que acompaña filas de macros, comidas y tarjetas informativas (tip). **Reutilizar SIEMPRE** en vez de copiar `<View rounded-2xl items-center justify-center><Ionicons/></View>`.

**Props:** `name` (Ionicons), `color?` (default amber `#fbbf24`), `iconSize?` (default 22), `size?` (lado en px, default 44), `className?` (fondo, default `bg-zinc-800`).

**En uso:** `MacroProgressRow`, `MealRow`, tip del `NutritionDashboard`.

### `BottomSheetModal`

Sheet modal dark-only que sube desde abajo (`bg-zinc-950 rounded-t-3xl`, backdrop `bg-black/50`, cierra al tocar fuera, respeta `insets.bottom`). Usa el `Modal` **nativo** de React Native (`animationType="slide"`), así que funciona en Expo Go sin dev build. **Es el scaffold canónico de bottom-sheets** — NO reimplementar `<Modal><View bg-black/50><Pressable/><View rounded-t-3xl>`; envolvé el contenido en `<BottomSheetModal>`.

**Props:** `visible: boolean`, `onClose: () => void`, `children`, `height?: \`${number}%\`` (default `'85%'`).

**En uso:** `AddExerciseSheet`.

**Cuándo NO usar (a propósito):** `SwapCandidateModal` y `RoutineDetailModal` mantienen su propio scaffold. Divergen lo suficiente (`maxHeight`/`h-[90%]` que crece con el contenido, drag handle, `bg-zinc-950` + `border-t`, backdrop `/60`, y RoutineDetailModal envuelve en `GestureHandlerRootView` con overlay interno de detalle) como para que forzarlos acá agregaría props de un solo uso. La duplicación que queda es menor que el costo de abstraerla mal. Si más adelante aparece un 3.º sheet con esas mismas necesidades, recién ahí conviene extraer un segundo scaffold (p. ej. `SheetWithHandle`).

### `SearchableSelect`

Input con búsqueda y lista desplegable. Usar para selección de ejercicios, alimentos, etc.

### `TagSelect`

Selector de tags múltiples (chips). Usar para filtros y configuración multi-opción.

### `SegmentedControl`

Control segmentado dark-only (estilo iOS) para toggles de 2-4 opciones excluyentes y cortas. Contenedor `bg-zinc-900 border-zinc-800 rounded-xl p-1`; el segmento activo se resalta en `bg-zinc-800` con el texto del acento. Los segmentos son `flex-1` (ancho igual). **Genérico** sobre el tipo del `value` (`<T extends string>`). Reutilizar SIEMPRE para toggles tipo IA/Manual o selectores de comida en vez de copiar `TouchableOpacity` con ternarios de fondo.

**Props:** `options: { label: string; value: T }[]`, `value: T`, `onChange: (value: T) => void`, `accent?: 'lime' | 'amber' | 'mono'` (default `mono`, define el color del texto activo).

**En uso:** biblioteca de rutinas de Fitness (`app/(tabs)/fitness/index.tsx`, toggle IA/Manual, `lime`); selector de comida en `FoodRegisterView` (Desayuno/Almuerzo/Merienda/Cena, `amber`).

**Cuándo NO usar:** chips redondeados independientes (usar `SelectablePill`), selección con scroll horizontal, o labels largos que no entran en `flex-1` (más de ~4 opciones).

### `QuantityStepper`

**Átomo.** Selector de cantidad `−  valor unidad  +`: dos botones circulares con borde del acento y el valor centrado. **No usa gestos propios** (solo toques), así que puede vivir dentro de un `Pressable`/`ScrollView` sin pelearse con el responder system — a diferencia del `RulerPicker`, que sí necesita aislarse del `Pressable` padre. Reutilizar SIEMPRE para ajustar gramos/cantidades en vez de copiar dos botones con un número en medio.

**Props:** `value: number`, `onChange: (value: number) => void`, `step?` (default 5), `min?` (default 0), `max?` (default 9999), `unit?` (default `'g'`), `accent?: 'amber' | 'lime' | 'mono'` (default `amber`). El `onChange` ya llega acotado a `[min, max]`.

**En uso:** `ConsumedFoodCard` (gramos del alimento, `step` 5, `min` 1, `max` 2000).

**Cuándo NO usar:** edición de valor preciso con arrastre fino (usar `RulerPicker`).

### `SelectablePill`

Chip seleccionable (píldora) dark-only: `rounded-full border` + texto. Estructura fija, acento del estado activo configurable. Estado no seleccionado en `zinc` (`bg-zinc-800 border-zinc-700 text-zinc-300`, sin azulado). **Reutilizar SIEMPRE en filtros horizontales y selectores de día** en vez de copiar el `TouchableOpacity rounded-full border` con su ternario.

**Props:** `label: string`, `selected: boolean`, `onPress: () => void`, `accent?: 'mono' | 'lime' | 'amber'` (default `mono`), `className?` (default `px-4 py-2`).

**En uso:** `AddExerciseSheet` (filtros músculo/equipamiento, `lime`), `NutritionDaySelector` (`amber`).

**Cuándo NO usar:** chips con `onLongPress`, fondo transparente al deseleccionar, o layout propio (ej. los chips de día de `CreateRoutineView`).

### `WeekDayPicker`

Selector de días de la semana. Usado en la creación/edición de rutinas.

### `BackButton`

Botón de retroceso estándar con ícono. Usar en headers de pantallas secundarias (no tabs).

### `FullPageLoader`

Overlay de carga de página completa. Usar durante operaciones bloqueantes de pantalla completa.

### `ClockCircle`

Reloj circular animado para fases de descanso/countdown en sesiones de entrenamiento.

### `SessionHeader`

Header de la sesión activa (dark-only `zinc`): botón back circular (`border-zinc-700`), título centrado (`text-white`, `numberOfLines=2`) y acción opcional a la derecha (mismo botón circular). Migrado de `slate` a `zinc`. Props: `title`, `onBack`, `action?: { icon, onPress }`. En uso: `ExercisePhase` (back + info), fase de descanso de `ActiveSessionView` (back, sin acción).

---

## Features — `src/components/features/`

### Rutina — `src/components/features/routine/`

| Componente | Descripción |
|------------|-------------|
| `ExerciseThumbnail` | **Átomo.** Miniatura cuadrada de ejercicio: gif/imagen o placeholder con ícono. Reutilizar SIEMPRE en vez de copiar el bloque `gifUrl ? <Image> : <View><Ionicons image-outline/></View>`. |
| `RoutineListCard` | **Card del listado vertical "Mis rutinas"** (`app/(tabs)/fitness/routines.tsx`, dark `zinc`/`lime`, rediseñada desde la maqueta). Dos variantes según `routine.isActive`: **activa** → card `rounded-3xl` con borde `lime-400`, `IconTile` (lime), nombre, `N días • Activa`, badge "Activa" (pill con dot) y CTA sólido `lime-400` "Continuar rutina →" (abre el detalle, igual que el tap); **resto** → fila compacta `IconTile` + nombre + `source • N días` + chevron. Reutiliza `IconTile`; ícono derivado del source (`fitness`/`barbell`), igual que `RoutineLibraryCard`. NO muestra "Nivel" (no existe en `RoutineSummary`). Props: `routine`, `onPress`. |
| `RoutineLibraryCard` | **Card de la "Biblioteca de rutinas"** (scroll horizontal en Fitness, dark `zinc`/`lime`). Badge IA/Manual, icon-tile, nombre y `dayCount`. Borde lime si es la activa. `onMenu?` opcional para el `···` (sin acción definida todavía → la pantalla aún no lo pasa). NO muestra "Nivel" (no existe en `RoutineSummary`). Reemplaza al viejo `RoutinePreviewCard`. |
| `RoutineDetailView` | Vista fullscreen de detalle de rutina (lectura + modo swap). Expande desde una card con animación. Selector de días por swipe horizontal (FlatList paginado). Menú `···` con acciones contextuales. Edita in-place montando `RoutineEditMode` cuando `isEditMode`. Solo dark mode. |
| `RoutineEditMode` | Modo edición in-place (mismo diseño oscuro que el detalle). Drag&drop nativo, header de días con slot "+", wheel picker para Sets/Reps/Rest/Peso, swipe cambiar/eliminar. Se renderiza desde `RoutineDetailView`. Guarda con `updateRoutine`. |
| `routine-detail-shared` | Piezas compartidas entre detalle y edición: `DaySlot` (cross-fade de días), `SLOT_CONFIGS`, `TAB_BAR_HEIGHT`, `BOTTOM_BUTTON_HEIGHT`, y el `cssInterop(Ionicons)`. No es un componente visual de uso directo. |
| `CreateRoutineView` | Formulario completo de **creación** de rutina (la edición vive en `RoutineEditMode`) |
| `ExerciseDetailView` | Vista de detalle de un ejercicio (dark `zinc`): hero GIF con badge, card de datos (ícono lime + label/valor por fila) y card de instrucciones numeradas. Overlay `absolute inset-0` con swipe-back. Ver subsección. |
| `AddExerciseSheet` | Sheet para agregar/reemplazar ejercicios (búsqueda + filtros + detalle). Ver subsección. |
| `SwapCandidateModal` | Modal de candidatos para reemplazar un ejercicio |
| `AdaptRoutineModal` | Modal para adaptar rutina con IA |

#### Sesión activa — `src/components/features/routine/session/`

| Componente | Descripción |
|------------|-------------|
| `ExercisePhase` | **Contenido de la fase de ejecución** (dark `zinc`/`lime`, rediseñada desde la maqueta). Solo el contenido central: GIF hero (`aspect-square rounded-3xl`), timer chico `lime-400`, **"Serie N de M"** (el número actual en `lime-400`) y subtítulo `reps • peso` (el `•` en `lime-400`) + `InstructionsModal`. **NO incluye header ni botones** — los aporta `ActiveSessionView` (fijos, fuera del cross-fade). El timer es cronómetro global o cuenta regresiva si el ejercicio es por tiempo. Props: `currentExercise`, `currentSet`, `totalSets`, `isTimeBased`, `exerciseTimeLeft`, `globalTime`, `showInstructions`, `onCloseInstructions`. |
| `SetActionButtons` | **Sección de acciones de la sesión, COMPARTIDA entre ejecución y descanso** (dark `zinc`/`lime`). Dos botones grandes bordeados (`border-zinc-800 bg-zinc-900`, icono `lime-400` + label) y debajo un enlace tenue `zinc-500` con `flag-outline`. La sección es **estática**: tamaño y posición de los dos botones no cambian entre fases. `onFinish?` es **opcional**: si se omite, el enlace inferior se oculta (`opacity 0` + `pointerEvents none`) pero **conserva su alto**, para no mover los botones. Props: `left`/`right: { label, icon, onPress }`, `onFinish?`, `finishLabel?` (default `"Finalizar rutina"`). En ejecución: `Serie incompleta` (`ban-outline`) / `Completar serie` (`checkmark`) + enlace "Finalizar rutina". En descanso: `Finalizar rutina` (`flag-outline`) / `Saltar descanso` (`play-skip-forward-outline`), sin enlace inferior. |
| `RestPhase` | **Contenido de la fase de descanso** (dark `zinc`/`lime`, rediseñada desde la maqueta). Solo el contenido central: timer countdown grande `lime-400` (`adjustsFontSizeToFit`) + barra de progreso (`FillBar` lime, `restTimeLeft/initialRest`), `NextExerciseCard`, `RpeSection` (slider existente, sin cambios de flujo) y "Repeticiones realizadas" (`SessionSlider`) solo si la serie fue incompleta (`repetitionMode === 'partial'`), divididos por `border-zinc-800`. **NO incluye header ni botones** — los aporta `ActiveSessionView` (fijos, fuera del cross-fade). |
| `ActiveSessionView` | **Orquestador de la sesión activa.** Maneja COUNTDOWN/SUMMARY y, para EXERCISE↔REST, arma el **scaffold fijo**: `SessionHeader` (título y acción info según fase) + contenido animado + `SetActionButtons`. El header y los botones quedan **fuera de la animación**; solo el contenido central (`ExercisePhase`/`RestPhase`) hace **cross-dissolve** (`FadeInDown` 260ms entra / `FadeOut` 180ms sale, `key={phase}`). Vive en `app/session.tsx` (fuera de tabs → usa `insets` directo). Recibe `routineName?`/`nextSessionDay?` por props (desde `session.tsx`, que los lee de los params de navegación que pasan `RoutineDetailView`/`RoutineDetailModal`) y los reenvía a `SummaryPhase`. |
| `NextExerciseCard` | "Siguiente ejercicio" de la fase de descanso (dark `zinc`/`lime`, restyleada desde la maqueta): miniatura (`ExerciseGif` 80px) + label uppercase `zinc-500` + nombre `white`, sin card de fondo. Variante "¡Última serie!" en card `lime-400`. |
| `RpeSection` | Esfuerzo percibido (RPE) del descanso (dark `zinc`). Título uppercase + `SessionSlider` (0–10) + botón "Actualizar" (acento mono `zinc-50`). Mantiene el flujo de ajuste de carga; solo se migró el estilo de `slate` a `zinc`. |
| `SummaryPhase` | **Resumen post-sesión** (dark `zinc`/`lime`, rediseñado desde la maqueta). Layout centrado: ícono `barbell-outline` lime en círculo + "Rutina completada" + `routineName?` + tiempo grande `formatTimeSpan` (HH:MM:SS) + "N ejercicios completados", card de stats **grid 2×2** (`StatCell` local: Ejercicios/Series/Repeticiones `hechas / total` + Esfuerzo promedio solo valor, divisores `zinc-800`), card **"Próxima sesión"** (`IconTile` calendar lime + solo el día del próximo `RoutineDay`, **sin grupo muscular ni chevron** — `formatNextSessionDay` corta antes del `-`) y CTA sólido `lime-400` "Continuar". **NO muestra el detalle por ejercicio** que tenía la versión anterior: la maqueta es más austera (mismo criterio que Salud). `routineName`/`nextSessionDay` llegan por params de navegación (el hook de sesión no los tiene); si faltan, esas filas no se renderizan. Props: `globalTime`, `stats`, `routineName?`, `nextSessionDay?`, `onSave`. |

#### `ExerciseThumbnail` — átomo

**Props:**
| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `uri` | `string \| null` | ❌ | URL del gif/imagen. Si falta, muestra placeholder |
| `size` | `number` | ❌ | Lado del cuadrado en px (default 64) |
| `className` | `string` | ❌ | Fondo + margen. Default `bg-zinc-800` (tema oscuro). Para slate: `"bg-slate-100 dark:bg-slate-700 mr-3"` |
| `iconColor` | `string` | ❌ | Color del ícono placeholder (default zinc-600 `#52525b`) |

**Uso:**
```tsx
<ExerciseThumbnail uri={exercise.gifUrl} size={56} />
```

**Cuándo usar:** Filas/cards con miniatura cuadrada de ejercicio. En uso: `RoutineDetailView`, `RoutineEditMode`, `CreateRoutineView`, `AddExerciseSheet`.

**Cuándo NO usar (a propósito):** `ExerciseDetailView` (imagen hero `w-full`), `session/NextExerciseCard` (gif animado vía `ExerciseGif`, `rounded-2xl`), y `SwapCandidateModal`/`RoutineDetailModal` (el gif va sobre fondo blanco y el placeholder sobre zinc — fondos distintos por rama).

#### `RoutineDetailView` — detalles

**Props:**
| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `routine` | `Routine` | ✅ | Rutina a mostrar |
| `onClose` | `() => void` | ✅ | Callback al cerrar con animación de colapso |
| `cardLayout` | `CardLayout` | ✅ | Posición y tamaño de la card origen (para la animación) |
| `isGenerating` | `boolean` | ❌ | Muestra skeleton mientras se genera la rutina |
| `readOnly` | `boolean` | ❌ | Oculta el botón "Comenzar rutina" y el menú `···` |
| `onRegenerate` | `() => void` | ✅ | Regenera la rutina con IA |
| `onRoutineUpdated` | `(r: Routine) => void` | ✅ | Se invoca tras aplicar swaps o guardar la edición in-place |
| `onDelete` | `() => void` | ❌ | Elimina la rutina |
| `onActivate` | `() => void` | ❌ | Activa la rutina (solo rutinas no activas) |

**Comportamientos clave:**
- Arranca mostrando el día actual (detectado con `new Date().getDay()`).
- Swipe horizontal entre páginas de días; el header muestra el día actual grande + el siguiente en gris.
- Tapping en cualquier parte del card de ejercicio abre `ExerciseDetailView`.
- En lectura las cards muestran Sets/Reps/Rest estáticos; el handle de 6 puntos (drag) y el wheel picker aparecen al entrar en `RoutineEditMode` (menú `···` → "Editar rutina").
- El menú `···` incluye: Regenerar, Cambiar ejercicios, Adaptar con IA, Editar (modo edición in-place), Activar y Eliminar según el estado de la rutina.
- El posicionamiento del botón inferior usa `TAB_BAR_HEIGHT` (49/56) + `insets.bottom` para convivir con el tab bar nativo.

#### `AddExerciseSheet` — detalles

Sheet de búsqueda y selección de ejercicios para agregar/reemplazar en una rutina. Diseño dark `zinc` (sin azulado, alineado a `colors.md`), acento `lime-400` del módulo fitness.

**Props:**
| Prop | Tipo | Requerido | Descripción |
|------|------|-----------|-------------|
| `visible` | `boolean` | ✅ | Controla la apertura del sheet |
| `onClose` | `() => void` | ✅ | Cierra el sheet |
| `onAdd` | `(exercise: ExerciseSearchItem) => void` | ✅ | Devuelve el ejercicio seleccionado |
| `confirmLabel` | `string` | ❌ | Texto del CTA (default `"Agregar seleccionado"`; reemplazo pasa `"Cambiar"`) |
| `excludedExerciseIds` | `string[]` | ❌ | IDs ya en el día → se muestran atenuados como "Ya agregado" |

**Estructura visual (adaptada del buscador de Alimentos):**
- Título "Ejercicios" + barra de búsqueda con debounce (400ms). Sin botón de scanner (los ejercicios no tienen código de barras).
- Filtros horizontales `Músculo` y `Equipamiento` con `SelectablePill` (`accent="lime"`).
- Sección "Resultados": cada item es una card con `ExerciseThumbnail` (56px), nombre, tags de equipamiento (`translateEquipment`, máx. 2) y un **botón de info** circular a la derecha.
- "Ver más ejercicios" (paginación) + CTA inferior `lime-400`.

**Interacción clave (dos zonas táctiles separadas):**
- **Tap en la fila** → selecciona/deselecciona el ejercicio (borde `lime-400` + check).
- **Tap en el botón info** → abre `ExerciseDetailView` como overlay (`absolute inset-0 z-30`, envuelto en `GestureHandlerRootView` para el swipe-back). Se construye un `RoutineExercise` mínimo desde el `ExerciseSearchItem` con `toDetailExercise`.

**Reutiliza:** `BottomSheetModal` (scaffold nativo, Expo Go), `SelectablePill` (filtros), `ExerciseThumbnail` (miniatura), `ExerciseDetailView` (detalle, ya en `zinc`).

#### `ExerciseDetailView` — detalles

Detalle de un ejercicio en dark `zinc` (rediseñado desde la maqueta). Ya **no** usa `DarkSheetLayout` (eso quitó el azulado). Se renderiza como overlay (`absolute inset-0 z-20`) sobre su contenedor; en uso desde `AddExerciseSheet` (botón info) y `RoutineDetailModal`/`RoutineDetailView` (tap en ejercicio).

**Props:** `exercise: RoutineExercise` (alimenta `getExerciseInfo(exerciseId)`), `onBack: () => void`, `onClose: () => void`, `embedded?: boolean`.

> **`embedded`** (default `false`): pasar `true` cuando se monta como overlay **dentro de un bottom-sheet** (`AddExerciseSheet`, `RoutineDetailModal`) — usa padding superior chico (12px) y no suma el inset inferior del dispositivo, porque el sheet ya está debajo de la barra de estado. Sin `embedded` (uso full-screen, `RoutineDetailView`) usa `insets.top` para esquivar la barra de estado.

**Estructura:**
- Header: back (`zinc-800`) + título centrado.
- Hero GIF `aspect-square` `rounded-3xl` sobre `bg-white` (los gifs del catálogo vienen con fondo blanco) + badge "GIF".
- Card de datos `zinc-900`: filas con ícono `lime-400` + label `zinc-400` + valor blanco a la derecha, divididas por `border-zinc-800`. Filas: Parte del cuerpo, Músculo principal, Secundarios, Equipamiento.
- Card de instrucciones: ícono lime + título, pasos numerados (círculo con borde lime).

**Datos:** usa solo lo que expone `ExerciseInfo` (`bodyPart`, `targetMuscles`, `secundaryMuscles`, `equipments`, `instructions`). Las filas "Nivel" y "Tipo de ejercicio" de la maqueta **no se implementan** porque el DTO no las trae (no inventar — ver `agent-implementation-lessons.md`). Cuando el backend las exponga, se agregan como `InfoRow`.

**Detalle técnico:** íconos lime vía prop `color={LIME}` (no `cssInterop`). Swipe-back con `Gesture.Pan` + `SlideInRight/SlideOutRight`; por eso el padre lo envuelve en `GestureHandlerRootView`.

### Nutrición — `src/components/features/nutrition/`

| Componente | Descripción |
|------------|-------------|
| `DailySummaryCard` | **Card "Hoy"** del tab Resumen (dark `zinc`/`amber`). Calorías consumidas (número grande) + "Objetivo N kcal", divisor y 3 `MacroProgressRow` (Proteínas/Carbohidratos/Grasas). Reemplaza al viejo `CalorieRingCard` (anillo → barras). Recibe `day` + `target`, computa consumido con `getConsumedCalories`. |
| `MacroProgressRow` | **Fila de macro:** `IconTile` + nombre, valor `consumido / objetivo g` y barra de progreso (`FillBar` amber). Props: `icon`, `label`, `value`, `target`. |
| `MacroBreakdownCard` | **Card de macros del detalle de comida** (tab Plan → detalle, dark `zinc`/`amber`). Calorías totales arriba (número grande centrado) + 3 columnas (proteína/carbohidratos/grasas) con gramos, label y una `FillBar`. La barra representa el **% de calorías que aporta cada macro al plato** (`computeMacroPercent`), NO un objetivo: el detalle de comida no trae target por macro. Reemplaza al viejo `MacroRing` en esta vista (anillo → columnas con barras). Props: `calories`, `proteins`, `carbs`, `fats`. |
| `MacroPills` | **Átomo.** Fila de 3 pills de macros (Proteína/Carbohidratos/Grasas en g) de un alimento. Variante `compact` (labels cortos `P`/`C`/`G`, ancho automático) para filas densas; default labels largos a `flex-1`. **Reutilizar SIEMPRE** en vez de copiar el `<View rounded-xl><Text/></View>` por macro. Props: `protein`, `carbs`, `fat`, `compact?`. En uso: `ConsumedFoodCard` (default), `FoodSearchSheet` (compact). |
| `FoodSearchSheet` | **Sheet de búsqueda de alimentos** (dark `zinc`/`amber`, rediseñado desde la maqueta "Alimentos"). Barra de búsqueda con scanner, sección "Resultados" con cards de **selección única** (borde `amber-400`) + CTA "Agregar seleccionado" (agrega a 100g, los gramos se ajustan luego en `ConsumedFoodCard`). Cada item tiene un **botón de info** que abre el **detalle del alimento** (rediseñado desde la maqueta): header con título + marca centrados, card "Cantidad" (`QuantityStepper` + badge de kcal con borde `amber-400`), grid 2×3 de `NutritionFact` ("Información nutricional") y CTA "Agregar alimento". **No lleva sección "Detalles"**: de la maqueta solo `Marca` era real (Porción/Categoría no existen en `FoodCatalogItemDto`) y la marca ya se muestra en el header → sección redundante eliminada. Mismo patrón de dos zonas táctiles que `AddExerciseSheet` (tap = selecciona, info = detalle). Reutiliza `BottomSheetModal`, `IconTile`, `QuantityStepper`, `MacroPills`; `NutritionFact` es local (uso único). **No renderiza "Recientes"** de la maqueta (no hay endpoint de recientes). |
| `MealRow` | **Fila de comida** dentro de la card "Comidas de hoy". `IconTile` + label + badge check si está registrada (tiene items) + kcal o "Pendiente" + chevron. No tiene fondo propio: vive dentro del card-lista con divisores. Reemplaza al viejo `MealSummaryCard` (pill suelto). Props: `day`, `mealType`, `onPress`. |
| `ConsumedFoodCard` | **Card de alimento registrado** (dark `zinc`/`amber`, rediseñada desde la maqueta). `IconTile` genérico + nombre + kcal (número grande), `QuantityStepper` de gramos y 3 pills de macros (`Proteína`/`Carbohidratos`/`Grasas` en g). **No muestra marca ni ícono por categoría**: `ConsumedFoodItemDto` no trae `brand` ni tipo (ver `agent-implementation-lessons.md`). Props: `item`, `onGramsChange`. |
| `RoutineMealCard` | **Card de comida del plan diario** (tab Plan, dark `zinc`/`amber`, rediseñada desde la maqueta). `IconTile` (56px) del tipo de comida + label uppercase + nombre del plato + descripción + chevron. **No muestra kcal ni macros**: `RoutineMealSummaryDto` solo trae `type`/`name`/`description`; las calorías/macros recién aparecen en el detalle (`GET /meals/{id}`) — mostrarlas en la lista implicaría inventarlas o 4 requests por día (ver `agent-implementation-lessons.md`). Por la misma razón **no hay card "TOTAL DEL DÍA"** de la maqueta. Reutiliza `IconTile`. Props: `meal`, `onPress`. |
| `FoodRegisterView` | **Vista completa de registro de alimentos** (dark `zinc`/`amber`). Header con kcal total de la comida, selector de comida (`SegmentedControl` amber), lista de `ConsumedFoodCard`, botón punteado "Agregar alimento" (abre `FoodSearchSheet`) y **CTA propio "Guardar comida"** (`amber-400`, flota sobre el tab bar con `TAB_BAR_HEIGHT` + `insets.bottom`). El guardado ya **no vive en el FAB del tab bar** — recibe `onSave`/`canSave`/`isSaving` por props. |

> El tab **Resumen** lo arma `NutritionDashboard`: `DailySummaryCard` + card "Comidas de hoy" (lista de `MealRow`) + tip de calorías restantes (`IconTile` "bulb") + CTA `amber-400` "Registrar comida" (abre la primera comida pendiente). El tab **Plan** sigue en `NutritionPlanView`/`RoutineMealDetailView` (detalle de comida rediseñado: usa `MacroBreakdownCard`; el viejo `MacroRing` se eliminó al quedar huérfano).

### Salud — `src/components/features/health/`

Módulo dark-only `zinc` con acento `rose-400` (`colors.md` → Salud). Rediseñado desde la maqueta: el azul de la maqueta se tradujo a `rose-400` (misma regla que Fitness=`lime` y Nutrición=`amber`; no copiar el azul/gradiente literal). Todos los datos vienen del backend (`BodyMeasurementDto`, `BodyMetricTrend`) — no se inventa ninguna métrica.

| Componente | Descripción |
|------------|-------------|
| `HealthDashboard` | **Orquestador de la pantalla Salud.** Maneja loading/error (acento `rose-400`) y arma: título "Salud" + `LastMeasurementCard` + `BodyEvolutionDashboardSection` + `MeasurementHistorySection`. |
| `LastMeasurementCard` | **Card "Última medición"** (`bg-zinc-900 rounded-3xl`). Título + fecha debajo (`16 jun 2026`), fila de columnas de composición (Peso/Grasa/Masa magra) separadas por **divisores verticales** `bg-zinc-800` (no chips con caja), fila "N medidas perimetrales registradas" (`body-outline`) y CTA sólido `rose-400` con `add-circle-outline` + "Registrar nueva medición" (texto `zinc-900`). Solo renderiza las columnas con dato real. Estado vacío con CTA "Registrar primera medición". |
| `BodyEvolutionDashboardSection` | **Sección "Evolución física"** (heading limpio, sin subtítulo). Ordena Peso primero y mapea `BodyMetricTrendCard`. Estados loading/error/vacío en `zinc`/`rose-400`. |
| `BodyMetricTrendCard` | **Card de tendencia por métrica** (`bg-zinc-900 rounded-3xl`). Nombre + "Último valor" a la izquierda, valor grande + unidad a la derecha, **sparkline SVG** (`react-native-svg`, línea `rose-400` con **puntos en los extremos**) y fila inferior `fechaInicio · cambio · fechaFin`. El cambio es texto plano `zinc-500` con signo `−/+` (sin pill ni color, según la maqueta); el detalle del % se quitó. |
| `MeasurementHistoryCard` | Card compacta del historial (barra lateral `rose-400`, fecha + resumen). `zinc`/`rose`. |
| `MeasurementHistorySection` | Lista de hasta 4 mediciones recientes + CTA `rose-400` "Ver historial completo". `zinc`/`rose`. |
| `BodyMeasurementFormView` | **Formulario de registro de medición** (`/health/measurements`, dark `zinc`/`rose-400`, rediseñado desde la maqueta). Header back + título centrado "Registrar medición". **Una sola card** `zinc-900 rounded-3xl` con dos secciones divididas por línea: "Composición corporal" (fila Peso) y "Medidas perimetrales" (subtítulo + 8 filas: Cintura, Cuello, Pecho, Brazo, Antebrazo, Cadera, Muslo, Pantorrilla). Cada fila es `label ···· [input unidad]` con caja `border-zinc-800`. CTA `rose-400` con `save-outline` + "Guardar medición" (texto `zinc-900`) al final del `ScrollView` (no flotante); el `paddingBottom` del scroll suma `TAB_BAR_HEIGHT` + `insets.bottom` para no quedar tapado por el tab bar nativo. `MeasurementRow` es subcomponente local (uso único). **No renderiza el panel "Grasa corporal estimada / Masa magra"** de la maqueta: esos valores los calcula el backend al guardar, no hay dato en vivo y `agent.md §7` prohíbe calcular salud en el cliente (ver `agent-implementation-lessons.md`). Props: `isSubmitting`, `submitError`, `onBack`, `onSubmit`. |

### Perfil — `src/components/features/profile/`

Perfil es un **stack anidado de rutas reales** en `app/profile/` (`_layout.tsx` + `index.tsx` + `fitness.tsx`/`nutrition.tsx`/`health.tsx`/`settings.tsx`), pusheado desde el home, **fuera de `(tabs)`** → sin tab bar nativo. **Re-rediseñado** desde una nueva maqueta: cards con icon-tile + bullets por módulo, dark-only `zinc` **neutro** (Perfil = "resto de la UI" en `colors.md` → sin acento; el azul de la maqueta se tradujo a `zinc`, decisión del usuario — ver `agent-implementation-lessons.md`). La raíz (`index.tsx`) es: título "Perfil" + `ProfileIdentityHeader` (card horizontal) + "CUENTA" (Suscripción) + "MIS MÓDULOS" (cards de Fitness/Nutrición/Salud activos con bullets + Configuración) + botón "Cerrar sesión" (outline **rojo** destructivo) + "Versión". Cada fila de módulo `router.push('/profile/<sección>')`.

> **Por qué rutas reales y no navegación por estado:** antes el Perfil navegaba sus sub-secciones por estado (`activeSection`) dentro de una sola pantalla native-stack; el gesto swipe nativo de iOS popeaba toda la ruta `/profile` → volvía al home (y con `usePreventRemove` glitcheaba: arrancaba la salida nativa y saltaba de vuelta). Pasar cada sección a ruta real hace que el swipe vuelva a la vista anterior con animación nativa, sin glitch. Las rutas de sección usan el scaffold compartido `ProfileSectionScreen` (nav bar + manejo del back interno de los configs anidados, que **siguen** navegando por estado dentro de cada `SettingsView`; mientras un config está abierto se deshabilita el gesto para evitar el glitch en ese nivel). Los 7 `*Config` quedaron **intactos** (no se route-ificó su back interno multi-paso, refactor mayor innecesario).

> **Bullets de las cards de módulo = sub-secciones REALES, no las de la maqueta.** La maqueta dibujaba bullets inventados (Fitness: Objetivos/Experiencia/Equipamiento; Salud: Mediciones/Lesiones/Condiciones). Se usan los labels reales del config de cada módulo (Fitness: Equipamiento/Días y duración/Sub objetivo; Nutrición: Sub objetivo/Alergias alimenticias/Estilo de dieta; Salud: Lesiones/Afecciones médicas — "Mediciones" vive en el tab Salud, no en el config). Misma regla "no inventar" de siempre.

**Sub-vistas migradas a `zinc`:** los 3 submenús (`FitnessSettingsView`, `NutritionSettingsView`, `HealthSettingsView`) ahora reusan `ProfileListGroup` + `ProfileListRow` (se borraron sus 3 `SubMenuItem` duplicados). Las `*Config` (`EquipmentConfig`, `InjuriesConfig`/`ConditionsConfig`, `DietaryConfig`, `FitnessSubGoalConfig`, `FitnessTrainingPreferencesConfig`, `DataManagement`) se migraron de `slate`+cyan a `zinc` con CTA mono `bg-zinc-50`/`text-zinc-950`. `DataManagement` y `DietaryConfig` perdieron su `BackButton` cyan propio → ahora el back lo da el **nav bar compartido** (a `DietaryConfig` se le agregó `onRegisterBackHandler` y a `NutritionSettingsView` el `onSubBackChange`, igual que Fitness/Salud).

> **Deuda `slate` restante (átomos compartidos con onboarding):** `SectionCard`, `CheckableCard`, `WeekDayPicker`, `RulerPicker`, `SearchableSelect`, `EquipmentSelect`, `TagSelect` siguen en `slate` (`slate-900 ≈ zinc-900`, diferencia mínima). No se migraron acá por su blast radius en onboarding; se limpian incrementalmente al tocarlos. `ProfileMenuPanel` y `SectionHeader` se borraron al quedar huérfanos. `ProfileHeader`/`SettingsSection`/`ConfigMenuItem` quedan (solo los referencia `_profile_old.tsx.bak`, backup del usuario).

| Componente | Descripción |
|------------|-------------|
| `ProfileModuleCard` | **Card de navegación del Perfil** (dark `zinc` neutro, sin acento). Reutiliza `IconTile` (color zinc-300). Cubre las dos formas de la maqueta: fila con **subtítulo** (Suscripción "Plan Premium activo" / Configuración "Ajustes de la aplicación") y **card de módulo con bullets** (Fitness/Nutrición/Salud). `subtitle` y `bullets` son **excluyentes**. Chevron a la derecha. Los `bullets` deben ser sub-secciones reales. Props: `icon` (Ionicons), `title`, `subtitle?`, `bullets?: string[]`, `onPress`. |
| `ProfileSectionScreen` | **Scaffold de las rutas de sección del Perfil** (`app/profile/fitness|nutrition|health|settings`). Aporta el nav bar (back circular + título centrado) y centraliza el back interno de los configs anidados (que navegan por estado dentro de cada `SettingsView`). Back: si hay config abierto (`subBack`) vuelve a la lista del módulo, si no popea la ruta. Mientras un config está abierto **deshabilita el gesto swipe nativo** (evita el glitch de native-stack) y `usePreventRemove` cubre el back físico de Android. Render-prop: `children({ onSubBackChange })`. Props: `title`, `children`. |
| `ProfileIdentityHeader` | **Card de identidad horizontal** (rediseñada desde la nueva maqueta): card `zinc-900 border-zinc-800` con avatar circular 80px a la izquierda (imagen Clerk o iniciales), nombre y badge de plan (pill `zinc` con `diamond-outline`, sin azul). **No muestra email** (la maqueta es una card limpia nombre + plan; el prop `email` se mantiene en la interfaz pero ya no se renderiza). Props: `fullName`, `email`, `avatarUrl?`, `plan?`. |
| `ProfileListRow` | **Átomo.** Fila de lista de perfil: `label` + `value?` + chevron. `destructive` → texto `red-400`. Sin `onPress` es informativa. **Ya no se usa en la vista raíz** (la reemplazaron las `ProfileModuleCard`), pero **sigue vivo en las sub-vistas** `FitnessSettingsView`/`NutritionSettingsView`/`HealthSettingsView` (dentro de `ProfileListGroup`). Props: `label`, `value?`, `onPress?`, `showChevron?`, `destructive?`. |
| `ProfileListGroup` | Grupo de lista agrupada: encabezado opcional + card `zinc-900` con divisores automáticos entre hijos. **Sigue vivo en las sub-vistas** de módulo (no en la raíz). Props: `title?`, `children` (`ProfileListRow`). |

### Historial — `src/components/features/training-history/`

| Componente | Descripción |
|------------|-------------|
| `RecentActivityCard` | **Fila "Actividad reciente"** de Fitness (ancho completo, dark `zinc`/`lime`). Icon-tile + label "Último entrenamiento" + `routineName` + meta `N ejercicios • duración • Hace X` + chevron. Usa `formatRelativeDay` y `formatDurationLong`. |
| `TrainingHistoryListCard` | Card en lista usada por `SessionComparePicker` (selección de sesión a comparar). **No** se usa en la pantalla "Historial" (esa usa `SwipeableTrainingHistoryCard`). |
| `TrainingHistoryPreviewCard` | Card de preview de una sesión |
| `SwipeableTrainingHistoryCard` | **Card del listado "Historial"** (`app/(tabs)/fitness/training-history`, dark `zinc`/`lime`, rediseñada desde la maqueta de "Mis rutinas"): fila compacta `IconTile` (barbell, lime) + `routineName` + meta `N ejercicios • duración • fecha relativa` (`formatRelativeDay`/`formatDurationLong`) + chevron, con swipe-to-delete (rojo). Reutiliza `IconTile`. |
| `TrainingHistoryCardSkeleton` | Shimmer del historial. Variante `list` migrada a `zinc` (fila icon-tile + 2 líneas), compartida con el detalle (`[id].tsx`). |
| `SessionStatsCard` | **Card de resumen del detalle de sesión** (`[id].tsx`, dark `zinc`/`lime`, rediseñada desde la maqueta). Tres columnas separadas por divisores verticales `bg-zinc-800`: Series completadas (`N` lime `/ M` zinc-500), Repeticiones (total, blanco) y Esfuerzo promedio (`RPE` lime + valor blanco, `—` si no hay). Los valores se computan desde los sets reales con `computeSessionStats` (no del backend). Props: `stats: SessionStats`. |
| `SessionExerciseCard` | **Card de un ejercicio en el detalle de sesión** (dark `zinc`/`lime`, rediseñada desde la maqueta). Card `rounded-3xl`: número en círculo outline (`border-zinc-700`), nombre (prefiere español), `N / M series completadas`, badge `RPE n` (pill `zinc-800`, texto lime) y chevron lime que colapsa/expande el listado de sets (`SetsTable`). `defaultExpanded?` (default `false`; la pantalla abre el primero). **No muestra los músculos objetivo** que tenía la versión anterior: la maqueta es más austera. Props: `exercise`, `index`, `defaultExpanded?`. |
| `SetsTable` | **Listado de sets de un ejercicio** (dark `zinc`, rediseñado de tabla de columnas → filas simples de la maqueta). Cada fila: `Serie N` (izq) + `formatSetDetail(set)` (der: `"12 rep • 20 kg"`, `"45 s"` o `"—"` si no se completó, en `zinc-600`), divididas por `border-zinc-800`. Solo lo usa `SessionExerciseCard`. Props: `sets`. |

---

## Guía de decisión

```
¿Nuevo UI necesario?
├── ¿Es un card con título + descripción + acción? → ModuleCard
├── ¿Es un card complejo con estado múltiple? → ActionCard como referencia
├── ¿Es una selección/filtro? → CheckableCard | SelectableCard | TagSelect
├── ¿Es un modal desde abajo? → BottomSheetModal
├── ¿Es un input con búsqueda? → SearchableSelect
└── ¿Es algo nuevo? → Crear en src/components/features/{módulo}/
```
