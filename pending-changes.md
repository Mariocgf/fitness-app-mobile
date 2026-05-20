# Cambios pendientes — Alineación con agent.md

Referencia: `agent.md` §7 UI Guidelines: *"Sugiere EXCLUSIVAMENTE el uso de NativeWind / Tailwind clases de utilidad (`className`) para los estilos en línea. Evita `StyleSheet.create` a menos que sea estrictamente indispensable."*

---

## Criterios de clasificación

- **A** — `style` con valores fijos → migrable a `className` directamente
- **B** — `style` con valores runtime (`insets`, `Platform.OS`, animaciones) → **no migrable**, justificado
- **C** — `StyleSheet.create` con valores estáticos → migrable a `className`
- **D** — `useColorScheme`/`useThemeColor` para theming que puede resolverse con `className dark:` → migrable
- **E** — Archivos Expo starter en `common/` que no pertenecen al dominio del proyecto

---

## src/components/common

### `SwipeBackWrapper.tsx`
- **[C]** `StyleSheet.create({ container: { flex: 1 } })` → reemplazar con `className="flex-1"` en la `View` raíz y eliminar el `StyleSheet`.

### `themed-text.tsx`
- **[C]** `StyleSheet.create` con estilos de texto (`fontSize`, `lineHeight`, `fontWeight`) → migrar a `className` de Tailwind por cada variante (`type`).
- **[D]** `useThemeColor` para el color del texto → reemplazar con variantes `dark:` en `className`.
- **Nota:** Componente Expo starter; evaluar si se sigue usando o se elimina en favor de `Text` directo con `className`.

### `themed-view.tsx`
- **[D]** `useThemeColor` para `backgroundColor` → si se usa solo como wrapper de fondo, reemplazar con `className` y variantes `dark:`. Si no se usa en el proyecto, eliminar.

### `parallax-scroll-view.tsx`
- **[E]** Archivo Expo starter sin uso en el proyecto productivo. Candidato a eliminar.
- **[C]** `StyleSheet.create` con `container`, `header`, `content` → si se decide mantener, migrar a `className`.
- **[D]** `useColorScheme` + `useThemeColor` → migrar a `className dark:`.

### `hello-wave.tsx`
- **[E]** Archivo Expo starter sin uso en el proyecto productivo. Candidato a eliminar.

### `external-link.tsx`
- **[E]** Archivo Expo starter. Verificar si tiene uso real; si no, eliminar.

### `haptic-tab.tsx`
- **[E]** Archivo Expo starter. Verificar si tiene uso real; si no, eliminar.

### `ui/collapsible.tsx`
- `color=""` en `IconSymbol` es un workaround — la prop es requerida por la API del componente. Aceptable hasta que `IconSymbol` se refactorice o se reemplace.

### `RulerPicker.tsx`, `SearchableSelect.tsx`, `TagSelect.tsx`, `EquipmentSelect.tsx`
- **[D]** `useColorScheme`/`isDark` se mantiene **justificado** únicamente para `placeholderTextColor` y tick colors calculados en `useMemo`. El resto ya fue migrado. No requieren acción adicional.

---

## src/components/features/onboarding

### `BasicInfoStep1.tsx`
- **[D]** `useColorScheme` → usado para `DateTimePicker.textColor` (prop nativa) y `Picker.style` (prop nativa de Android). **Justificado**, no migrable a `className`.
- **[A]** `style={{ height: SCREEN_HEIGHT * 0.18 }}` → valor computado en runtime, **no migrable**.
- **[A]** `style={{ height: Platform.OS === 'ios' ? ... : 56 }}` → condicional de plataforma en runtime, **no migrable**.
- **[B]** `contentContainerStyle={{ flexGrow: 1 }}` en `ScrollView` → **no migrable** (`contentContainerStyle` no acepta `className`).

### `BasicInfoStep2.tsx` / `BasicInfoStep3.tsx`
- **[B]** `contentContainerStyle={{ flexGrow: 1 }}` → no migrable.

