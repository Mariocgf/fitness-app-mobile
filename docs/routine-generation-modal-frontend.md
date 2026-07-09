# Generación de rutina por modal — Guía Frontend

El backend cambió cómo se genera una rutina. Ahora un **modal** pide *lugar, nivel, tiempo y días* en cada generación, y el backend te da un endpoint para **pre-cargar** ese modal y otro para **generar**. El tiempo y los días se guardan solos, así el usuario no los vuelve a tipear. Esta guía tiene lo que el front necesita para conectar todo.

> Todos los endpoints requieren auth (header `Authorization: Bearer <JWT de Clerk>`).

---

## Quick path (flujo del modal)

1. **Al abrir el modal** → `GET api/routine/generation-options`. Con la respuesta poblás: equipamiento/lesiones/condiciones (info), las opciones de lugar y dificultad (selects), y **pre-seleccionás** días y tiempo.
2. **El usuario elige** lugar, nivel, tiempo y días.
3. **(Solo "Casa")** si quiere agregar equipamiento → lo mandás a la vista de equipamientos existente (endpoints de equipamiento, sin cambios). Al volver, re-llamás al GET y el equipamiento aparece actualizado.
4. **Al confirmar** → `POST api/routine/generate-routine` con los 4 campos. Devuelve la rutina generada.
5. El backend **persiste** tiempo + días. La próxima vez que abras el modal (paso 1), vienen pre-cargados.

---

## 1. Pre-cargar el modal — `GET api/routine/generation-options`

Sin body. Respuesta:

```jsonc
{
  "equipment": ["Mancuernas", "Banco"],           // nombres del equipamiento del usuario (solo mostrar)
  "injuries": ["Dolor lumbar"],                    // nombres de lesiones (solo mostrar)
  "approvedMedicalConditions": ["Hipertensión"],   // condiciones que el usuario habilitó para IA (solo mostrar)
  "workoutLocationOptions": ["Gym", "Home", "Calisthenics"],      // opciones del select de lugar
  "difficultyOptions": ["Beginner", "Intermediate", "Advanced"], // opciones del select de nivel
  "preferredWorkoutDays": ["monday", "wednesday"], // pre-selección de días (puede venir vacío)
  "sessionDurationMinutes": 45                     // pre-selección de tiempo. null = "tengo tiempo disponible"
}
```

| Campo | Para qué | Nota |
|-------|----------|------|
| `equipment` | Mostrar lo que el usuario tiene (útil en "Casa") | Solo nombres. **No** se envía de vuelta en el POST. |
| `injuries` / `approvedMedicalConditions` | Mostrar qué se va a tener en cuenta | Informativos. El backend ya los aplica solo; no se envían. |
| `workoutLocationOptions` | Opciones del select de lugar | Usá estos valores tal cual en el POST. |
| `difficultyOptions` | Opciones del select de nivel | Usá estos valores tal cual en el POST. |
| `preferredWorkoutDays` | Pre-seleccionar días | Puede venir `[]` (usuario nuevo). |
| `sessionDurationMinutes` | Pre-seleccionar tiempo | `null` ⇒ marcar "tengo tiempo disponible". Número ⇒ ese valor. |

---

## 2. Generar la rutina — `POST api/routine/generate-routine`

Body:

```jsonc
{
  "workoutLocation": "Gym",           // "Gym" | "Home" | "Calisthenics"
  "experienceLevel": "Intermediate",  // "Beginner" | "Intermediate" | "Advanced"
  "sessionDurationMinutes": 45,       // número (>0 y <=300)  |  null = "tengo tiempo disponible"
  "preferredWorkoutDays": ["monday", "wednesday"]  // requerido, al menos 1
}
```

Respuesta: la rutina generada (mismo `RoutineResponseDto` de siempre).

### Reglas de validación (validá también en el cliente)

| Campo | Regla |
|-------|-------|
| `workoutLocation` | Obligatorio. Uno de `Gym` / `Home` / `Calisthenics`. |
| `experienceLevel` | Obligatorio. Uno de `Beginner` / `Intermediate` / `Advanced`. |
| `sessionDurationMinutes` | `null` (disponible) **o** entero `> 0` y `<= 300`. |
| `preferredWorkoutDays` | Al menos 1. Cada día en inglés minúscula: `monday`..`sunday`. |

Si algo no valida → **HTTP 400** con el detalle. El equipamiento **no** va en el body: para "Casa" el backend lo lee del perfil del usuario (lo que cargó en la vista de equipamientos).

---

## 3. Qué hace cada lugar (para setear expectativas de UX)

| Lugar | Ejercicios que usa | Requiere equipamiento cargado |
|-------|--------------------|-------------------------------|
| **Gym** | Todos, sin filtro de equipamiento | No |
| **Home** | Los del equipamiento del usuario + peso corporal | Sí (si no tiene, ofrecele agregar) |
| **Calisthenics** | Solo peso corporal | No |

En los tres se respetan siempre las lesiones y las condiciones médicas aprobadas.

---

## 4. Cambios que rompen lo anterior (migrar)

| Qué | Acción |
|-----|--------|
| `POST api/exercises/generate-routine` | **Eliminado.** Usar `POST api/routine/generate-routine` (con body). |
| `GET api/exercises/filter-by-equipment/{externalId}` | **Eliminado.** No tenía uso real. |
| `POST api/routine/generate-routine` sin body | Ahora **requiere body** (los 4 campos de arriba). |

---

## 5. Cambios en el Onboarding

El onboarding de Fitness **ya no pide tiempo, equipamiento ni días**. Sacá esas pantallas/campos del flujo de onboarding.

- **Tiempo y días** → ahora se eligen en el modal de generación (y se guardan solos).
- **Equipamiento** → se gestiona en la vista de equipamientos (endpoints existentes, sin cambios).

El DTO de config de fitness ahora solo espera `experienceLevel`, `subGoals`, `trainingHistory`. Si por transición seguís mandando los campos viejos, **no rompe** (el backend los ignora).

---

## Checklist de integración

- [ ] Modal: al abrir, llama a `GET generation-options` y pre-carga días + tiempo.
- [ ] Selects de lugar y nivel armados con `workoutLocationOptions` / `difficultyOptions`.
- [ ] "Tengo tiempo disponible" ⇄ `sessionDurationMinutes: null`; valor numérico ⇄ minutos.
- [ ] Días se envían en inglés minúscula (`monday`..`sunday`).
- [ ] En "Casa" sin equipamiento: se ofrece ir a la vista de equipamientos.
- [ ] Generación: `POST generate-routine` con los 4 campos.
- [ ] Migradas las llamadas viejas a `exercises/generate-routine`.
- [ ] Onboarding de fitness sin pantallas de tiempo / equipamiento / días.

---

## Notas rápidas

- **`0` y `null` en tiempo son lo mismo de cara al usuario**: "tengo tiempo disponible" (sin límite). El GET nunca devuelve `0`; devuelve `null`.
- Los valores de enum (`Gym`, `Beginner`, etc.) son **case-insensitive** al enviar, pero conviene mandar exactamente lo que devuelve el GET.
- El equipamiento/lesiones/condiciones que devuelve el GET son **de solo lectura** para el modal: no se editan ni se envían desde acá.
