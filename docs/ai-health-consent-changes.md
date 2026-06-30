# Cambios de API — Consentimiento granular de datos de salud para la IA

> Para el equipo de Front (React Native + Expo). Resume los endpoints y payloads nuevos/modificados.
> Todos los endpoints requieren **JWT Bearer** (`Authorization: Bearer <token>`). Body en JSON, enums como **string**.

## Concepto

El usuario decide, **ítem por ítem**, qué datos de salud puede usar la IA (generación de rutina y nutrición). Lo que viaja a la IA es siempre el **hecho declarado** ("tiene colesterol"), **nunca el valor numérico** (glucemia/lípidos en mg/dL son personales y no salen del sistema).

Hay dos grupos de toggles:

1. **Condiciones médicas** (catálogo): un toggle por cada condición que el usuario tiene. **Default: ON.**
2. **Parámetros clínicos declarados** (glucosa, colesterol total, HDL, LDL, triglicéridos): un toggle por parámetro, **default: OFF**, todos por debajo de un **master switch** (`allowAiUsage`). Un parámetro llega a la IA solo si: `allowAiUsage == true` **Y** su toggle == true **Y** el usuario declaró tenerlo (`hasX == true`).

---

## 1. Perfil clínico (parámetros + consentimientos)

### `GET /api/clinical/profile`

Devuelve el perfil clínico con el estado completo de declaraciones y consentimientos. Si el usuario nunca cargó nada, devuelve todo en `false`/`null`.

**Response 200** — `ClinicalProfileDto`:
```json
{
  "bloodType": "A",            // "A" | "B" | "AB" | "O" | null
  "rhFactor": "Positive",      // "Positive" | "Negative" | null
  "hasGlucose": true,
  "hasTotalCholesterol": false,
  "hasHdl": false,
  "hasLdl": false,
  "hasTriglycerides": false,
  "allowAiUsage": false,          // master switch
  "allowAiGlucose": false,
  "allowAiTotalCholesterol": false,
  "allowAiHdl": false,
  "allowAiLdl": false,
  "allowAiTriglycerides": false
}
```

### `PUT /api/clinical/profile`

Actualiza qué parámetros **declara tener** el usuario (no toca consentimientos). Get-or-create: crea el perfil si no existía.

**Request** — `UpdateClinicalProfileDto`:
```json
{
  "bloodType": "A",            // opcional, puede ser null
  "rhFactor": "Positive",      // opcional, puede ser null
  "hasGlucose": true,
  "hasTotalCholesterol": false,
  "hasHdl": false,
  "hasLdl": false,
  "hasTriglycerides": false
}
```
**Response 200**: `ClinicalProfileDto` (igual que el GET).

### `PUT /api/clinical/ai-consent`

Setea el **master switch** y los consentimientos por parámetro. Se envían todos juntos (estado final, no incremental).

**Request** — `SetClinicalAiConsentDto`:
```json
{
  "enabled": true,             // master switch (allowAiUsage)
  "glucose": true,
  "totalCholesterol": false,
  "hdl": false,
  "ldl": false,
  "triglycerides": false
}
```
**Response 200**: `ClinicalProfileDto`.

> **UX sugerida:** si `enabled` (master) está en `false`, los toggles por parámetro pueden mostrarse deshabilitados/grises — aunque estén en `true`, ningún parámetro llega a la IA con el master apagado. Y un toggle de parámetro solo tiene sentido si el parámetro está declarado (`hasX == true`).

---

## 2. Condiciones médicas (toggle por condición)

### `GET /api/health/user-medical-conditions`  *(modificado)*

Mismo endpoint de siempre, pero ahora cada condición incluye el campo **`allowAiUsage`**.

**Response 200** — `MedicalConditionDto[]`:
```json
[
  { "id": "0b3f...uuid", "name": "Hipertensión", "severity": "Medium", "allowAiUsage": true },
  { "id": "7a1c...uuid", "name": "Diabetes",     "severity": "High",   "allowAiUsage": false }
]
```
> `name` ya viene traducido al español si el catálogo tiene `NameEs`. Las condiciones arrancan con `allowAiUsage: true` por defecto.

### `PUT /api/health/user-medical-conditions/ai-consent`  *(nuevo)*

Habilita/deshabilita el uso por la IA de **una** condición puntual.

**Request** — `SetMedicalConditionAiConsentDto`:
```json
{
  "conditionId": "7a1c...uuid",   // el id de la condición (del GET de arriba)
  "enabled": false
}
```
**Response: 204 No Content.**

> Si el `conditionId` no pertenece al usuario, responde error (no es una condición asociada). Mandá un request por condición al togglear.

---

## Resumen de endpoints

| Método | Ruta | Para qué |
|--------|------|----------|
| `GET`  | `/api/clinical/profile` | Leer parámetros declarados + estado de consentimientos |
| `PUT`  | `/api/clinical/profile` | Declarar qué parámetros tiene el usuario |
| `PUT`  | `/api/clinical/ai-consent` | Master switch + consentimiento por parámetro |
| `GET`  | `/api/health/user-medical-conditions` | Listar condiciones del usuario (ahora con `allowAiUsage`) |
| `PUT`  | `/api/health/user-medical-conditions/ai-consent` | Toggle de IA por condición |

## Notas

- **Privacidad:** la app puede mostrar los valores numéricos de glucemia/lípidos (vienen de `GET /api/clinical/readings`), pero esos números **nunca** se envían a la IA. A la IA solo va el hecho declarado.
- **Default ON vs OFF:** condiciones médicas arrancan habilitadas (ON); parámetros clínicos arrancan deshabilitados (OFF, opt-in). Reflejar esos defaults en la UI inicial.
- Los enums (`bloodType`, `rhFactor`) se envían y reciben como **string**, no como número.