### `FitnessConfigStep.tsx`
- **[B]** Múltiples `contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingTop: 32, paddingBottom: 16 }}` → no migrable (`contentContainerStyle`).
- **[A]** `style={{ flex: 1 }}` en `Pressable` → migrar a `className="flex-1"`.

### `HealthConfigStep.tsx`
- **[B]** `contentContainerStyle` → no migrable.
- **[A]** `style={{ flex: 1 }}` en `Pressable` → migrar a `className="flex-1"`.

### `NutritionAllergyStep.tsx` / `NutritionDietStyleStep.tsx`
- **[B]** `contentContainerStyle` → no migrable.
- **[A]** `style={{ flex: 1 }}` en `Pressable` → migrar a `className="flex-1"`.

### `NutritionSubGoalStep.tsx`
- **[B]** `contentContainerStyle` → no migrable.

### `ModuleSelectionStep.tsx`
- **[B]** `contentContainerStyle={{ flexGrow: 1 }}` → no migrable.
- **[A]** `style={{ height: 100 }}` en `TouchableOpacity` → migrar a `className="h-[100px]"`.
- **[A]** `style={{ position: 'absolute', width: '100%', height: '100%' }}` en `Image` y `LinearGradient` → migrar a `className="absolute w-full h-full"`.

### `PrivacyTermsStep.tsx`
- **[B]** `contentContainerStyle` → no migrable.
- **[B]** `style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}` en `Switch` → no migrable (transform es prop nativa del componente).
- **[B]** `style={{ marginBottom: Math.max(insets.bottom, 20) }}` → valor runtime, no migrable.

---

## src/components/features/profile

### `SectionHeader.tsx`
- **[B]** `style={{ paddingTop: insets.top + 8 }}` → valor runtime, no migrable.

### `ProfileHeader.tsx`
- **[B]** `style={{ paddingTop: insets.top + 20 }}` → runtime.
- **[B]** `style={{ top: insets.top + 10, shadowColor, shadowOffset... }}` → runtime + sombras, no migrable.
- **[B]** `style={{ shadowColor, shadowOffset... }}` en card → sombras deben quedar inline.

### `ProfileMenuPanel.tsx`
- **[B]** `contentContainerStyle` con `insets.bottom` → runtime, no migrable.

### `NutritionSettingsView.tsx` / `FitnessSettingsView.tsx` / `HealthSettingsView.tsx`
- **[B]** `contentContainerStyle` con `insets.bottom` → runtime, no migrable.

### `InjuriesConfig.tsx`
- **[A]** `style={{ flex: 1 }}` en `Pressable` raíz → migrar a `className="flex-1"`.
- **[B]** `contentContainerStyle` con `insets.bottom` → runtime, no migrable.

### `EquipmentConfig.tsx`
- Verificar los 6 matches — probable combinación de `contentContainerStyle` (no migrable) y `style={{ flex: 1 }}` en `Pressable` (migrable).

### `DataManagement.tsx`
- Verificar el match — probable `contentContainerStyle`.

---

## src/components/features/routine

### `RoutineDetailView.tsx`
- **[B]** `style={{ paddingTop: insets.top + 12 }}` → runtime.
- **[B]** `contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, gap: 10 }}` → no migrable.
- **[B]** `style={{ paddingBottom: BOTTOM_BAR_HEIGHT + 80 }}` → valor computado.
- **[B]** `style={{ paddingBottom: insets.bottom + ... }}` → runtime.
- **[B]** `style={{ bottom: insets.bottom + 8 }}` → runtime.
- **[A]** `style={{ opacity: ... }}` condicional → migrable con `className` usando `opacity-[0.45]` + condición ternaria, o mantener inline si la lógica es compleja.
- **[B]** `style={{ bottom: insets.bottom + 76, shadowColor... }}` → runtime + sombras.

