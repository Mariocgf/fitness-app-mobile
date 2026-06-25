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

Card de sección dark-only (`bg-zinc-900 rounded-2xl border-zinc-800`) con **círculo de ícono** (`zinc-800`) + título + subtítulo arriba y `children` debajo. Usar para envolver un control (buscador, lista de opciones) con encabezado en onboarding/perfil. Props: `icon` (ReactNode), `title`, `subtitle`, `children`, `className?`. Migrada de `slate` a `zinc` (la comparten onboarding Nutrición/Fitness y los configs de perfil).

### `EquipmentSelectedList`

**Átomo.** Lista los ítems elegidos CON CANTIDAD (dark-only `zinc`): encabezado `Etiqueta (N)` + "Borrar todas" opcional y una fila por ítem con nombre, `QuantityStepper` (−/+, mínimo 1) y botón de papelera para quitarlo. Si no hay ítems, no renderiza nada. **Reutilizar SIEMPRE** para mostrar equipamiento elegido con cantidad en vez de copiar el bloque fila + stepper + papelera (estaba duplicado en onboarding Fitness y perfil). El equivalente SIN cantidad (solo quitar) lo cubre la lista de seleccionados embebida en `SearchableSelect`.

> **Nota:** existió un átomo `SelectedItemList` (lista de seleccionados SIN cantidad, botón circular para quitar) que usaban `NutritionAllergyStep` y `NutritionDietStyleStep`. Al migrar ambos a `SearchableSelect` (que ya trae su propia lista de seleccionados embebida) quedó huérfano → se borró.

**Props:** `items: {id,name,qty}[]`, `onChangeQty: (id, qty) => void`, `onRemove: (id) => void`, `onClearAll?: () => void`, `accent?` (`lime`/`amber`/`mono`, default `mono`), `label?` (default `'Seleccionadas'`), `maxQty?` (default 99). El `onChangeQty` llega con la cantidad ya acotada a `[1, maxQty]`; quitar es responsabilidad de la papelera (el `−` se deshabilita en 1).

**En uso:** `FitnessConfigStep` (onboarding subStep 3, `lime`), `EquipmentConfig` (perfil, `lime`).

### `EquipmentSelect`

**Buscador de equipamiento** (dark-only `zinc`): input con **lupa a la izquierda** + dropdown absoluto de resultados (excluye los ya seleccionados, filtra por query). **Solo busca y agrega**; la lista de seleccionados con cantidad la pone el consumidor con `EquipmentSelectedList`. Migrado de `slate` a `zinc`; se borró la lista interna de seleccionados (el viejo prop `showSelectedList`, que ambos consumidores pasaban en `false` → era código muerto).

**Props:** `equipments: Equipment[]`, `selectedEquipment: EquipmentSelection[]`, `onSelectionChange: (items) => void`, `placeholder?`.

**En uso:** `FitnessConfigStep` (onboarding subStep 3), `EquipmentConfig` (perfil).

### `InputCard`

Card con input interno. Usar para formularios dentro de cards (ej. registro de métricas).

### `CheckableCard`

Card de lista seleccionable con indicador a la derecha. Tiene dos `variant`:
- **`fill`** (default): seleccionado = relleno invertido (`zinc-50`) + check oscuro. En uso: `FitnessSubGoalConfig` (perfil).
- **`radio`**: card siempre `bg-zinc-900`; seleccionado = **borde + check del acento** (`checkmark-circle`), no seleccionado = círculo vacío (`zinc-600`), label blanco. Estilo de la maqueta de onboarding (eyebrow + pregunta + lista). Sirve para selección única o múltiple (el indicador es solo visual; la lógica la pone el padre). En uso: `FitnessConfigStep` (subStep 0 actividad y subStep 1 sub-objetivos, `lime`), `NutritionSubGoalStep` y `NutritionActivityLevelStep` (`amber`).

**Props:** `isSelected`, `label`, `description?`, `onPress`, `variant?` (`fill`/`radio`), `accent?` (`lime`/`amber`/`mono`, default `mono`; solo aplica en `radio`).

### `FieldSection`

**Átomo.** Encabezado de sección de formulario **sin card** (dark-only `zinc`): etiqueta superior en mayúsculas (eyebrow `text-zinc-500 tracking-widest`) + pregunta (`text-lg text-white`) y, debajo, el control (`children`). Es la versión **sin chrome** de `SectionCard` (que sí envuelve en card con círculo de ícono). **Reutilizar SIEMPRE** en pasos de onboarding/perfil donde la maqueta muestra el campo "al aire" (eyebrow + pregunta + control) en vez de copiar el bloque `<Text uppercase/><Text/><control/>`.

**Props:** `eyebrow: string`, `question: string`, `children`, `className?`.

**En uso:** `FitnessConfigStep` (subStep 0 y subStep 1), `NutritionSubGoalStep`, `NutritionActivityLevelStep`.

### `SelectableCard`

Card con selección única (radio). Usar en pasos de onboarding y configuración de módulos. Tiene dos `variant`:
- **`filled`** (default): opciones cortas en grid, seleccionado = relleno invertido (`zinc-50`), centrado. En uso: `FitnessConfigStep` (Duración — "Tengo tiempo"/"Elegir tiempo", `size="auto"`).
- **`outline`**: lista de **items tipo maqueta** (card `zinc-900 rounded-2xl`, título uppercase + descripción opcional a la izquierda, selección por **borde** `zinc-100`). Dark-only zinc neutro. En uso: `BasicInfoStep3` (objetivos — solo título, `Goal` no trae descripción).

**Props:** `isSelected`, `label`, `description?`, `onPress`, `size?` (`full`/`half`/`auto`), `textSize?` (`sm`/`base`), `variant?` (`filled`/`outline`), `align?` (`center`/`left`). `brandColor?` quedó legacy (sin uso en el render).

### `ProgressBar`

Barra de progreso horizontal. Props: `progress: number (0–1)`, `className?`.

### `FillBar`

**Átomo.** Barra de relleno horizontal: track `bg-zinc-800` + relleno del acento, con `progress` (0–1) acotado internamente. **Reutilizar SIEMPRE** en vez de copiar `<View h-2 rounded-full bg-zinc-800><View bg-amber-400 width%/></View>`.

