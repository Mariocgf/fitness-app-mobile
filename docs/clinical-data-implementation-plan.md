# Plan de implementación — Módulo Datos Clínicos (Frontend)

> Planificación por fases para las 3 vistas nuevas del módulo clínico dentro del tab **Salud**.
> Fuente de verdad del contrato: [`clinical-data-frontend-guide.md`](./clinical-data-frontend-guide.md).
> Reglas de arquitectura: [`../agent.md`](../agent.md). Errores a evitar: [`agent-implementation-lessons.md`](./agent-implementation-lessons.md).
>
> **Regla de oro (lecciones):** NO codificar por imagen ni intuición. El contrato manda. Si la maqueta pide un dato que la guía no tiene → no se implementa.

---

## 0. Decisiones tomadas (no re-discutir)

| Tema | Decisión | Por qué |
|---|---|---|
| **Layout dashboard** | **Bloque clínico agrupado arriba**: Perfil clínico → Registrar lectura → Lecturas clínicas, luego un divisor y todo lo de medidas corporales (existente). | Elección del usuario. Separa los dos dominios (clínico vs. corporal). |
| **Color del módulo** | **rose-400** (`#fb7185`), NO el azul de las maquetas. | Salud = rose en `colors.md`. Lección recurrente "maqueta azul → acento del módulo". |
| **Tema** | dark-only `zinc` (color directo, sin prefijos `dark:`). | La app fuerza dark (`userInterfaceStyle: dark`). |
| **Enums** | Se serializan como **números**. `bloodType`: A=0, B=1, AB=2, O=3. `rhFactor`: +=0, −=1. `null` = no informado. | Guía §4. El front manda/lee números y mapea a labels. |
| **Date picker** | Reusar `@react-native-community/datetimepicker` (ya es dependencia, usado en `BasicInfoStep1`). | Sin sumar dependencias nativas. |
| **Detalle de lectura** | **Diferido.** El historial (vista 3) ya muestra todos los valores no-null de cada lectura → un detalle `GET /readings/{id}` aporta poco. Se implementa solo si el usuario lo pide. | Lección "no construir lo que no tiene necesidad clara". |
| **Cotejo imágenes vs guía** | Las 3 maquetas NO piden ningún campo fuera de la guía. Todo mapea. | Verificado. |

---

## 1. Contrato (resumen operativo)

Base path: `api/clinical` (case-insensitive). Todos los endpoints requieren **JWT Bearer** (Clerk); el front NO manda userId.

### Perfil clínico
- `GET /api/clinical/profile` → `ClinicalProfileDto`. Nunca falla; usuario nuevo devuelve defaults.
- `PUT /api/clinical/profile` → actualiza `bloodType`, `rhFactor`, `hasGlucose`, `hasDyslipidemia`. **NO toca `allowAiUsage`.**
- `PUT /api/clinical/ai-consent` → body `{ enabled: boolean }`. Solo mueve `allowAiUsage`.

### Lecturas clínicas
- `POST /api/clinical/readings` → crea una lectura. `date` opcional (`YYYY-MM-DD`, default hoy). Todos los `*MgDl` opcionales y **> 0** (un `0`/negativo da `400`).
- `GET /api/clinical/readings?page&pageSize` → historial paginado, más reciente primero (por `capturedAt`).
- `GET /api/clinical/readings/{id}` → detalle (diferido, ver §0).

### Errores
`400` valor ≤ 0 · `401` token inválido · `404` usuario/lectura inexistente. Formato `{ statusCode, message, timestamp }` → mostrar `message` amigable en español.

---

## 2. Mapeo maqueta → contrato

### Vista 1 — "Datos clínicos" (perfil)
| Maqueta | Campo | Endpoint |
|---|---|---|
| Grupo sanguíneo A/B/AB/O | `bloodType` (0/1/2/3) | `PUT /profile` |
| Rh +/− | `rhFactor` (0/1) | `PUT /profile` |
| Switch "Monitoreo glucosa" | `hasGlucose` | `PUT /profile` |
| Switch "Lípidos / colesterol alto" | `hasDyslipidemia` | `PUT /profile` |
| Switch "Permitir que la IA use mis datos" + indicador | `allowAiUsage` | `PUT /ai-consent` |
| Botón "Guardar cambios" | dispara `PUT /profile` | |

> **Importante:** el toggle de IA persiste con `PUT /ai-consent` **al cambiarlo** (independiente de "Guardar cambios", que es solo para los campos de perfil). El indicador de estado sale de `allowAiUsage`.
> **Nota honesta (guía §2):** el toggle de IA persiste y refleja estado, pero **todavía no tiene efecto funcional** (fase futura). Se construye igual.

### Vista 2 — "Registrar lectura"
| Maqueta | Campo |
|---|---|
| Fecha (default hoy, editable) | `date` (`YYYY-MM-DD`, opcional) |
| Glucosa | `glucoseMgDl` |
| Colesterol total | `totalCholesterolMgDl` |
| HDL | `hdlMgDl` |
| LDL | `ldlMgDl` |
| Triglicéridos | `triglyceridesMgDl` |
| Botón "Guardar lectura" | `POST /readings` |