### `RoutineDetailModal.tsx`
- **[A]** `style={{ flex: 1 }}` en `GestureHandlerRootView` → migrar a `className="flex-1"`.
- **[B]** `contentContainerStyle={{ gap: 12 }}` → no migrable.

### `SwapCandidateModal.tsx`
- **[B]** `style={{ paddingBottom: insets.bottom + 16, maxHeight: '85%' }}` → runtime + valor de layout.

### `ExerciseDetailView.tsx`
- **[B]** `style={{ paddingTop: insets.top + 12 }}` → runtime.
- **[B]** `contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}` → runtime.

### `session/ActiveSessionView.tsx`
- **[D]** `useColorScheme` → revisar qué lo usa; si solo afecta `className`, eliminar.
- **[B]** `style={{ paddingTop: insets.top, overflow: 'hidden' }}` → `overflow: hidden` migrable a `className="overflow-hidden"`, `paddingTop` runtime.
- **[A]** `style={{ overflow: 'hidden' }}` en `View` interna → migrar a `className="overflow-hidden"`.

### `session/RpeSection.tsx`
- **[D]** `useColorScheme`/`isDark` → revisar qué colores aplica; si son todos migrables a `className dark:`, eliminar el hook.

### `session/ExerciseGif.tsx`
- **[A]** `style={{ width: '100%', height: '100%', borderRadius: 24 }}` en `Image` de `expo-image` → migrar a `className="w-full h-full rounded-[24px]"`.

### `session/SummaryPhase.tsx`
- **[B]** `style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }}` → runtime.

---

## Resumen de acciones concretas

| Prioridad | Acción | Archivos |
|---|---|---|
| Alta | Eliminar archivos Expo starter sin uso | `hello-wave.tsx`, `parallax-scroll-view.tsx`, `external-link.tsx`, `haptic-tab.tsx` |
| Alta | Migrar `style={{ flex: 1 }}` en `Pressable` a `className="flex-1"` | `FitnessConfigStep`, `HealthConfigStep`, `NutritionAllergyStep`, `NutritionDietStyleStep`, `InjuriesConfig`, `RoutineDetailModal` |
| Alta | Migrar `style={{ overflow: 'hidden' }}` a `className` | `ActiveSessionView` |
| Alta | Migrar `ExerciseGif` `style` a `className` | `session/ExerciseGif.tsx` |
| Alta | Migrar `ModuleSelectionStep` `style` fijos a `className` | `height: 100`, `absolute w-full h-full` |
| Media | Migrar `SwipeBackWrapper` `StyleSheet` a `className` | `SwipeBackWrapper.tsx` |
| Media | Evaluar y migrar `themed-text` / `themed-view` | Ambos archivos |
| Media | Revisar `useColorScheme` en `ActiveSessionView` y `RpeSection` | Ambos archivos |
| Baja | Verificar `EquipmentConfig`, `DataManagement` | Ambos archivos |

---

## Optimización de código — Separación y modularización

Criterio: archivos >200 líneas con múltiples responsabilidades (sub-componentes inline, lógica de negocio mezclada con UI, múltiples sub-vistas dentro del mismo archivo).

---

### 🔴 Crítico — >500 líneas

#### `src/components/features/routine/RoutineDetailView.tsx` — 945 líneas
El archivo más grande del proyecto. Contiene al menos **5 responsabilidades distintas**:

| Bloque actual | Líneas aprox. | Extracción sugerida |
|---|---|---|
| `SkeletonItem` (componente inline) | ~25 | `src/components/common/SkeletonItem.tsx` |
| `getDayWeight` (función utilitaria) | ~10 | `src/utils/format.utils.ts` (ya existe) |
| `SwapAwareExerciseItem` (componente complejo) | ~160 | `src/components/features/routine/SwapAwareExerciseItem.tsx` |
| `ConfirmSuggestionsModal` (modal completo) | ~60 | `src/components/features/routine/ConfirmSuggestionsModal.tsx` |
| `BlockingWarningModal` (modal completo) | ~35 | `src/components/features/routine/BlockingWarningModal.tsx` |
| Lógica swap (fetch + confirm + estado) | ~80 | `src/hooks/useSwapSuggestions.ts` |
| `RoutineDetailView` (orquestador) | ~350 | Se simplifica a ~200 líneas al extraer lo anterior |