**Props:** `progress: number`, `accent?: 'amber' | 'lime' | 'mono'` (default `amber`), `heightClassName?` (default `'h-2'`), `className?` (clases extra del track, ej. `'w-full'`).

**En uso:** `MacroProgressRow` (barra de macro del Resumen), `MacroBreakdownCard` (columnas del detalle de comida).

### `GradientText`

**Átomo.** Texto con relleno de gradiente, vía `MaskedView` (forma del texto) + `LinearGradient` (color). Un `Text` interno invisible le da las dimensiones al área del gradiente. Funciona en Expo Go (`@react-native-masked-view/masked-view` es parte del SDK de Expo, no requiere prebuild). El gradiente **default es plata neutro** (`zinc-50 → zinc-300 → zinc-500`): da profundidad sin salirse de la paleta zinc. **Reutilizar SIEMPRE** en vez de cablear MaskedView + LinearGradient inline.

**Props:** `children: string`, `className?` (tipografía: tamaño/peso/leading/tracking — el color lo aporta el gradiente), `colors?` (default plata zinc), `start?`/`end?` (dirección, default diagonal `{0,0}→{1,1}`).

**En uso:** `app/login.tsx` (palabra "Evoluciona." del título de bienvenida, con `colors` violeta→índigo→azul `['#c4b5fd','#818cf8','#3b82f6']` — override del default plata porque el plata quedó muy sutil; sobre `zinc-950` el violeta-azul resalta sin recargar).

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

**Card reutilizable de búsqueda + selección de ítems** (dark-only `zinc`, rediseñada desde la maqueta "Datos de salud"). **Una sola card** (`bg-zinc-900 rounded-3xl border-zinc-800`) que contiene: título opcional, buscador con **lupa a la izquierda** (sin chevron) y, debajo, los ítems **seleccionados** listados con divisores y un **botón circular** (`border-zinc-600`) para quitar cada uno. Al escribir, abre un dropdown absoluto de resultados. Reemplaza al diseño viejo de dos cards separadas (buscador + chips de seleccionados) y fusiona todo en una. **Reutilizar SIEMPRE** para buscar + seleccionar ítems de un catálogo en vez de copiar el patrón input + lista.

> **Punto de color de severidad:** cada ítem muestra un dot por `severity` (`Low` teal / `Medium` orange / `High` red). La maqueta no lo dibuja, pero se conserva como dato real de gravedad (no es el acento del módulo). El **acento de módulo lo aporta el consumidor** (footer/spinner): este átomo es **neutro zinc** para reutilizarse en cualquier módulo.

**Props:** `items: SelectableItem[]`, `selectedIds: string[]`, `onSelectionChange: (ids) => void`, `placeholder?`, `cardTitle?` (título bold; si falta no hay header), `cardSubtitle?`, `cardIconName?` (Ionicons; si se pasa muestra un círculo `zinc-800` a la izquierda — el onboarding NO lo pasa para igualar la maqueta).

> **Tipo de ítem genérico:** acepta `SelectableItem` (`{ id, name, severity? }`), NO el `HealthItem` del dominio de Salud. `severity` es **opcional**: los ítems de Salud la traen (dot de color por gravedad), los de Nutrición (alergias) no, y el dot cae a gris neutro. Esto mantiene al átomo desacoplado de Salud y reutilizable en cualquier módulo (`HealthItem` y `NutritionItem` son ambos asignables a `SelectableItem`).

**En uso:** `HealthConfigStep` (onboarding Salud, sin ícono/subtítulo), `InjuriesConfig`/`ConditionsConfig` (perfil, con ícono + subtítulo), `NutritionAllergyStep` y `NutritionDietStyleStep` (onboarding Nutrición, ítems sin severidad → dot neutro).

### `TagSelect`

Selector de tags múltiples con buscador + dropdown (dark-only `zinc`). Input `bg-zinc-950 border-zinc-800` (focus `border-zinc-600`), dropdown `bg-zinc-800` y, si `showSelectedList` (default `true`), chips `bg-zinc-800 border-zinc-600`. Migrado de `slate` a `zinc`. En onboarding Nutrición se pasa `showSelectedList={false}` y la selección se muestra con `SelectedItemList` (filas) en vez de chips. Props: `items`, `selectedIds`, `onSelectionChange`, `placeholder?`, `showSelectedList?`.

> **Nota:** `TagSelect` (items `{id,name}`) y `SearchableSelect` (items `HealthItem` con severidad) comparten la misma mecánica de buscador. No se unificaron porque difieren en el tipo de ítem y en el render de la selección (chips/filas vs. card fusionada). Si aparece un 3.º consumidor con las mismas necesidades, recién ahí conviene unificarlos.

### `SegmentedControl`

Control segmentado dark-only (estilo iOS) para toggles/selectores de 2-4 opciones excluyentes y cortas. Contenedor `bg-zinc-900 border-zinc-800 rounded-xl p-1`, segmentos `flex-1` (ancho igual). **Genérico** sobre el tipo del `value` (`<T extends string>`). Dos `variant` para el segmento activo:
- **`subtle`** (default): resalte tenue `bg-zinc-800` + **texto** del acento. Para toggles tipo IA/Manual.
- **`solid`**: **relleno completo** del acento (`bg-lime/amber/zinc-50`) + texto `zinc-900`. Para selectores tipo maqueta de onboarding (ej. nivel de experiencia).

Reutilizar SIEMPRE en vez de copiar `TouchableOpacity` con ternarios de fondo.

**Props:** `options: { label: string; value: T }[]`, `value: T`, `onChange: (value: T) => void`, `accent?: 'lime' | 'amber' | 'rose' | 'mono'` (default `mono`), `variant?: 'subtle' | 'solid'` (default `subtle`).

> El accent `rose` se agregó para el módulo de Datos Clínicos (Salud). En uso: `ClinicalDataView` (grupo sanguíneo A/B/AB/O y Rh +/−, `subtle`). Con `value=''` (string vacío) ningún segmento queda activo → estado "no informado" gratis (mismo truco que el género en `BasicInfoStep1`).

