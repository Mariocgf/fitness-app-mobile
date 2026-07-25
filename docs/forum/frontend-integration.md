# Foro — guía de integración para el front

Todo lo que el front necesita para consumir el foro. La API ya está implementada (Fases 0-7) y las
tablas migradas. Base de todos los endpoints: **`/api/forum`**.

> **Leé primero las 3 reglas de oro** (sección siguiente). No se deducen del JSON y romperlas cambia el
> sentido del feature.

---

## Reglas de oro (no negociables)

1. **No existe el "compatible ✓".** El detalle de un post con rutina trae `flags` (advertencias). Una
   lista **vacía NO significa "aprobado/seguro"** — significa que no se detectaron incompatibilidades.
   **Nunca** muestres un badge verde de "compatible con vos". Mostrá advertencias cuando hay flags, y
   nada cuando no hay. El sistema **advierte, no bendice**.
2. **El feed trae el cuerpo COMPLETO.** `body` viene entero; **truncá vos** en la card para que se vean
   iguales. No hay campo "excerpt".
3. **Errores en PascalCase, éxitos en camelCase.** Las respuestas OK usan camelCase (`likeCount`). Los
   **errores** los serializa otro componente en **PascalCase** (`StatusCode`, `Message`, `FlaggedTerms`).
   Ojo al parsear cuerpos de error.

---

## Básicos

| Tema | Detalle |
|------|---------|
| Base URL | `/api/forum` |
| Auth | **Bearer JWT (Clerk)** en `Authorization`. Todos los endpoints requieren login → sin token = **401**. |
| Content-Type | `application/json` |
| Paginación | Query `page` (1-based, default 1) y `pageSize` (default 10, **máx 50**; se recorta en el server). |
| Imágenes | **No soportadas en esta versión.** No hay subida ni display de imágenes en posts todavía. |

---

## Índice de endpoints

| Método | Ruta | Qué hace |
|--------|------|----------|
| `POST` | `/api/forum/posts` | Publicar post |
| `GET` | `/api/forum/posts` | Feed paginado |
| `GET` | `/api/forum/posts/{id}` | Detalle del post (con flags) |
| `POST` | `/api/forum/posts/{id}/copy` | Copiar la rutina adjunta a tu cuenta |
| `POST` | `/api/forum/posts/{id}/like` | Dar/sacar like (toggle) |
| `POST` | `/api/forum/posts/{id}/report` | Denunciar post |
| `POST` | `/api/forum/posts/{id}/comments` | Comentar |
| `GET` | `/api/forum/posts/{id}/comments` | Listar comentarios |
| `POST` | `/api/forum/comments/{id}/report` | Denunciar comentario |

---

## Endpoints en detalle

### `POST /api/forum/posts` — publicar

Request:
```json
{
  "title": "Pasé de 8 a 12 reps",
  "body": "Hice estos 10 pasos y me funcionó...",
  "attachedRoutineVersionId": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
}
```
- `title`, `body`: requeridos. `attachedRoutineVersionId`: opcional (`null` = post solo de texto). Si lo
  mandás, tiene que ser el id de una **versión de rutina TUYA** (no podés compartir la rutina de otro).

Response `200`:
```json
{ "id": "…", "createdAt": "2026-07-18T14:00:00Z" }
```

Errores: `400` (título/cuerpo vacíos, o `attachedRoutineVersionId` que no existe o no es tuyo),
`422` (contenido bloqueado — ver *Política de contenido*), `401` (sin auth).

---

### `GET /api/forum/posts?page=1&pageSize=10` — feed

Response `200` — `PagedResponse<ForumPostSummary>`:
```json
{
  "page": 1,
  "pageSize": 10,
  "totalCount": 42,
  "items": [
    {
      "id": "…",
      "authorId": "…",
      "authorName": "Ana García",
      "title": "Pasé de 8 a 12 reps",
      "body": "Texto COMPLETO del post…",
      "attachedRoutineVersionId": "…",
      "likeCount": 12,
      "likedByMe": true,
      "commentCount": 3,
      "createdAt": "2026-07-18T14:00:00Z"
    }
  ]
}
```
- **Sin flags acá** (van en el detalle). `attachedRoutineVersionId` presente (≠ null) → mostrá botón
  "ver rutina" que abre el detalle. `body` completo → truncá en la card.