#### `src/components/common/MyTabBar.tsx` — 519 líneas
Contiene **3 responsabilidades**:

| Bloque actual | Líneas aprox. | Extracción sugerida |
|---|---|---|
| `TabItem` (sub-componente) | ~40 | Mantener en el mismo archivo (es pequeño y acoplado) |
| `FabMenuItem` (sub-componente) | ~55 | `src/components/common/FabMenuItem.tsx` |
| Lógica de animación del FAB (shared values, animated styles, handlers) | ~80 | `src/hooks/useFabMenu.ts` |
| Lógica de `getThemeColors` + `getMenuOptions` | ~80 | `src/utils/tabbar.utils.ts` |
| `MyTabBar` orquestador | ~264 | Se simplifica a ~150 líneas |

#### `src/components/features/onboarding/FitnessConfigStep.tsx` — 591 líneas
Maneja **4 sub-pasos como ramas de un mismo componente**:

| Bloque actual | Líneas aprox. | Extracción sugerida |
|---|---|---|
| SubStep 0: Objetivos fitness | ~80 | `src/components/features/onboarding/fitness/FitnessGoalStep.tsx` |
| SubStep 1: Disponibilidad + duración | ~90 | `src/components/features/onboarding/fitness/FitnessScheduleStep.tsx` |
| SubStep 2: Entorno + equipamiento | ~100 | `src/components/features/onboarding/fitness/FitnessEquipmentStep.tsx` |
| SubStep 3: Nivel de experiencia | ~90 | `src/components/features/onboarding/fitness/FitnessLevelStep.tsx` |
| Lógica de submit + API calls | ~60 | `src/hooks/useFitnessOnboarding.ts` |
| `FitnessConfigStep` (router de sub-pasos) | ~80 | Se simplifica a ~80 líneas |

---

### 🟡 Importante — 200–500 líneas con múltiples responsabilidades

#### `app/onboarding.tsx` — 502 líneas
Es una **pantalla (app/)** que acumula todo el estado del onboarding y orquesta 8+ componentes step. Según `agent.md §3`, `app/` debe ser "contenedores ligeros".

- **Problema**: manejo de estado complejo (básica info, módulos, goals, step actual, subStep) + lógica de persistencia en AsyncStorage + múltiples `useEffect` de inicialización.
- **Extracción sugerida**: `src/hooks/useOnboardingFlow.ts` — concentra todo el estado, handlers y side effects. La pantalla queda como orquestador puro de ~80 líneas.

#### `src/components/features/profile/InjuriesConfig.tsx` — 284 líneas
Mezcla UI de lista + lógica de fetch/save/delete de lesiones.
- **Extracción sugerida**: `src/hooks/useInjuriesConfig.ts` con el estado, fetch, save y delete.

#### `src/components/features/profile/EquipmentConfig.tsx` — 303 líneas
Misma situación que `InjuriesConfig`.
- **Extracción sugerida**: `src/hooks/useEquipmentConfig.ts`.

#### `src/components/features/onboarding/HealthConfigStep.tsx` — 209 líneas
Tiene 2 sub-pasos y lógica de API mezclada con UI.
- **Extracción sugerida**: `src/hooks/useHealthOnboarding.ts` para separar la lógica del step.

#### `src/components/features/routine/session/ActiveSessionView.tsx`
Delega al hook `useActiveSession` (bien hecho), pero contiene sub-vistas inline de la sesión activa.
- Verificar si `ExercisePhase` y `RestPhase` ya están extraídos; si no, separarlos.