**En uso:** biblioteca de rutinas de Fitness (`app/(tabs)/fitness/index.tsx`, IA/Manual, `lime` subtle); selector de comida en `FoodRegisterView` (`amber` subtle); `BasicInfoStep1` (género, `mono` subtle); nivel de experiencia en `FitnessConfigStep` subStep 0 (`lime` **solid**).

**Cuándo NO usar:** chips redondeados independientes (usar `SelectablePill`), selección con scroll horizontal, o labels largos que no entran en `flex-1` (más de ~4 opciones).

### `QuantityStepper`

**Átomo.** Selector de cantidad `−  valor unidad  +`: dos botones circulares con borde del acento y el valor centrado. **No usa gestos propios** (solo toques), así que puede vivir dentro de un `Pressable`/`ScrollView` sin pelearse con el responder system — a diferencia del `RulerPicker`, que sí necesita aislarse del `Pressable` padre. Reutilizar SIEMPRE para ajustar gramos/cantidades en vez de copiar dos botones con un número en medio.

**Props:** `value: number`, `onChange: (value: number) => void`, `step?` (default 5), `min?` (default 0), `max?` (default 9999), `unit?` (default `'g'`), `accent?: 'amber' | 'lime' | 'mono'` (default `amber`). El `onChange` ya llega acotado a `[min, max]`.

**En uso:** `ConsumedFoodCard` (gramos del alimento, `step` 5, `min` 1, `max` 2000); `EquipmentSelectedList` (cantidad de equipamiento, `step` 1, `min` 1, sin unidad, `accent="lime"`).

**Cuándo NO usar:** edición de valor preciso con arrastre fino (usar `RulerPicker`).

### `WheelPicker`

**Átomo.** Selector de valor numérico con el control **NATIVO del SO**: en **iOS** es un wheel vertical girable (`UIPickerView`), en **Android** un dropdown/diálogo nativo (Android stock no tiene wheel girable). Muestra la etiqueta + el valor grande arriba (`text-5xl` blanco + unidad `zinc-400`) y debajo el wheel; en iOS resalta la fila central (`zinc-800 rounded-xl`), con divisor vertical y columna de unidad a la derecha. **Reutilizar SIEMPRE** para elegir un número de un rango (peso, altura, edad…) en vez de cablear `Picker` + display de valor inline.

> **Por qué nativo y no un wheel JS:** al ser un componente nativo, no pelea con el responder system del `ScrollView` padre. Un wheel JS (ScrollView vertical con snap) entraría en **conflicto de gesto** con el scroll vertical de la página (lección documentada en `agent-implementation-lessons.md`). El `RulerPicker` evita ese conflicto por ser horizontal; este lo evita por ser nativo.

**Props:** `label`, `value: number`, `onChange: (value: number) => void`, `min`, `max`, `step?` (default 1), `unit`, `wheelHeight?` (alto del wheel en iOS, default 180 — bajarlo para que entren varios en pantalla), `accent?: 'lime' | 'amber' | 'mono'` (default `mono`; tiñe el **valor grande** con el color del módulo — la unidad sigue tenue `zinc-400` en `mono`).

> **Ojo con el gesto:** el wheel nativo **captura el pan vertical**, así que NO se puede scrollear la página arrastrando sobre él. Si hay 2+ wheels, calculá `wheelHeight` para que TODO entre en pantalla sin scroll (ver `BasicInfoStep2`, que lo computa responsive). Documentado en `agent-implementation-lessons.md`.

**En uso:** `BasicInfoStep2` (onboarding: Peso 30–200 kg, Altura 100–220 cm); `FitnessConfigStep` (onboarding subStep 2: Duración por sesión 15–120 min, `accent="lime"`, solo cuando se elige "Elegir tiempo").

**Cuándo NO usar:** ajuste fino con arrastre tipo regla horizontal (usar `RulerPicker`), o cantidades con `−/+` (usar `QuantityStepper`).

### `SelectablePill`

Chip seleccionable (píldora) dark-only: `rounded-full border` + texto. Estructura fija, acento del estado activo configurable. Estado no seleccionado en `zinc` (`bg-zinc-800 border-zinc-700 text-zinc-300`, sin azulado). **Reutilizar SIEMPRE en filtros horizontales y selectores de día** en vez de copiar el `TouchableOpacity rounded-full border` con su ternario.

**Props:** `label: string`, `selected: boolean`, `onPress: () => void`, `accent?: 'mono' | 'lime' | 'amber'` (default `mono`), `className?` (default `px-4 py-2`).

**En uso:** `AddExerciseSheet` (filtros músculo/equipamiento, `lime`), `NutritionDaySelector` (`amber`).

**Cuándo NO usar:** chips con `onLongPress`, fondo transparente al deseleccionar, o layout propio (ej. los chips de día de `CreateRoutineView`).

### `WeekDayPicker`

Selector de días de la semana con **pills circulares** (`rounded-full`, dark-only `zinc`, rediseñado desde la maqueta de onboarding Fitness). Seleccionado = círculo `bg-zinc-900` con **borde + texto del acento**; sin seleccionar = `bg-zinc-900 border-zinc-800` + texto `zinc-400`. Todos los días se tratan igual (se quitó la distinción de fin de semana rojo de la versión slate vieja: la maqueta no la usa). **Reutilizar SIEMPRE** para elegir días de la semana en vez de copiar la fila de `TouchableOpacity` circulares.

**Props:** `days: { value: number; label: string; isWeekend?: boolean }[]` (`isWeekend` queda por compatibilidad con `WEEKDAY_OPTIONS`, ya no afecta el estilo), `selectedDays: number[]`, `onChange: (days) => void`, `accent?: 'lime' | 'amber' | 'mono'` (default `mono`).