- Más nuevos primero. `authorName` puede venir **vacío** si el autor eliminó su cuenta (manejalo).

---

### `GET /api/forum/posts/{id}` — detalle (con flags)

Response `200` — `ForumPostDetail`:
```json
{
  "id": "…",
  "authorId": "…",
  "authorName": "Ana García",
  "title": "…",
  "body": "…",
  "createdAt": "…",
  "commentCount": 3,
  "attachedRoutine": {
    "versionId": "…",
    "days": [
      {
        "dayOfWeek": "Monday",
        "approxTimeSession": 45,
        "exercises": [
          {
            "exerciseId": "0V2YQjW",
            "name": "Barbell Bench Press",
            "gifUrl": "https://…",
            "order": 0,
            "sets": 3,
            "repType": "Range",
            "minRep": 8,
            "maxRep": 12,
            "durationSeconds": null,
            "rest": 90,
            "loadType": "ExternalWeight",
            "plannedWeightKg": 50,
            "primaryMuscleGroup": "chest"
          }
        ]
      }
    ]
  },
  "flags": [
    { "kind": "Injury", "subject": "Hombro", "affectedExerciseIds": ["0V2YQjW"] }
  ]
}
```

Cómo renderizar:
- `attachedRoutine`: `null` si el post es solo texto (o la rutina ya no existe). Si viene, renderizá el
  snapshot (días → ejercicios). `repType` ∈ `Fixed | Range | Timed` decide qué mostrar
  (reps fijas / rango min-max / duración en segundos). `loadType` ∈ `BodyWeight | ExternalWeight`.
