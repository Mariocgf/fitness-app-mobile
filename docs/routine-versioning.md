# Versionado de rutinas modificadas

Este documento define cómo manejar historial, selección y restauración de versiones de rutinas. La decisión principal es: **una rutina mantiene versiones inmutables por snapshot completo, y el usuario puede elegir qué versión usar sin crear una versión nueva hasta que modifique contenido**.

## Decisión principal

Usaremos un modelo con dos conceptos separados:

| Concepto | Responsabilidad |
|---|---|
| `Routine` | Identidad estable de la rutina. No representa el contenido completo. |
| `RoutineVersion` | Snapshot inmutable del contenido de la rutina en un momento concreto. |

La rutina puede tener muchas versiones:

```txt
Routine: Pierna
Versiones: v1, v2, v3, v4, v5
Última versión creada: v5
Versión seleccionada para usar: v3
```

Cambiar la versión seleccionada para entrenar **no crea historial nuevo**.  
Modificar una versión existente **sí crea una nueva versión**.

## Por qué snapshots completos

Cada versión guarda la rutina completa, no solamente los cambios.

Ejemplo:

```txt
v1
- Sentadilla: 3x10 - 80kg
- Prensa: 4x12 - 120kg
- Peso muerto: 3x8 - 90kg

v2
- Sentadilla: 4x8 - 80kg
- Prensa: 4x12 - 120kg
- Peso muerto: 3x8 - 100kg
```

Aunque en `v2` solo cambiaron Sentadilla y Peso muerto, se guarda también Prensa. Esto es intencional.

Ventajas:

- restaurar es simple;
- mostrar historial es simple;
- comparar versiones es posible;
- no dependemos de reconstruir la rutina aplicando parches;
- baja complejidad para un dominio donde el tamaño de datos es razonable.

Guardar solo diferencias sería más complejo y no aporta suficiente valor ahora.

## Modelo conceptual

```txt
Routine
- id
- userId
- name
- latestVersionId
- activeVersionId
- createdAt
- updatedAt

RoutineVersion
- id
- routineId
- versionNumber
- snapshot
- basedOnVersionId
- createdAt
- createdBy
- changeReason
```

### Campos importantes

| Campo | Uso |
|---|---|
| `latestVersionId` | Apunta a la última versión creada. |
| `activeVersionId` | Apunta a la versión que el usuario quiere usar actualmente. |
| `versionNumber` | Número visible: `v1`, `v2`, `v3`, etc. |
| `snapshot` | Contenido completo de la rutina en esa versión. |
| `basedOnVersionId` | Indica desde qué versión nació una nueva versión. |

`basedOnVersionId` es importante porque una versión nueva no siempre nace desde la última.

Ejemplo:

```txt
v1 -> v2 -> v3 -> v4 -> v5

El usuario usa v3, la modifica y guarda.

Resultado:
v6 basedOnVersionId = v3
```

Eso cuenta la verdad histórica: `v6` nació desde `v3`, no desde `v5`.

## Reglas de negocio

### 1. Usar una versión vieja no crea una nueva versión

Caso:

```txt
latestVersionId = v5
activeVersionId = v5
```

El usuario quiere entrenar unas semanas con `v3` porque era más intensa.

Resultado:

```txt
latestVersionId = v5
activeVersionId = v3
```

No se crea `v6`.

### 2. Modificar una versión sí crea una nueva versión

Caso:

```txt
latestVersionId = v5
activeVersionId = v3
```

El usuario cambia series, repeticiones, peso o ejercicios de `v3`.

Resultado:

```txt
v6 = snapshot de v3 + cambios
basedOnVersionId = v3
latestVersionId = v6
activeVersionId = v6
```

### 3. Restaurar como decisión histórica puede crear una versión nueva

Hay dos acciones distintas:

| Acción | Crea versión nueva | Ejemplo |
|---|---:|---|
| Usar versión | No | “Quiero entrenar hoy con v3.” |
| Restaurar versión | Sí, si se quiere dejar trazabilidad | “Quiero volver oficialmente a como estaba en v3.” |

Para evitar confusión en la UI, conviene separar los textos:

- **Usar esta versión**
- **Restaurar como nueva versión**

### 4. Las versiones son inmutables

Una vez creada una `RoutineVersion`, no se edita.

Si el usuario cambia algo, se crea otra versión.

Esto evita errores como:

- cambiar accidentalmente el pasado;
- romper entrenamientos ya registrados;
- perder la trazabilidad de por qué una rutina cambió.

## Flujos principales

### Crear rutina

```txt
1. Usuario crea rutina.
2. Se crea Routine.
3. Se crea RoutineVersion v1.
4. latestVersionId = v1.
5. activeVersionId = v1.
```

### Editar rutina actual