**En uso:** `FitnessConfigStep` (onboarding subStep 2, `lime`), `FitnessTrainingPreferencesConfig` (perfil, `lime`).

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
| `RoutineDetailView` | Vista fullscreen de detalle de rutina (lectura + modo swap). Expande desde una card con animación. Selector de días por swipe horizontal (FlatList paginado). Menú `···` con acciones contextuales. Edita in-place montando `RoutineEditMode` cuando `isEditMode`. **Versionado:** header muestra `VersionBadge` con "Versión N" + "Última" (distintivo lime) cuando `activeVersionId === latestVersionId`; el menú trae "Ver versiones" (abre `RoutineVersionsSheet`). Al elegir una versión, la MISMA vista entra en **modo preview** (muestra el `days[]` de esa versión, header back sale del preview) y el botón "Comenzar rutina" se reemplaza por **"Activar versión"** (`PATCH active-version`) + **"Restaurar como nueva versión"** (`POST .../restore`). Si la versión vista ya es la activa, solo se ofrece restaurar. Solo dark mode. |
| `RoutineEditMode` | Modo edición in-place (mismo diseño oscuro que el detalle). Drag&drop nativo, header de días con slot "+", wheel picker para Sets/Reps/Rest/Peso, swipe cambiar/eliminar. Se renderiza desde `RoutineDetailView`. Guarda con `updateRoutine`. |
| `RoutineVersionsSheet` | **Historial de versiones de una rutina** (`BottomSheetModal`, dark `zinc`/`lime`). Lista cada versión (`GET /{id}/versions` vía `useRoutineVersions`) con número, fecha (`formatRelativeDay`), motivo (`changeReason`) y badges `VersionBadge` "En uso" (`isActive`) / "Última" (`isLatest`). Tap → `onSelectVersion` (el detalle la abre en preview). Maneja loading/error/vacío. Props: `visible`, `routineId`, `selectedVersionId?`, `onClose`, `onSelectVersion`. |
| `routine-detail-shared` | Piezas compartidas entre detalle y edición: `DaySlot` (cross-fade de días), `SLOT_CONFIGS`, `TAB_BAR_HEIGHT`, `BOTTOM_BUTTON_HEIGHT` y `VersionBadge` (pill chico **no interactivo** para versionado, `tone` `lime`/`zinc` — distinto de `SelectablePill`, que sí es interactivo). No es un componente visual de uso directo. |
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
| `HealthDashboard` | **Orquestador de la pantalla Salud.** Maneja loading/error (acento `rose-400`) y arma: título "Salud" + **bloque clínico** (`ClinicalProfileCard` + `RegisterReadingCard` + `ClinicalReadingsEntryCard`) + divisor + `LastMeasurementCard` + `BodyEvolutionDashboardSection` + `MeasurementHistorySection`. El bloque clínico va agrupado arriba (decisión del usuario: separar lo clínico de lo corporal). |
| `LastMeasurementCard` | **Card "Última medición"** (`bg-zinc-900 rounded-3xl`). Título + fecha debajo (`16 jun 2026`), fila de columnas de composición (Peso/Grasa/Masa magra) separadas por **divisores verticales** `bg-zinc-800` (no chips con caja), fila "N medidas perimetrales registradas" (`body-outline`) y CTA sólido `rose-400` con `add-circle-outline` + "Registrar nueva medición" (texto `zinc-900`). Solo renderiza las columnas con dato real. Estado vacío con CTA "Registrar primera medición". |
| `BodyEvolutionDashboardSection` | **Sección "Evolución física"** (heading limpio, sin subtítulo). Ordena Peso primero y mapea `BodyMetricTrendCard`. Estados loading/error/vacío en `zinc`/`rose-400`. |
| `BodyMetricTrendCard` | **Card de tendencia por métrica** (`bg-zinc-900 rounded-3xl`). Nombre + "Último valor" a la izquierda, valor grande + unidad a la derecha, **sparkline SVG** (`react-native-svg`, línea `rose-400` con **puntos en los extremos**) y fila inferior `fechaInicio · cambio · fechaFin`. El cambio es texto plano `zinc-500` con signo `−/+` (sin pill ni color, según la maqueta); el detalle del % se quitó. |
| `MeasurementHistoryCard` | Card compacta del historial (barra lateral `rose-400`, fecha + resumen). `zinc`/`rose`. |
| `MeasurementHistorySection` | Lista de hasta 4 mediciones recientes + CTA `rose-400` "Ver historial completo". `zinc`/`rose`. |
| `MeasurementDetailView` | **Vista de detalle de una medición** (`/health/[id]`, dark `zinc`/`rose-400`, rediseñada desde la maqueta). Header back circular (`bg-zinc-900`, chevron `rose-400`) + título + botón "Comparar" outline (`border-zinc-700`, ícono `analytics-outline` rose). Bloque de fecha con `calendar-outline` rose + fecha grande + "Registrado a las HH:MM" (solo hora, `formatCapturedTime`). Card "Composición corporal" (reusa `BodyCompositionColumns`) y card "Medidas perimetrales" con filas `label · · · · valor cm` (**leader punteado**: `border-b border-dotted border-zinc-700 flex-1`). `PerimeterRow` es subcomponente local. Solo renderiza columnas/filas con dato real (no inventa). `paddingBottom` del scroll suma `TAB_BAR_HEIGHT` + `insets.bottom` (vive en `(tabs)`, tab bar nativo encima). Props: `measurement`, `onBack`, `onPressCompare?`. |
| `BodyCompositionColumns` | **Átomo.** Fila de columnas de composición corporal (Peso/Grasa/Masa magra) separadas por divisores verticales `zinc-800`: etiqueta `zinc-400` arriba, valor `white text-3xl` + unidad abajo. **Reutilizar SIEMPRE** en vez de copiar el `flex-row` con columna + divisor. Cada consumidor arma su propio array `items` (labels/formato propios). Props: `items: { label, value, unit }[]`, `className?`. En uso: `LastMeasurementCard`, `MeasurementDetailView`. |
| `MeasurementComparisonSheet` | **Bottom sheet de comparación entre dos mediciones** (`height 88%`, dark `zinc`/`rose-400`, rediseñado desde la maqueta). Header back circular (`chevron-back` rose, llama `onClose`) + título + fechas `target vs base` (más reciente primero, `formatShortDate` → "21 jun. 2026"). Dos cards: **resumen** (3 columnas destacadas Peso/Grasa/Cintura con `viejo → nuevo` y unidad, divisores verticales `zinc-800`; cae a las primeras 3 deltas si esas keys faltan) y **"Cambios en tus mediciones"** (lista de TODAS las deltas: etiqueta · `viejo ↓/↑ nuevo` (nuevo en rose-400) · `Cambio:` firmado). El **cambio se pinta por DIRECCIÓN** (baja = `green-400`, sube = `red-400`, igual = `zinc-500`) por decisión del usuario, fiel a la maqueta — es color de dirección, NO interpretación de salud (ver `agent-implementation-lessons.md`). Las mediciones se ordenan **cronológicamente** en el util (`base` = más antigua, `target` = más reciente) para que el diff sea "anterior → actual". `SummaryColumn`/`ChangeRow` son subcomponentes locales (uso único). Props: `comparison`, `isLoading`, `error`, `onClose`. |
| `BodyMeasurementFormView` | **Formulario de registro de medición** (`/health/measurements`, dark `zinc`/`rose-400`, rediseñado desde la maqueta). Header back + título centrado "Registrar medición". **Una sola card** `zinc-900 rounded-3xl` con dos secciones divididas por línea: "Composición corporal" (fila Peso) y "Medidas perimetrales" (subtítulo + 8 filas: Cintura, Cuello, Pecho, Brazo, Antebrazo, Cadera, Muslo, Pantorrilla). Cada fila es `label ···· [input unidad]` con caja `border-zinc-800`. CTA `rose-400` con `save-outline` + "Guardar medición" (texto `zinc-900`) al final del `ScrollView` (no flotante); el `paddingBottom` del scroll suma `TAB_BAR_HEIGHT` + `insets.bottom` para no quedar tapado por el tab bar nativo. `MeasurementRow` es subcomponente local (uso único). **No renderiza el panel "Grasa corporal estimada / Masa magra"** de la maqueta: esos valores los calcula el backend al guardar, no hay dato en vivo y `agent.md §7` prohíbe calcular salud en el cliente (ver `agent-implementation-lessons.md`). Props: `isSubmitting`, `submitError`, `onBack`, `onSubmit`. |

