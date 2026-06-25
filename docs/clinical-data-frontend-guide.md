# Guía Frontend — Datos Clínicos

> Todo lo que el front necesita para implementar el módulo de datos clínicos (perfil clínico, consentimiento de IA y lecturas).
> Backend: Fases 0, 1 y 2 implementadas. Base path: `api/clinical` (rutas case-insensitive).

## 1. Modelo conceptual

El módulo tiene **dos cosas distintas**:

| Concepto | Qué es | Dónde vive | Endpoint base |
|---|---|---|---|
| **Perfil clínico** | Atributos casi estáticos + flags + consentimiento de IA. Uno por usuario. | `ClinicalProfile` (1:1) | `/profile`, `/ai-consent` |
| **Lecturas clínicas** | Valores que varían en el tiempo (glucemia, lípidos). Muchas por usuario (historial). | `ClinicalReading` (serie temporal) | `/readings` |

### Concepto clave: "valor O flag"

El usuario **no está obligado a cargar valores**. Hay dos formas de registrar un dato:

- **Flag (sin valor):** en el *perfil*, marca que "tiene" algo. Ej: `hasGlucose = true` ("soy diabético / monitoreo glucosa") sin dar un número.
- **Valor:** en las *lecturas*, carga el número real cuando quiere (ej: glucemia 110 mg/dL). Cada campo de una lectura es opcional.

→ En la UI: el perfil tiene los flags (switches), y las lecturas son un formulario aparte donde cada campo se puede dejar vacío.

## 2. Privacidad y consentimiento de IA

- Todos los datos clínicos se guardan **cifrados con AES** en el backend (transparente para el front).
- El usuario controla si la IA puede usar estos datos con un único toggle global: `allowAiUsage`.
- **Por defecto está apagado (`false`).**

### UI requerida

1. Un **toggle** para que el usuario active/desactive `allowAiUsage`.
2. Un **indicador visual** de estado ("Tus datos clínicos se usan para personalizar tus rutinas" / "No se están usando"). El estado sale de `allowAiUsage` en `GET /profile`.

> ⚠️ **Nota honesta:** hoy el toggle **persiste y refleja el estado, pero todavía no tiene efecto funcional** (la integración con la IA es una fase futura). Construilo igual: cuando se implemente esa fase, el flag ya va a estar conectado y funcionará solo.

## 3. Autenticación

Todos los endpoints requieren **JWT Bearer** (Clerk), igual que el resto de la API.

```
Authorization: Bearer <token>
```

Sin token válido → `401 Unauthorized`. El usuario se resuelve del token; el front **no** manda userId.

## 4. Enums — ⚠️ se serializan como NÚMEROS

La API serializa los enums como **enteros**, no como strings (consistente con el resto de la API, ej. `gender`). El front debe mandar y leer estos números:

### `bloodType`
| Valor | Número |
|---|---|
| A  | `0` |
| B  | `1` |
| AB | `2` |
| O  | `3` |

### `rhFactor`
| Valor | Número |
|---|---|
| Positive (+) | `0` |
| Negative (−) | `1` |

`null` = no informado. Sugerencia: mapear estos números a labels legibles en el front (ej. `0 → "A"`, `rhFactor 0 → "+"`).

## 5. Endpoints — Perfil clínico

### `GET /api/clinical/profile`
Devuelve el perfil clínico del usuario actual. Si el usuario nunca cargó nada, devuelve los valores por defecto (no falla).

**Response 200:**
```json
{
  "bloodType": 3,
  "rhFactor": 0,
  "hasGlucose": true,
  "hasDyslipidemia": false,
  "allowAiUsage": false
}
```
Perfil vacío (usuario nuevo):
```json
{
  "bloodType": null,
  "rhFactor": null,
  "hasGlucose": false,
  "hasDyslipidemia": false,
  "allowAiUsage": false
}
```

### `PUT /api/clinical/profile`
Actualiza grupo sanguíneo, Rh y flags. Crea el perfil si no existía. Devuelve el perfil actualizado.

**Request:**
```json
{
  "bloodType": 3,
  "rhFactor": 0,
  "hasGlucose": true,
  "hasDyslipidemia": false
}
```
- `bloodType` y `rhFactor` son opcionales (pueden ir `null`).
- `hasGlucose` y `hasDyslipidemia` son booleanos (default `false` si no se mandan).
- **Importante:** este endpoint **NO** toca `allowAiUsage` (eso se maneja en `/ai-consent`).

**Response 200:** el `ClinicalProfileDto` completo (igual que `GET /profile`).

### `PUT /api/clinical/ai-consent`
Activa o desactiva el consentimiento de IA. Crea el perfil si no existía. Devuelve el perfil actualizado.

**Request:**
```json
{ "enabled": true }
```