---

### 🟢 Aceptable — Sin acción inmediata

Los siguientes archivos tienen entre 150–280 líneas y **una sola responsabilidad clara**. No requieren splitting:

- `SearchableSelect.tsx` (280 líneas) — un componente con lógica dropdown acoplada, aceptable
- `EquipmentSelect.tsx` (275 líneas) — ídem
- `TagSelect.tsx` (244 líneas) — ídem
- `SessionSlider.tsx` (164 líneas) — ok
- `BasicInfoStep1.tsx` — tiene picker nativo que requiere código condicional por plataforma, aceptable
- `RoutineDetailModal.tsx`, `SwapCandidateModal.tsx` — modales con responsabilidad única

---

### Resumen de nuevas acciones por prioridad

| Prioridad | Acción | Archivo origen | Destino |
|---|---|---|---|
| 🔴 Alta | Extraer `SwapAwareExerciseItem`, `ConfirmSuggestionsModal`, `BlockingWarningModal` | `RoutineDetailView.tsx` | Archivos separados en `features/routine/` |
| 🔴 Alta | Extraer lógica swap a hook | `RoutineDetailView.tsx` | `src/hooks/useSwapSuggestions.ts` |
| 🔴 Alta | Extraer lógica de animación FAB y colores del tab bar | `MyTabBar.tsx` | `src/hooks/useFabMenu.ts` + `src/utils/tabbar.utils.ts` |
| 🔴 Alta | Mover estado+handlers del onboarding a hook | `app/onboarding.tsx` | `src/hooks/useOnboardingFlow.ts` |
| 🟡 Media | Dividir `FitnessConfigStep` en sub-pasos | `FitnessConfigStep.tsx` | `src/components/features/onboarding/fitness/` |
| 🟡 Media | Extraer lógica de `InjuriesConfig` y `EquipmentConfig` a hooks | Ambos | `src/hooks/` |
| 🟡 Media | Extraer `SkeletonItem` a `common/` | `RoutineDetailView.tsx` | `src/components/common/SkeletonItem.tsx` |
| 🟡 Media | Extraer `FabMenuItem` a `common/` | `MyTabBar.tsx` | `src/components/common/FabMenuItem.tsx` |

---

## Reutilización de código — Componentes duplicados

### 🔴 Duplicación exacta — acción inmediata

#### `SubMenuItem` — copiado en 3 archivos, componente ya existe y no se usa

`SubMenuItem` está definido **inline e idéntico** en:
- `FitnessSettingsView.tsx` (líneas 26–40)
- `HealthSettingsView.tsx` (líneas 25–39)
- `NutritionSettingsView.tsx` (líneas 24–38)

Además existe `src/components/features/profile/ConfigMenuItem.tsx` — componente ya creado con la misma responsabilidad, **pero no se está usando**.

**Acción**: eliminar las 3 definiciones inline de `SubMenuItem` y reemplazar con `ConfigMenuItem` (ajustando el estilo si hay diferencia visual menor entre ambos). Si el estilo difiere intencionalmente, actualizar `ConfigMenuItem` para aceptar una variante via prop.

#### `MenuItem` en `ProfileMenuPanel.tsx`

`ProfileMenuPanel` también define su propio `MenuItem` local (línea 52) con estructura casi idéntica a `ConfigMenuItem`. Mismo caso.

**Acción**: reemplazar `MenuItem` local por `ConfigMenuItem`.

---

### 🟡 Patrón repetido — extraer wrapper/layout

#### Layout del onboarding — repetido en 9 archivos

Todos los steps de onboarding (`BasicInfoStep1–3`, `FitnessConfigStep`, `HealthConfigStep`, `NutritionAllergyStep`, `NutritionDietStyleStep`, `NutritionSubGoalStep`, `ModuleSelectionStep`) tienen esta misma estructura de contenedor:

```tsx
<View className="flex-1 bg-slate-100 dark:bg-slate-950">
  <ProgressBar currentStep={N} totalSteps={M} />
  <ScrollView contentContainerStyle={{ flexGrow: 1, ... }}>
    <OnboardingHeader ... />
    {/* contenido del step */}
  </ScrollView>
  <OnboardingFooter ... />
</View>
```

**Acción**: crear `src/components/features/onboarding/OnboardingStepLayout.tsx` con props `currentStep`, `totalSteps`, `header`, `footer`, `children`. Cada step pasa solo su contenido.

---

### 🟡 Patrón repetido — `cssInterop(Ionicons, ...)` en 30 archivos

El bloque:
```tsx
import { cssInterop } from 'nativewind';
cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});
```
aparece **30 veces** en el proyecto (uno por archivo que usa `Ionicons`).

`cssInterop` es idempotente — llamarlo múltiples veces con la misma config no causa errores, pero es ruido. 

**Acción**: mover la llamada a `cssInterop` a un único lugar de inicialización global (ej. `src/utils/icon-interop.ts` o directamente en `app/_layout.tsx`), importar ese módulo una sola vez desde `_layout.tsx`, y eliminar las 30 llamadas locales.

```ts
// src/utils/icon-interop.ts
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});
cssInterop(MaterialCommunityIcons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});
```

---

### Resumen de nuevas acciones por prioridad

| Prioridad | Acción | Archivos afectados |
|---|---|---|
| 🔴 Alta | Usar `ConfigMenuItem` en lugar de `SubMenuItem` inline | `FitnessSettingsView`, `HealthSettingsView`, `NutritionSettingsView`, `ProfileMenuPanel` |
| 🔴 Alta | Centralizar `cssInterop(Ionicons)` en `icon-interop.ts` | 30 archivos |
| 🟡 Media | Crear `OnboardingStepLayout` y usarlo en todos los steps | 9 archivos de onboarding |

---

## Análisis de `app/` — alineación con agent.md

### `app/_layout.tsx` — 247 líneas ✅ / ⚠️

**Bien:**
- Es el entry point correcto para configurar providers globales.
- `tokenCache`, `hideSplash`, `RootNavigator` están bien separados dentro del mismo archivo.
- Ya migrado `GestureHandlerRootView style={{ flex: 1 }}` → `className`.

**A mejorar:**
- **[agent.md §3]** `RootNavigator` contiene lógica de negocio pesada: polling de metadata de Clerk, guards de navegación, y múltiples `useEffect` encadenados (~140 líneas). Según el principio de "contenedores ligeros", esto debería extraerse a `src/hooks/useAuthGuard.ts`.
- `tokenCache` (líneas 42–60) es infraestructura de auth, candidato a `src/utils/token-cache.ts` o `src/api/token-cache.ts`.
- **[Naming]** `hideSplash`, `isSplashScreenHidden` están en inglés ✅. Comentarios en español ✅.

**Extracción sugerida:**
```
src/hooks/useAuthGuard.ts   ← lógica de navegación + polling de metadata
src/utils/token-cache.ts    ← tokenCache object
```

---

### `app/(tabs)/_layout.tsx` — 60 líneas ✅

Perfecto. Contenedor ligero puro: monta providers (`RoutineDetailProvider`), configura `Tabs` y delega el tab bar a `MyTabBar`. Sin lógica de negocio. No requiere cambios.

---

### `app/login.tsx` — 111 líneas ✅ / ⚠️

**Bien:**
- Pantalla ligera, delega auth a hooks de Clerk.
- Manejo de errores con `try/catch` ✅.

**A mejorar:**
- **[agent.md §7]** `useColorScheme` usado solo para el ícono de Apple (`isDark ? AppleLightIcon : AppleDarkIcon`). Este es un caso legítimo de prop nativa de SVG — **justificado**, no migrable a `className`.
- `SCREEN_WIDTH` de `Dimensions` importado pero **no se usa** en el JSX actual. Limpiar import.
- `style={{ paddingLeft: 110, paddingTop: 100 }}` y `style={{ paddingRight: 80 }}` — valores de posicionamiento decorativo de los círculos. No migrables a `className` (valores arbitrarios específicos de diseño). Aceptable.