#### Datos Clínicos — `src/components/features/health/clinical/`

Submódulo de Salud (dark-only `zinc`, acento `rose-400`). Contrato en `docs/clinical-data-frontend-guide.md`. Enums serializados como **números** (`bloodType` A0/B1/AB2/O3, `rhFactor` +0/−1). El azul de las maquetas se tradujo a `rose-400` (regla de siempre). Implementado por fases (ver `docs/clinical-data-implementation-plan.md`).

| Componente | Descripción |
|------------|-------------|
| `ClinicalProfileCard` | **Card del dashboard de Salud** (1ª del bloque clínico) → vista "Datos clínicos". Estado vacío (sin grupo sanguíneo ni condiciones) = CTA sólido `rose-400` "Configurar perfil clínico"; con datos = card tappable con resumen (grupo sanguíneo `O+`, condiciones activas, estado de IA) + chevron. Espeja `LastMeasurementCard`. Props: `profile`, `isLoading?`, `onPress`. |
| `ClinicalDataView` | **Vista "Datos clínicos"** (`/health/clinical`, perfil clínico). Header back circular + título grande + subtítulo. Tres cards: **Perfil clínico** (grupo sanguíneo y Rh con `SegmentedControl accent="rose"`), **Condiciones a considerar** (`Switch` nativo: Monitoreo glucosa = `hasGlucose`, Lípidos/colesterol alto = `hasDyslipidemia`) y **Uso por IA** (candado + indicador de estado + `Switch` `allowAiUsage` + nota). CTA `rose-400` "Guardar cambios" (`PUT /profile`) dentro del scroll con offset `TAB_BAR_HEIGHT` + `insets.bottom`. El **toggle de IA persiste al cambiarlo** (`PUT /ai-consent`, aparte de "Guardar cambios" — así lo exige el contrato). El estado local se **hidrata una sola vez** desde `profile` (sin pisar ediciones, sin loops). `ToggleRow` es subcomponente local (uso único). Props: `profile`, `isLoading`, `isSubmitting`, `submitError`, `onBack`, `onSave`, `onToggleAiConsent`. |
| `RegisterReadingCard` | **Card "Registrar lectura" REUTILIZABLE** → formulario de registro de lectura. Tile circular con "+" (`rose-400`), título + subtítulo y enlace "Nueva lectura →". Se usa en el dashboard de Salud (2ª del bloque clínico) y en el tope de la vista "Lecturas clínicas". Props: `onPress`. |
| `ClinicalReadingFormView` | **Vista "Registrar lectura"** (`/health/clinical-reading-new`). Header back circular + título grande + subtítulo. Card **Fecha** (fila tappable con `formatDate` "24 jun. 2026" + calendario rose + chevron; `DateTimePicker` togglable: spinner inline en iOS, diálogo nativo en Android, default hoy, `maximumDate` = hoy) + card **Valores clínicos** (5 filas Glucosa/Colesterol total/HDL/LDL/Triglicéridos con input **subrayado rose** + `mg/dL`, `decimal-pad`) + nota informativa. Valida al menos un valor y cada uno **> 0** (evita el 400). El payload manda `date` (YYYY-MM-DD vía `toDateKey`, sin shift de UTC) + solo los valores cargados. CTA `rose-400` "Guardar lectura" (`POST /readings`) con offset `TAB_BAR_HEIGHT` + `insets.bottom`. `ReadingRow` es subcomponente local. Props: `isSubmitting`, `submitError`, `onBack`, `onSubmit`. |
| `ClinicalReadingsEntryCard` | **Card del dashboard de Salud** (3ª del bloque clínico) → vista "Lecturas clínicas". `IconTile` (`pulse-outline` rose) + título + subtítulo (`N lecturas registradas` o "Consultá tus valores en el tiempo.") + chevron. Props: `totalCount`, `onPress`. |
| `ClinicalReadingHistoryCard` | **Card del historial de lecturas** (vista 3). `IconTile` calendario rose + fecha + hora (`formatTime` HH:MM local de `capturedAt`), divisor, y filas `label · valor mg/dL` **solo con los valores no-null** (degradación honesta: una lectura con solo glucosa muestra solo esa fila). **Sin tap/chevron**: no hay pantalla de detalle (el usuario no la pidió y la card ya muestra todos los valores) → no se pinta un affordance muerto. Props: `reading`. |
| `ClinicalReadingsView` | **Vista "Lecturas clínicas"** (`/health/clinical-readings`). Header back circular + título grande + subtítulo, luego `FlatList` con `ListHeaderComponent` = `RegisterReadingCard` (reusada → registrar) + "Historial", y `ClinicalReadingHistoryCard` por ítem. Paginado (`onEndReached` → loadMore), con estados loading inicial / loadMore / error (retry) / vacío. `paddingBottom` suma `TAB_BAR_HEIGHT` + `insets.bottom`. Props: `readings`, `hasMore`, `isLoading`, `isLoadingMore`, `error`, `onBack`, `onRegister`, `onLoadMore`, `onRefresh`. |

