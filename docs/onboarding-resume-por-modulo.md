# Onboarding: retomar el módulo pendiente

Guía para el front. El objetivo: si el usuario deja la configuración de un módulo a la
mitad y cierra/borra la app, al volver debe **retomar ese módulo desde su inicio** — sin
rehacer el onboarding entero ni los módulos ya configurados.

## Qué cambió en el back

`GET /api/onboarding/status` ahora, además del `status` global, devuelve el estado de
cada módulo activo. El front ya no tiene que adivinar cuál módulo falta.

El **enum de `status` NO cambió** — sigue representando la FASE del onboarding. Qué módulo
falta es un dato aparte (`modules`).

## Contrato de la respuesta

```jsonc
// GET /api/onboarding/status  ->  200
{
  "status": "AWAITING_MODULE_CONFIG",
  "modules": [
    { "moduleId": "3f2a...", "name": "Health",  "onboardingCompleted": true  },
    { "moduleId": "9b1c...", "name": "Fitness", "onboardingCompleted": false }
  ]
}
```

### Campos

| Campo                        | Tipo    | Notas |
|------------------------------|---------|-------|
| `status`                     | string  | Fase global del onboarding (ver enum abajo). |
| `modules`                    | array   | Módulos **activos** del usuario. Ver cuándo viene poblado. |
| `modules[].moduleId`         | GUID    | Id del módulo. Úsalo como clave estable. |
| `modules[].name`             | string  | `"Health"`, `"Fitness"`, `"Nutrition"`. Para rutear a la pantalla del módulo. |
| `modules[].onboardingCompleted` | bool | `true` = ya configurado. `false` = pendiente. |

### Valores de `status`

| Valor                       | Significado                          | `modules` |
|-----------------------------|--------------------------------------|-----------|
| `AWAITNG_TERMS_ACCEPTANCE`  | Falta aceptar términos.              | vacío     |
| `AWAITING_BASIC_DATA`       | Faltan datos básicos (altura, peso, fecha, género). | vacío |
| `AWAITING_MODULE_SELECTION` | No eligió módulos todavía.           | vacío     |
| `AWAITING_MODULE_CONFIG`    | Hay al menos un módulo sin configurar. | **poblado** |
| `COMPLETED`                 | Todo listo.                          | **poblado** |

> Ojo: `AWAITNG_TERMS_ACCEPTANCE` viene con ese typo desde el back (falta la `I`). Matchealo tal cual.

**`modules` solo viene poblado en `AWAITING_MODULE_CONFIG` y `COMPLETED`.** En las fases
anteriores llega como lista vacía (`[]`), porque el usuario todavía no seleccionó módulos.

## Cómo retomar (la lógica del front)

1. Llamás a `GET /api/onboarding/status`.
2. Si `status !== "AWAITING_MODULE_CONFIG"` → seguí el flujo lineal normal según el enum.
3. Si `status === "AWAITING_MODULE_CONFIG"`:
   - Buscá el **primer** módulo con `onboardingCompleted === false`.
   - Ruteá a la pantalla de configuración de ese módulo (mapeando por `name`) **desde su inicio**.
   - Los módulos con `onboardingCompleted === true` NO se vuelven a pedir.
4. Al terminar de configurar un módulo (`POST /api/onboarding/module/{health|fitness|nutrition}`),
   volvé a pedir el status: si queda otro pendiente, repetís; si no, pasará a `COMPLETED`.

```ts
// Pseudo-código
const { status, modules } = await getOnboardingStatus();

if (status === "AWAITING_MODULE_CONFIG") {
  const next = modules.find(m => !m.onboardingCompleted);
  if (next) routeToModuleConfig(next.name); // arranca ese módulo desde cero
}
```

### Progreso (opcional pero gratis)

Con `modules` podés pintar el avance sin pedir nada extra:
`Salud ✅ · Fitness ⏳ · Nutrición ⏳`.

## Endpoints de configuración por módulo

Cada uno marca el módulo como completado en el back. Responden `204 No Content`.

| Módulo    | Endpoint                          |
|-----------|-----------------------------------|
| Salud     | `POST /api/onboarding/module/health`    |
| Fitness   | `POST /api/onboarding/module/fitness`   |
| Nutrición | `POST /api/onboarding/module/nutrition` |

> Recordatorio: en fitness **no** se piden días, tiempo ni equipamiento en el onboarding.
> Eso se maneja en el modal de generación de rutina y en la vista de equipamientos.

## Qué NO cambió

- El enum de `status` sigue igual — no matchees strings nuevos.
- El flujo lineal previo a la selección de módulos es el mismo.
- Los contratos de los `POST` de configuración no cambiaron.