---

### `app/onboarding.tsx` — 502 líneas 🔴

**Problema principal — viola agent.md §3** ("contenedores ligeros"):

La pantalla acumula:
- 12 estados locales
- 1 `useMemo`
- 4 `useEffect` con lógica async compleja (polling de estado, carga de goals, carga de módulos, advance de draft)
- 5 handlers con llamadas directas a servicios (`acceptTerms`, `setBasicInfo`, `setSelectedModules`, `getActiveModules`, etc.)
- `sortModules` utility function inline

**Extracción sugerida:**

| Bloque | Destino |
|---|---|
| `sortModules` | `src/utils/onboarding.utils.ts` |
| Todo el estado + `useEffect` de inicialización + handlers | `src/hooks/useOnboardingFlow.ts` |
| La pantalla queda | ~60 líneas: monta `SafeAreaView` + renderiza el step activo |

**Nota importante**: ya existen `useOnboardingStorage` y `useModuleConfigStorage` — la extracción de lógica a hooks es un patrón ya establecido en el proyecto. `useOnboardingFlow` sería el siguiente paso natural.

---

### `app/profile.tsx` — 228 líneas ⚠️

**Bien:**
- Delega UI a `ProfileHeader` y `ProfileMenuPanel` ✅.

**A mejorar:**
- **[agent.md §3]** Contiene lógica de animación (`Animated.Value`, `panelHeight`, `avatarOpacity`) y lógica de logout con limpieza de AsyncStorage directamente en el componente. Candidato a `src/hooks/useProfileScreen.ts`.
- `Dimensions` importado — verificar si se usa realmente.
- `useColorScheme` no aparece en el archivo (ya fue limpiado ✅).

---

### `app/session.tsx` — 65 líneas ✅

Perfecto. Pantalla ligera: parsea params, monta `useMutation` de react-query, delega toda la UI a `ActiveSessionView`. Es exactamente lo que `agent.md §3` describe como "contenedor ligero". No requiere cambios.

---

### `app/(tabs)/index.tsx` — 204 líneas ⚠️

**A mejorar:**
- Handlers como `handleGenerate`, `handleRegenerate`, `handleRoutineUpdated` realizan llamadas directas a servicios. Candidato a `src/hooks/useHomeScreen.ts` para centralizar el estado de rutina, los handlers y la lógica de caché de AsyncStorage.
- La pantalla quedaría en ~60 líneas solo con el JSX.

---

### `app/(tabs)/explore.tsx` — Expo starter 🗑️

Tab oculto (`href: null` en `_layout.tsx`). Contiene `StyleSheet.create`, `HelloWave`, `ParallaxScrollView` — todos componentes Expo starter sin uso productivo. **Candidato a eliminar** junto con los componentes starter asociados.

---

### Resumen `app/`

| Archivo | Estado | Acción |
|---|---|---|
| `_layout.tsx` | ⚠️ | Extraer `useAuthGuard` + `token-cache.ts` |
| `(tabs)/_layout.tsx` | ✅ | Sin cambios |
| `login.tsx` | ⚠️ | Limpiar import `SCREEN_WIDTH` sin uso |
| `onboarding.tsx` | 🔴 | Extraer `useOnboardingFlow` — viola §3 |
| `profile.tsx` | ⚠️ | Extraer `useProfileScreen` |
| `session.tsx` | ✅ | Sin cambios |
| `(tabs)/index.tsx` | ⚠️ | Extraer `useHomeScreen` |
| `(tabs)/explore.tsx` | 🗑️ | Eliminar (Expo starter sin uso) |
| `(tabs)/fitness/health/nutrition.tsx` | ✅ | Ya migrados |