**Response 200:** el `ClinicalProfileDto` completo (con `allowAiUsage` reflejando el nuevo estado).

## 6. Endpoints — Lecturas clínicas

Cada lectura tiene una fecha y valores **todos opcionales**. El usuario carga solo los que quiere.

### `POST /api/clinical/readings`
Registra una lectura. Devuelve la lectura creada (con `id` y `capturedAt`).

**Request:**
```json
{
  "date": "2026-06-24",
  "glucoseMgDl": 110,
  "totalCholesterolMgDl": 180,
  "hdlMgDl": 50,
  "ldlMgDl": 100,
  "triglyceridesMgDl": 150
}
```
- `date` es opcional → si se omite o va `null`, el backend usa la fecha de hoy (UTC). Formato `YYYY-MM-DD`.
- Todos los `*MgDl` son opcionales. Se puede mandar solo uno (ej. solo `glucoseMgDl`).
- Los valores deben ser **mayores a 0**; un `0` o negativo devuelve `400`.

**Response 200:**
```json
{
  "id": "f3a1...-guid",
  "date": "2026-06-24",
  "capturedAt": "2026-06-24T23:33:29.123Z",
  "glucoseMgDl": 110,
  "totalCholesterolMgDl": 180,
  "hdlMgDl": 50,
  "ldlMgDl": 100,
  "triglyceridesMgDl": 150
}
```

### `GET /api/clinical/readings?page=1&pageSize=10`
Historial paginado, ordenado de **más reciente a más antiguo** (por `capturedAt`).

- `page` (default `1`), `pageSize` (default `10`). Query params opcionales.

**Response 200:**
```json
{
  "page": 1,
  "pageSize": 10,
  "totalCount": 23,
  "items": [
    {
      "id": "f3a1...-guid",
      "date": "2026-06-24",
      "capturedAt": "2026-06-24T23:33:29.123Z",
      "glucoseMgDl": 110,
      "totalCholesterolMgDl": null,
      "hdlMgDl": null,
      "ldlMgDl": null,
      "triglyceridesMgDl": null
    }
  ]
}
```

### `GET /api/clinical/readings/{id}`
Detalle de una lectura por su `id` (GUID). Solo devuelve lecturas del usuario actual.

**Response 200:** un `ClinicalReadingDto` (igual que un item del historial).
**Response 404:** si no existe o pertenece a otro usuario.

## 7. Formatos de datos

| Campo | Tipo | Formato | Ejemplo |
|---|---|---|---|
| `bloodType`, `rhFactor` | enum (int) o `null` | ver sección 4 | `3` |
| `hasGlucose`, `hasDyslipidemia`, `allowAiUsage`, `enabled` | boolean | | `true` |
| `date` | fecha | `YYYY-MM-DD` | `"2026-06-24"` |
| `capturedAt` | fecha-hora UTC | ISO 8601 | `"2026-06-24T23:33:29.123Z"` |
| `*MgDl` | número decimal o `null` | | `110`, `49.5` |
| `id` | GUID | | `"f3a1b2c3-...."` |

## 8. Manejo de errores

Todos los errores vienen en este formato:
```json
{
  "statusCode": 404,
  "message": "Lectura clínica no encontrada.",
  "timestamp": "2026-06-24T23:33:29Z"
}
```

| Código | Cuándo |
|---|---|
| `400` | Valor de lectura ≤ 0 (debe ser > 0). |
| `401` | Falta el token o es inválido. |
| `404` | Usuario no encontrado, o lectura inexistente / de otro usuario. |

## 9. Flujo de UI sugerido

1. **Pantalla "Perfil clínico":**
   - Al entrar → `GET /profile`.
   - Selector de grupo sanguíneo (A/B/AB/O) + Rh (+/−).
   - Switches: "Tengo glucosa elevada" (`hasGlucose`), "Tengo colesterol/lípidos altos" (`hasDyslipidemia`).
   - Guardar → `PUT /profile`.
   - Toggle separado "Permitir que la IA use mis datos clínicos" (`allowAiUsage`) → `PUT /ai-consent`. Con su indicador de estado.

2. **Pantalla "Lecturas clínicas":**
   - Botón "Registrar lectura" → formulario con fecha + campos opcionales → `POST /readings`.
   - Historial paginado → `GET /readings?page&pageSize`. Ideal para mostrar tendencias/gráficos de glucemia y lípidos.
   - Tap en una lectura → `GET /readings/{id}` para el detalle.

## 10. Futuro (Fase 3 — no implementada aún)

Cuando se implemente el uso por IA, **el contrato del front no cambia**: el toggle `allowAiUsage` que ya construiste pasará a tener efecto real (la IA usará los datos clínicos solo si está en `true`). No hay que tocar nada en el front por eso.