### Onboarding — `src/components/features/onboarding/`

| Componente | Descripción |
|------------|-------------|
| `ModuleSelectionStep` | **Paso de selección de módulos del onboarding "Elige tu enfoque"** (montado en `app/onboarding.tsx`, dark-only `zinc` neutro). Alineado al chrome de los pasos 1/2/3: `bg-zinc-950`, `ProgressBar` original (no el indicador numerado de la maqueta), `OnboardingHeader` **centrado** ("Elige tu enfoque" + subtítulo) y `OnboardingFooter` con helper info (círculo `zinc-900`/`border-zinc-800` + `information-circle-outline`). Las **tarjetas de módulo** (`ModuleCard` local) se mantienen **sin cambios por decisión del usuario**: imagen de fondo a la derecha + degradado `#0F172B → rgba(51,78,145,0.25)`, ícono en círculo `bg-white/20`, check blanco — NO se migraron a `zinc` ni se tradujo el azul del degradado (excepción puntual a la regla "maqueta azul → acento"). Selección múltiple + opción "Todo incluido" (frontend-only, toggle de todos). Props: `modules`, `selectedModuleIds`, `onSelectionChange`, `onContinue`, `isSubmitting`, `isLoading`. |
| `BasicInfoStep3` | **Paso 3 del onboarding: Objetivo** (montado en `app/onboarding.tsx`, `step === 2`, dark-only `zinc` **neutro**). Mismo lenguaje que los pasos 1/2: `ProgressBar` original, `OnboardingHeader` **centrado** ("Tu objetivo" + subtítulo), footer con helper de info, sin botón "Atrás" (back por swipe). Los **objetivos** se presentan como **lista de items** (`SelectableCard variant="outline"`, estilo de la maqueta) — solo título, porque `Goal` no trae descripción (no se inventa). Selección por borde `zinc-100`. El botón "Continuar" queda habilitado con guard por `alert` (contrato del test del paso 3, a diferencia de los pasos 1/2 que usan `disabled`). Reutiliza `OnboardingHeader`, `OnboardingFooter`, `ProgressBar`, `SelectableCard`. Props: `goal`, `onGoalChange`, `onContinue`, `onBack` (no se renderiza, lo cubre el swipe), `isSubmitting`, `goals`, `isLoading`. |
| `BasicInfoStep2` | **Paso 2 del onboarding: Peso + Altura** (montado en `app/onboarding.tsx`, `step === 1`, dark-only `zinc` **neutro**). Rediseñado desde la maqueta "Datos físicos": `ProgressBar` original, `OnboardingHeader` **centrado** ("Datos físicos" + subtítulo), dos cards `zinc-900 rounded-3xl` cada una con un **`WheelPicker`** nativo (Peso 30–200 kg, Altura 100–220 cm) y `OnboardingFooter` con helper de info ("Podrás modificar estos datos más adelante."). **No dibuja botón "Atrás"** (la maqueta no lo muestra): el back se resuelve por swipe (`SwipeBackWrapper` en `onboarding.tsx`), igual que el paso 1 no tiene back. Reemplazó al `RulerPicker` horizontal por el wheel nativo (pedido del usuario: control nativo en iOS y Android). Reutiliza `OnboardingHeader`, `OnboardingFooter`, `ProgressBar`, `WheelPicker`. Props: `weight`, `onWeightChange`, `height`, `onHeightChange`, `onContinue`, `onBack` (este último ya no se renderiza, lo cubre el swipe). |
| `BasicInfoStep1` | **Paso 1 del onboarding: Fecha de nacimiento + Género** (montado en `app/onboarding.tsx`, `step === 0`, dark-only `zinc` **neutro**). Rediseñado desde la maqueta "Datos básicos": `ProgressBar` original (no el indicador numerado de la img — decisión del usuario), `OnboardingHeader` **centrado** (título "Datos básicos" + subtítulo), card `zinc-900 rounded-3xl` con el `DateTimePicker` spinner (texto blanco) y **género con `SegmentedControl accent="mono"`** de SOLO Masculino/Femenino (sin "Otro"). El estado **"no seleccionado"** se logra dejando `gender=''`: ningún segmento matchea → ninguno resaltado (no hay tercer segmento fantasma). `OnboardingFooter` con helper de candado ("Usaremos estos datos para calcular recomendaciones más precisas."). **No es módulo** → el azul de la maqueta se tradujo a `zinc` neutro (igual que login/Perfil/PrivacyTermsStep). Reutiliza `OnboardingHeader`, `OnboardingFooter`, `ProgressBar`, `SegmentedControl`. Props: `date`, `onDateChange`, `gender`, `onGenderChange`, `onContinue`. |

> **`OnboardingHeader` (`common/`) ahora acepta `centered?: boolean`** (default `false`): centra título y subtítulo. Lo usa `BasicInfoStep1` (maqueta de Datos básicos); el resto del flujo (pasos 2/3) sigue alineado a la izquierda (default). El prop `inverted` sigue igual.

### Auth — `src/components/features/auth/`