> Todos los valores opcionales; se manda solo lo cargado. Validar **> 0** en cliente antes del POST (evita el `400`). Nota "podés dejar campos vacíos".

### Vista 3 — "Lecturas clínicas"
- Card "Registrar lectura" (reusable, → vista 2).
- "Historial": lista paginada de lecturas; cada card muestra fecha + hora (`capturedAt`) y **solo los valores no-null** (degradación honesta, igual que la maqueta: la lectura del 18 jun muestra solo Glucosa+LDL).

---

## 3. Arquitectura — archivos nuevos

Sigue la estructura de `agent.md §3` y **espeja** los patrones ya existentes del módulo Salud.

```
src/types/clinical.ts                         (NUEVO)  DTOs, payloads, enum maps + labels
src/services/clinical.service.ts              (NUEVO)  6 funciones, defensa { data }
src/hooks/useClinicalProfile.ts               (NUEVO)  load / updateProfile / setAiConsent
src/hooks/useClinicalReadings.ts              (NUEVO)  submit + historial paginado (loadMore)

src/components/features/health/clinical/      (NUEVO subfolder, agrupa lo clínico)
  ├─ ClinicalProfileCard.tsx                  card dashboard → vista 1
  ├─ ClinicalDataView.tsx                     vista 1 (perfil)
  ├─ RegisterReadingCard.tsx                  card REUSABLE (dashboard + top de vista 3) → vista 2
  ├─ ClinicalReadingFormView.tsx              vista 2 (registrar lectura)
  ├─ ClinicalReadingsEntryCard.tsx            card dashboard → vista 3
  ├─ ClinicalReadingHistoryCard.tsx           fila de lectura (valores no-null)
  └─ ClinicalReadingsView.tsx                 vista 3 (lecturas + historial)

app/(tabs)/health/clinical.tsx                (NUEVO)  ruta vista 1
app/(tabs)/health/clinical-reading-new.tsx    (NUEVO)  ruta vista 2
app/(tabs)/health/clinical-readings.tsx       (NUEVO)  ruta vista 3
app/(tabs)/health/_layout.tsx                 (EDIT)   registrar las 3 rutas en el Stack
src/components/features/health/HealthDashboard.tsx  (EDIT)  insertar el bloque clínico arriba
```