- **`flags`** (ver Regla de oro #1): cada flag es **estructura, no frase** — armá vos el texto.
  - `kind`: `"Injury"` (lesión del lector) o `"Equipment"` (equipo que le falta).
  - `subject`: la lesión (ej. "Hombro") o el equipo faltante (ej. "barbell").
  - `affectedExerciseIds`: ids de los ejercicios de esta rutina que dispara la flag → **resaltalos** en el
    snapshot (matchean con `exercise.exerciseId`).
  - `flags: []` → **no muestres nada** (ni un verde). Silencio, no aprobación.

Errores: `404` (post inexistente u oculto por moderación).

---

### `POST /api/forum/posts/{id}/copy` — copiar rutina

Sin body. Copia la rutina adjunta a la cuenta del usuario (nueva rutina, **inactiva**, no desplaza su
rutina activa). **Gratis (0 créditos).**

Response `200`:
```json
{ "routineId": "…" }
```
- `routineId` = la rutina nueva en la cuenta del usuario. Podés navegar a ella. Queda **inactiva**.

Errores:
- `400` — el post no tiene rutina adjunta.
- `403` — **alcanzaste el límite de rutinas de tu plan**. Mostrá prompt de upgrade. (Free y Nutrición
  topean; Fitness/Full copian sin límite.) El `Message` del error trae el texto accionable.
- `404` — post inexistente o su rutina ya no está disponible.

---

### `POST /api/forum/posts/{id}/like` — toggle like

Sin body. Da like si no había, lo saca si había.

Response `200`:
```json
{ "liked": true, "likeCount": 13 }
```
- `liked` = estado nuevo; `likeCount` = total actualizado. Apto para UI optimista. El like es **status,
  sin créditos ni recompensa**.

Errores: `404` (post inexistente).

---

### `POST /api/forum/posts/{id}/report` — denunciar post

Request (motivo opcional):
```json
{ "reason": "spam" }
```

Response `200`:
```json
{ "reported": true, "hidden": false }
```
- `hidden: true` → el post superó el umbral de **denunciantes distintos (3)** y quedó **oculto**
  (desaparece del feed/detalle). Denunciar es idempotente (denunciar dos veces no suma).

Errores: `400` (no podés denunciar **tu propio** post), `404` (inexistente).

---

### `POST /api/forum/posts/{id}/comments` — comentar (plano)

Request:
```json
{ "body": "Buen aporte, gracias!" }
```
Comentarios **planos** (sin anidar / sin respuestas a respuestas).

Response `200`:
```json
{ "id": "…", "createdAt": "…" }
```

Errores: `400` (cuerpo vacío / muy largo), `404` (el post no existe o está oculto — no se comenta un
post no visible), `422` (contenido bloqueado — ver *Política de contenido*).

---

### `GET /api/forum/posts/{id}/comments?page=1&pageSize=10` — listar comentarios

Response `200` — `PagedResponse<Comment>`:
```json
{
  "page": 1, "pageSize": 10, "totalCount": 3,
  "items": [
    { "id": "…", "authorId": "…", "authorName": "Ana García", "body": "…", "createdAt": "…" }
  ]
}
```
Más nuevos primero. Los comentarios ocultos por moderación no aparecen.

---

### `POST /api/forum/comments/{id}/report` — denunciar comentario

Igual que denunciar post. Request `{ "reason": "…" }` (opcional). Response `{ "reported": true, "hidden": false }`.
`hidden: true` al 3er denunciante distinto. Errores: `400` (tu propio comentario), `404`.

---

## Política de contenido (respuesta 422)

Al **publicar** o **comentar**, el back corre un filtro **angosto de amenazas / autodaño** (ej. "matate").
NO es un filtro de insultos ni un enmascarador — solo bloquea lo inequívoco.

Si el texto viola la política, la request se **rechaza con `422`** y **no se publica**. El cuerpo del
error (¡PascalCase!) trae los términos marcados:
```json
{
  "StatusCode": 422,
  "Message": "Tu publicación contiene términos no permitidos. Editá el texto para publicar.",
  "FlaggedTerms": ["matate"],
  "Timestamp": "…"
}
```
El front debería **resaltar los `FlaggedTerms`** en el input para que el usuario los corrija.

---

## Contrato de errores

Todos los errores (excepto `401`/`403` de auth que puede cortar antes) tienen este cuerpo **en PascalCase**:
```json
{ "StatusCode": 404, "Message": "Post no encontrado.", "Timestamp": "…" }
```
El `422` de política agrega `FlaggedTerms`. Códigos usados por el foro:

| Código | Cuándo |
|--------|--------|
| `400` | Entrada inválida; adjuntar rutina ajena; denunciar/copiar algo inválido; denunciar lo propio |
| `401` | Sin autenticación |
| `403` | Límite de rutinas del plan alcanzado al copiar |
| `404` | Post/comentario inexistente u oculto por moderación |
| `422` | Contenido bloqueado por el filtro de amenazas (trae `FlaggedTerms`) |

---

## Notas de comportamiento que el front debe respetar

- **Contenido oculto por moderación** (superó denuncias) simplemente **desaparece** de feed, detalle y
  listados; su detalle devuelve `404`. No hace falta manejo especial: tratalo como "no existe".
- **Autor con cuenta eliminada**: `authorName` puede venir vacío. Mostrá un placeholder ("Usuario
  eliminado") en vez de un nombre en blanco.
- **Likes / comentarios / copiar** son libres para cualquier usuario logueado (no dependen del plan).
  **Solo copiar** puede toparse con el `403` de límite de plan.
- **Enums como string**: `repType` (`Fixed|Range|Timed`), `loadType` (`BodyWeight|ExternalWeight`),
  `flag.kind` (`Injury|Equipment`) viajan como texto.
- **Fuera de esta versión** (no implementar todavía en el front, o dejar oculto): subir/mostrar imágenes
  en posts, badges/reconocimiento, contador de vistas.