Pantalla de bienvenida/login (`app/login.tsx`, dark-only `zinc` **neutro**). Rediseñada desde la maqueta: wordmark "WELLIUM" (`tracking-[8px]` zinc-500), título de 3 líneas "Entrena. / Aliméntate. / Evoluciona." (`text-6xl font-extrabold`; las dos primeras en blanco y "Evoluciona." con `GradientText` violeta→azul), subtítulo zinc-500, fila de 3 features con divisores verticales (`barbell`/`restaurant`/`heart`-outline, mismos íconos que el tab bar) y los dos botones sociales. **Login NO es un módulo** (`colors.md` → "resto de la UI" = `zinc` neutro): el azul de la maqueta se tradujo a `zinc`, decisión del usuario — mismo criterio que Perfil. **No se implementó el paginador de 2 puntos** de la maqueta: implicaría un carrusel de 2 slides y solo había diseño de una (no inventar — ver `agent-implementation-lessons.md`). Tampoco la línea de Términos/Privacidad (el usuario la excluyó). `FeatureColumn` es subcomponente local (uso único, mapeado sobre el array `FEATURES`).

| Componente | Descripción |
|------------|-------------|
| `PrivacyTermsStep` | **Paso de privacidad del onboarding** (`src/components/features/onboarding/`, montado en `app/onboarding.tsx`, dark-only `zinc` **neutro**). Rediseñado desde la maqueta "Tu privacidad es lo primero": hero de escudo `shield-outline` blanco sobre círculos `zinc-900`/`zinc-800` (sin el glow azul de la maqueta), título + subtítulo, **3 filas de feature informativas** (`IconTile` + label, divisores `zinc-800`, sin card, **sin chevron**), card de consentimiento (`Switch` mono + nota con `lock` + link "Política de Privacidad") y CTA sólido `bg-zinc-50`/`text-zinc-950` "Continuar". **No es módulo** → el azul de la maqueta se tradujo a `zinc` neutro (decisión del usuario, igual que login/Perfil). El hero y las filas se compactaron (`size 48`, `py-3`) para que la card de consentimiento + botón no queden cortados. El **modal de Política de Privacidad** (contenido legal real: Ley 18.331/ARCO/AES-256) se mantiene, accesible **solo** desde el link de la nota del toggle (el usuario pidió sacar el acceso de las filas, no del toggle — ver `agent-implementation-lessons.md`). Reutiliza `IconTile`. Props: `onContinue`, `isSubmitting`. |
| `SocialAuthButton` | **Átomo.** Botón de autenticación social (`rounded-2xl py-4`, ícono + label centrados). Dos variantes: `light` (superficie `white` + texto `zinc-900`, acción primaria — Google) y `dark` (superficie `zinc-900` + borde `zinc-800` + texto `white`, secundaria — Apple). El ícono se pasa como `ReactNode` (SVG del proveedor). **Reutilizar SIEMPRE** en vez de copiar el `TouchableOpacity flex-row` por cada proveedor. Props: `label`, `icon`, `variant: 'light' \| 'dark'`, `onPress`. En uso: `app/login.tsx` (Google + Apple). |

### Perfil — `src/components/features/profile/`

Perfil es un **stack de rutas reales** en `app/profile/` (`_layout.tsx` + `index.tsx` + las listas de módulo `fitness.tsx`/`nutrition.tsx`/`health.tsx`/`settings.tsx` + un archivo de ruta por cada config: `fitness-equipment`/`fitness-training`/`fitness-subgoal`/`nutrition-dietary`/`health-injuries`/`health-conditions`), pusheado desde el home, **fuera de `(tabs)`** → sin tab bar nativo. **Re-rediseñado** desde una nueva maqueta: cards con icon-tile + bullets por módulo, dark-only `zinc` **neutro** (Perfil = "resto de la UI" en `colors.md` → sin acento; el azul de la maqueta se tradujo a `zinc`, decisión del usuario — ver `agent-implementation-lessons.md`). La raíz (`index.tsx`) es: título "Perfil" + `ProfileIdentityHeader` (card horizontal) + "CUENTA" (Suscripción) + "MIS MÓDULOS" (cards de Fitness/Nutrición/Salud activos con bullets + Configuración) + botón "Cerrar sesión" (outline **rojo** destructivo) + "Versión". Cada fila de módulo `router.push('/profile/<sección>')`.

> **Por qué TODO es ruta real (incluidos los configs):** antes el Perfil navegaba por estado (`activeSection` en `index`, `activeSubView` en cada `SettingsView`); el gesto swipe nativo de iOS popeaba de más y, con `usePreventRemove` + `gestureEnabled:false`, glitcheaba (la salida nativa arrancaba y el JS la cancelaba con un salto). Primero se route-ificó solo el **nivel sección**, dejando los configs por estado y confiando en `gestureEnabled:false` para frenar el gesto — **pero ese toggle no frena el gesto de forma confiable**, así que el glitch seguía al volver de un config. La solución definitiva: **cada config también es ruta real** (`/profile/fitness-equipment`, etc.). El swipe-back es 100% nativo y suave en todos los niveles. El scaffold `ProfileSectionScreen` envuelve tanto las listas como los configs (nav bar + back = `router.back()`); el guard de "cambios sin guardar" de cada config lo aporta el hook `useUnsavedChangesGuard` (`usePreventRemove` solo cuando hay cambios reales). Se eliminó toda la plomería `onSubBackChange`/`backHandlerRef`/`onRegisterBackHandler`/`gestureEnabled`.

> **Bullets de las cards de módulo = sub-secciones REALES, no las de la maqueta.** La maqueta dibujaba bullets inventados (Fitness: Objetivos/Experiencia/Equipamiento; Salud: Mediciones/Lesiones/Condiciones). Se usan los labels reales del config de cada módulo (Fitness: Equipamiento/Días y duración/Sub objetivo; Nutrición: Sub objetivo/Alergias alimenticias/Estilo de dieta; Salud: Lesiones/Afecciones médicas — "Mediciones" vive en el tab Salud, no en el config). Misma regla "no inventar" de siempre.

