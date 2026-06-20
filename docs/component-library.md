# Component Library

> **REGLA:** Antes de crear cualquier componente nuevo, buscá aquí primero. Si existe algo reutilizable, usalo. Si necesitás una variante, extendé el componente existente.

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

Card de rutina en el módulo Fitness. Tiene 3 estados: `initial` (sin rutina), `loading` (generando con IA), `success` (rutina activa). Soporta `ref` para animación de expansión.

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

### `BottomSheetModal`

Sheet modal que sube desde abajo. Usar para selecciones, filtros o acciones contextuales en lugar de Alert.

### `SearchableSelect`

Input con búsqueda y lista desplegable. Usar para selección de ejercicios, alimentos, etc.

### `TagSelect`

Selector de tags múltiples (chips). Usar para filtros y configuración multi-opción.

### `WeekDayPicker`

Selector de días de la semana. Usado en la creación/edición de rutinas.

### `BackButton`

Botón de retroceso estándar con ícono. Usar en headers de pantallas secundarias (no tabs).

### `FullPageLoader`

Overlay de carga de página completa. Usar durante operaciones bloqueantes de pantalla completa.

### `SessionHeader`

Header para la pantalla de sesión activa de entrenamiento. Muestra progreso y tiempo.

### `ClockCircle`

Reloj circular animado para fases de descanso/countdown en sesiones de entrenamiento.

---

## Features — `src/components/features/`

### Rutina — `src/components/features/routine/`

| Componente | Descripción |
|------------|-------------|
| `RoutineListCard` | Card en lista de rutinas (modo browse) |
| `RoutinePreviewCard` | Card de preview al seleccionar una rutina |
| `RoutineDetailModal` | Modal de detalle de rutina con ejercicios |
| `CreateRoutineView` | Formulario completo de creación/edición de rutina |
| `ExerciseDetailView` | Vista de detalle de un ejercicio con gif |
| `AddExerciseSheet` | Sheet para agregar ejercicios a un día |
| `SwapCandidateModal` | Modal de candidatos para reemplazar un ejercicio |
| `AdaptRoutineModal` | Modal para adaptar rutina con IA |

### Nutrición — `src/components/features/nutrition/`

| Componente | Descripción |
|------------|-------------|
| `MealSummaryCard` | Card de resumen de una comida del día |
| `ConsumedFoodCard` | Card de alimento consumido en una comida |
| `FoodRegisterView` | Vista completa de registro de alimentos |

### Historial — `src/components/features/training-history/`

| Componente | Descripción |
|------------|-------------|
| `TrainingHistoryListCard` | Card en lista del historial de sesiones |
| `TrainingHistoryPreviewCard` | Card de preview de una sesión |
| `SwipeableTrainingHistoryCard` | Card swipeable con acción de eliminar |

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