```txt
1. Usuario edita la versión activa.
2. Al guardar, se crea una nueva RoutineVersion.
3. El snapshot nuevo incluye toda la rutina.
4. basedOnVersionId = versión activa anterior.
5. latestVersionId = nueva versión.
6. activeVersionId = nueva versión.
```

### Usar una versión anterior

```txt
1. Usuario abre historial.
2. Selecciona v3.
3. Presiona "Usar esta versión".
4. activeVersionId = v3.
5. latestVersionId queda igual.
```

### Editar una versión anterior seleccionada

```txt
1. Usuario tiene activeVersionId = v3.
2. Cambia contenido.
3. Guarda.
4. Se crea v6 basada en v3.
5. activeVersionId = v6.
6. latestVersionId = v6.
```

### Restaurar como nueva versión

```txt
1. Usuario está en v5.
2. En historial elige v3.
3. Presiona "Restaurar como nueva versión".
4. Se crea v6 con el snapshot de v3.
5. basedOnVersionId = v3.
6. activeVersionId = v6.
7. latestVersionId = v6.
```

## Implicaciones para la UI

La UI debería mostrar:

```txt
Rutina: Pierna
Versión usando ahora: v3
Última versión creada: v5
```

En historial:

```txt
v5 - 2026-06-20 - Última creada
v4 - 2026-06-10
v3 - 2026-05-28 - En uso
v2 - 2026-05-10
v1 - 2026-05-01
```

Acciones recomendadas:

- **Ver versión**
- **Usar esta versión**
- **Comparar con actual**
- **Restaurar como nueva versión**

Cuando el usuario edita una versión que no es la última, conviene mostrar un aviso:

```txt
Estás editando v3, pero existe una versión más nueva: v5.
Al guardar se creará v6 basada en v3.
```

Esto evita sorpresas.

## API sugerida

### Obtener rutina activa

```http
GET /routines/{routineId}
```

Devuelve la rutina con el snapshot de `activeVersionId`.

### Obtener historial

```http
GET /routines/{routineId}/versions
```

Devuelve metadata de versiones, no necesariamente el snapshot completo de todas.

### Obtener una versión concreta

```http
GET /routines/{routineId}/versions/{versionId}
```

Devuelve el snapshot completo de esa versión.

### Usar una versión existente

```http
PATCH /routines/{routineId}/active-version
```

Body:

```json
{
  "versionId": "version_3"
}
```

Esto no crea versión nueva.

### Guardar cambios

```http
POST /routines/{routineId}/versions
```

Body:

```json
{
  "basedOnVersionId": "version_3",
  "snapshot": {},
  "changeReason": "Ajuste para bloque de fuerza"
}
```

Crea una nueva versión.

### Restaurar como nueva versión

```http
POST /routines/{routineId}/versions/{versionId}/restore
```

Crea una nueva versión usando el snapshot de `versionId`.

## Reglas de validación

- `activeVersionId` debe pertenecer a la misma rutina.
- `basedOnVersionId` debe pertenecer a la misma rutina.
- `versionNumber` debe ser incremental por rutina.
- Una `RoutineVersion` no se modifica después de creada.
- Si se guarda una edición, el snapshot debe ser completo.
- Si se borra una rutina, definir si el borrado es lógico para conservar historial.

## Casos borde

### Dos dispositivos editan a la vez

Si el usuario edita `v3` en un dispositivo y `v5` en otro, cada guardado debería crear una versión nueva con su propio `basedOnVersionId`.

Ejemplo:

```txt
v6 basedOnVersionId = v3
v7 basedOnVersionId = v5
```

Después la UI puede mostrar claramente de dónde nació cada versión.

### Entrenamientos ya realizados

Si un entrenamiento fue realizado usando `v3`, ese entrenamiento debería guardar referencia a `routineVersionId = v3`.

No debería depender de `activeVersionId`, porque `activeVersionId` puede cambiar después.

### Cambio menor accidental

Si el usuario abre edición y no cambia nada, no se crea versión nueva.

Idealmente el frontend o backend debería detectar si el snapshot nuevo es igual al anterior.

## Checklist para implementación futura

- [ ] Crear entidad/tabla `RoutineVersion`.
- [ ] Guardar snapshot completo de rutina por versión.
- [ ] Agregar `latestVersionId` y `activeVersionId` en `Routine`.
- [ ] Hacer que editar cree una nueva versión inmutable.
- [ ] Hacer que “usar versión” solo cambie `activeVersionId`.
- [ ] Hacer que “restaurar como nueva versión” cree una nueva versión basada en una anterior.
- [ ] Guardar `basedOnVersionId`.
- [ ] Asociar entrenamientos realizados a `routineVersionId`.
- [ ] Mostrar aviso si se edita una versión que no es la última.

## Resumen corto

La regla de oro:

> **Cambiar qué versión uso no crea historial. Cambiar el contenido sí crea una nueva versión.**

Este modelo mantiene la historia limpia, permite volver a versiones anteriores sin perder nada y evita complejidad innecesaria.