**Sub-vistas alineadas a la raíz:** los 3 submenús (`FitnessSettingsView`, `NutritionSettingsView`, `HealthSettingsView`) ahora reusan **`ProfileModuleCard`** (icon-tile + título), el mismo átomo que la raíz, para que no desentonen con el diseño nuevo. Antes usaban una lista plana de texto (`ProfileListGroup` + `ProfileListRow`); esos dos átomos quedaron huérfanos al migrar las 3 vistas → se borraron. Cada item lleva un ícono decorativo de UI (Fitness: `barbell`/`calendar`/`flag`/`heart`/`ban`; Nutrición: `flag`/`alert-circle`/`restaurant`; Salud: `bandage`/`medkit`) y `router.push` a la ruta real del config. Las `SettingsView` quedaron como **listas puras** (sin estado ni props): solo cards + navegación. Las `*Config` (`EquipmentConfig`, `InjuriesConfig`/`ConditionsConfig`, `DietaryConfig`, `FitnessSubGoalConfig`, `FitnessTrainingPreferencesConfig`) reciben solo `onBack` (= `router.back()` tras guardar) y usan `useUnsavedChangesGuard` para el guard de salida; ya no reciben `onRegisterBackHandler`. Todas en `zinc` con CTA mono `bg-zinc-50`/`text-zinc-950`.

> **Deuda `slate` restante (átomos compartidos con onboarding):** `SectionCard`, `CheckableCard`, `RulerPicker`, `SearchableSelect`, `TagSelect` siguen en `slate` (`slate-900 ≈ zinc-900`, diferencia mínima). (`WeekDayPicker` y `EquipmentSelect` ya se migraron a `zinc`.) No se migraron acá por su blast radius en onboarding; se limpian incrementalmente al tocarlos. `ProfileMenuPanel` y `SectionHeader` se borraron al quedar huérfanos. `ProfileHeader`/`SettingsSection`/`ConfigMenuItem` quedan (solo los referencia `_profile_old.tsx.bak`, backup del usuario).

| Componente | Descripción |
|------------|-------------|
| `ProfileModuleCard` | **Card de navegación del Perfil** (dark `zinc` neutro, sin acento). Reutiliza `IconTile` (color zinc-300). Cubre tres formas: fila con **subtítulo** (Suscripción "Plan Premium activo" / Configuración "Ajustes de la aplicación"), **card de módulo con bullets** (Fitness/Nutrición/Salud en la raíz) y **fila solo título** (items de las sub-vistas — sin subtitle ni bullets renderiza solo icon-tile + título + chevron). `subtitle` y `bullets` son **excluyentes**. Los `bullets` deben ser sub-secciones reales. **Reutilizar SIEMPRE** para filas/cards de navegación del Perfil (raíz y sub-vistas), no crear filas paralelas. Props: `icon` (Ionicons), `title`, `subtitle?`, `bullets?: string[]`, `onPress`. En uso: `app/profile/index.tsx` (raíz) y `FitnessSettingsView`/`NutritionSettingsView`/`HealthSettingsView` (sub-vistas). |
| `ProfileSectionScreen` | **Scaffold de TODAS las rutas del Perfil** (listas de módulo y configs por igual). Aporta el nav bar (back circular `router.back()` + título centrado) sobre el contenido. El back es **swipe nativo** (cada vista es ruta real), sin la plomería `subBack`/`gestureEnabled`/`usePreventRemove` que tenía antes. El guard de cambios sin guardar de los configs lo pone `useUnsavedChangesGuard`, no este scaffold. Props: `title`, `children`. |
| `useUnsavedChangesGuard(hasUnsavedChanges, message?)` | **Hook** (`src/hooks/useUnsavedChangesGuard.ts`). Si `hasUnsavedChanges`, intercepta el back (botón, gesto swipe o hardware) con `usePreventRemove` y pide confirmación (`Alert`) antes de salir; al confirmar hace `navigation.dispatch(data.action)`. **Reutilizar SIEMPRE** en sub-pantallas con formulario que viven en su propia ruta, en vez de copiar el `backHandlerRef`/`onRegisterBackHandler`. En uso: los 6 configs del Perfil. |
| `ProfileIdentityHeader` | **Card de identidad horizontal** (rediseñada desde la nueva maqueta): card `zinc-900 border-zinc-800` con avatar circular 80px a la izquierda (imagen Clerk o iniciales), nombre y badge de plan (pill `zinc` con `diamond-outline`, sin azul). **No muestra email** (la maqueta es una card limpia nombre + plan; el prop `email` se mantiene en la interfaz pero ya no se renderiza). Props: `fullName`, `email`, `avatarUrl?`, `plan?`. |

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
| `SessionComparePicker` | Bottom sheet para **elegir la sesión a comparar** (lista paginada de `TrainingHistoryListCard`, excluye la sesión actual). Props: `excludeId`, `onSelect`, `onClose`. |
| `SessionComparisonSheet` | **Bottom sheet de comparación entre dos sesiones** (`height 88%`, dark `zinc`/`lime`, rediseñado desde la maqueta). Header back (`chevron-back` lime) + título + fechas `target ↔ base` (`formatSessionDateDots`, "22 jun. 2026"). Tres bloques: **"Rendimiento general"** (veredicto `mejor`/`peor`/`similar` con ícono en círculo + 3 mini-stats `PerformanceStat` de series/duración/volumen), **"Comparación de sesiones"** (tabla con cabecera de fechas y filas `ComparisonRow`: etiqueta · valor base `zinc` → valor target `lime`) y **"Ejercicios en común"** (card con filas `ExerciseDeltaRow`: nombre + top set `peso × reps` base→target + cambio destacado `+5 kg`/`+3 repeticiones`). `PerformanceStat`/`ComparisonRow`/`ExerciseDeltaRow` son subcomponentes locales (uso único). El **azul de la maqueta → `lime-400`** (regla de siempre). Las sesiones se ordenan **cronológicamente** en el util (`base` = más antigua, `target` = más reciente) para que el diff sea "anterior → actual". El top set y el veredicto se computan en cliente desde `sets[]` (agregación de presentación, **no** cálculo de salud — ver `agent-implementation-lessons.md`). Props: `comparison`, `isLoading`, `error`, `onClose`. |

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