### Reutilización / extensión de átomos (agent.md §8 — obligatorio)
- **`SegmentedControl`** → grupo sanguíneo (4 opciones) y Rh (2 opciones). **Extender** con `accent='rose'` (hoy solo soporta lime/amber/mono). Con `value=null` ningún segmento queda activo = estado "no informado" gratis (lección del género, #151). Traducir el borde azul de la maqueta a rose-400. **No forkear.**
- **`Switch` nativo de RN** → los 3 toggles (no hay átomo `Switch` en `common/`). Estilo como `PrivacyTermsStep` (track activo rose, thumb blanco). La fila "label + switch + divisor" va como **subcomponente local** de `ClinicalDataView` (igual que `MeasurementRow` vive local en `BodyMeasurementFormView`).
- **`IconTile`** → tile de "+" de `RegisterReadingCard`, ícono de `ClinicalReadingsEntryCard`, calendario del historial y candado de "Uso por IA" (`color="#fb7185"`).
- **Patrón de form** → `ClinicalReadingFormView` espeja `BodyMeasurementFormView` (card con filas, validación `> 0`, CTA con offset `TAB_BAR_HEIGHT + insets.bottom`).
- **Patrón de service/hook** → `clinical.service.ts` espeja `health.service.ts` (token en headers, defensa `{ data }`); hooks usan `getTokenRef` estable y `autoLoad` (lecciones de loops de requests #23/#24/#27).
- **Navegación** → `router.push('/health/clinical' as any)` con cast `as any`, igual que las rutas de Salud existentes (evita el lío de typed-routes, lección #113).

---

## 4. Fases

> Cada fase es un incremento entregable y testeable por separado. Al cerrar cada fase: correr lint + tsc y registrar lecciones nuevas en `agent-implementation-lessons.md` si surgen.

### Fase 0 — Capa de datos (sin UI)
**Objetivo:** types + service + hooks listos, sin tocar pantallas.

1. `src/types/clinical.ts`:
   - `ClinicalProfileDto`, `ClinicalProfilePayload` (sin `allowAiUsage`), `AiConsentPayload`.
   - `ClinicalReadingDto`, `ClinicalReadingPayload`, `PagedClinicalReadingsResponseDto`.
   - Maps de enum: `BLOOD_TYPE_LABELS` (`{0:'A',1:'B',2:'AB',3:'O'}`), `RH_LABELS` (`{0:'+',1:'−'}`) + opciones para el `SegmentedControl`.
2. `src/services/clinical.service.ts`: las 6 funciones con defensa `{ data }`.
3. `src/hooks/useClinicalProfile.ts` y `src/hooks/useClinicalReadings.ts`.
4. (Opcional) `clinical.service.test.ts` espejando `health.service.test.ts`.

**Salida:** data layer compilando, cero cambios visibles.

### Fase 1 — Perfil clínico (vista 1)
**Objetivo:** configurar y mostrar el perfil clínico.

1. **Extender `SegmentedControl`** con `accent='rose'`.
2. `ClinicalDataView.tsx`: selector grupo sanguíneo + Rh, 3 switches, sección "Uso por IA" (candado + indicador de estado + toggle), CTA "Guardar cambios" (`PUT /profile`). El toggle de IA persiste con `PUT /ai-consent` al cambiar.
3. `ClinicalProfileCard.tsx`: card del dashboard. Estado vacío (CTA "Configurar perfil clínico") vs. con datos (resumen: grupo+Rh, condiciones activas, estado IA). Espeja `LastMeasurementCard`.
4. `app/(tabs)/health/clinical.tsx` (pantalla contenedora ligera, orquesta `useClinicalProfile`).
5. Editar `_layout.tsx` (registrar `clinical`) y `HealthDashboard` (1ª card del bloque clínico).
6. Documentar `ClinicalProfileCard`/`ClinicalDataView` + el `accent='rose'` en `component-library.md`.

### Fase 2 — Registrar lectura (vista 2)
**Objetivo:** registrar una lectura clínica.

1. `RegisterReadingCard.tsx` (REUSABLE): tile "+", título "Registrar lectura", subtítulo, link "Nueva lectura →". → vista 2.
2. `ClinicalReadingFormView.tsx`: card de Fecha (con `datetimepicker`, default hoy) + card "Valores clínicos" (5 filas Glucosa/Colesterol/HDL/LDL/Triglicéridos, `decimal-pad`, validación `> 0`) + nota "podés dejar campos vacíos" + CTA "Guardar lectura" (`POST /readings`). Espeja `BodyMeasurementFormView`.
3. `app/(tabs)/health/clinical-reading-new.tsx` (orquesta `useClinicalReadings.submit`, vuelve atrás al guardar).
4. Editar `_layout.tsx` y `HealthDashboard` (2ª card del bloque, usa `RegisterReadingCard`).
5. Documentar en `component-library.md`.

### Fase 3 — Lecturas clínicas / historial (vista 3)
**Objetivo:** consultar el historial de lecturas.

1. `ClinicalReadingHistoryCard.tsx`: calendario + fecha + hora, divisor, filas de valores **no-null** (label izq, valor+unidad der). Espeja `MeasurementHistoryCard`.
2. `ClinicalReadingsEntryCard.tsx`: card del dashboard → vista 3 (puede mostrar conteo / última fecha).
3. `ClinicalReadingsView.tsx`: header "Lecturas clínicas" + `RegisterReadingCard` (reusada, → vista 2) + "Historial" paginado (`FlatList` con `loadMore`). zinc dark-only desde el arranque.
4. `app/(tabs)/health/clinical-readings.tsx` (orquesta `useClinicalReadings` historial).
5. Editar `_layout.tsx` y `HealthDashboard` (3ª card del bloque, usa `ClinicalReadingsEntryCard`).
6. Documentar en `component-library.md`.

---

## 5. Checklist por fase (de las lecciones)

- [ ] Verificar forma real de la respuesta (plana vs `{ data }`) → defensa en el service.
- [ ] `getToken` y callbacks NO como deps de effects con `setState` → usar `getTokenRef`.
- [ ] No duplicar fetch inicial (`useEffect` + `useFocusEffect`).
- [ ] CTA flotante en sub-pantallas de `(tabs)/health` → offset `TAB_BAR_HEIGHT + insets.bottom` (el tab bar nativo se renderiza encima).
- [ ] zinc dark-only, color directo (sin `dark:`). Azul de la maqueta → rose-400.
- [ ] Antes de crear un componente → buscar en `component-library.md`. Extender, no forkear.
- [ ] No inventar datos fuera del DTO. Degradar valores faltantes (no-null), no esconder.
- [ ] `StatusBar style="light"` ya global (no tocar).
- [ ] Validación de entorno Windows: ESLint directo (`node node_modules/eslint/bin/eslint.js`), no confiar solo en `expo lint`.
- [ ] Si surge un error nuevo → registrarlo en `agent-implementation-lessons.md`.

---

## 6. Fuera de alcance (por ahora)
- Detalle individual de lectura (`GET /readings/{id}`) — diferido (§0).
- Gráficos/tendencias de glucemia y lípidos — la guía los sugiere a futuro; no están en las maquetas.
- Efecto funcional real del consentimiento de IA — fase backend futura; el toggle ya queda listo.
- Migrar `app/(tabs)/health/history.tsx` (mediciones) que sigue en `slate` — deuda preexistente, no es parte de este cambio.
