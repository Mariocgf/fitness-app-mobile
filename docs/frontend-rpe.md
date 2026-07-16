# Handoff al frontend — el RPE ahora es nullable

El backend dejó de usar `0` como "no registrado". Ahora **`null` significa "el usuario no lo registró"** y `0` **ya no es un valor válido**. Esto rompe el contrato en 4 endpoints y requiere una UI nueva para capturar el esfuerzo.

**Todo el backend ya está hecho, migrado y en verde (806/806).** Este documento es lo único que el front necesita saber.

---

## Quick path

1. Cambiar el tipo de `rpe` a **nullable** en los modelos de request y response (4 endpoints, abajo).
2. Hacer `rpe` **obligatorio (1-10)** en el request de ajuste de carga — ese endpoint ahora devuelve `400` sin él.
3. Construir el selector de esfuerzo **por set**: 4 botones, **sin preselección**. No tocar nada ⇒ `null`.
4. Construir el botón **opcional** de ajustar carga **por ejercicio**, que es una acción **separada** de registrar.
5. Verificar con el checklist del final.

---

## Por qué cambió (leelo antes de tocar código)

El backend guardaba `RPE = 0` cuando el usuario no cargaba el dato. Pero `0` **también parecía un valor válido**, y dos partes del sistema lo leyeron al revés:

| Quién escribía | Quién leía | Qué entendía |
|---|---|---|
| Registro de sesión (`Rpe ?? 0`) | — | *"no registrado"* |
| — | Servicio de progresión de cargas | *"le resultó trivial → **subile 18% el peso**"* |

**Un request sin el campo `rpe` le subía la carga al usuario un 18%.** Un campo ausente en un JSON terminaba en más peso sobre la barra de una persona.

La cura fue cambiar el tipo: si "ausente" es un estado posible, el tipo tiene que poder expresarlo. **`int?`, no `int`.**

---

## Cambios de contrato

> Nota: el JSON usa camelCase. El campo viaja como **`rpe`**.

### 1. `POST /api/Routine/sessions` — registrar sesión

`rpe` pasa a ser **opcional**. Enviar `null` u omitirlo cuando el usuario no lo registró.

```jsonc
{
  "routineId": "…",
  "trainedAt": "2026-07-14T10:00:00Z",
  "totalTime": "01:00:00",
  "exercises": [
    {
      "exerciseId": "…",
      "setNumber": 1,
      "repsPerformed": 10,
      "weightUsed": 40,
      "isCompleted": true,
      "rpe": 8        // ✅ 1-10 si el usuario lo eligió
    },
    {
      "exerciseId": "…",
      "setNumber": 2,
      "repsPerformed": 9,
      "weightUsed": 40,
      "isCompleted": true,
      "rpe": null     // ✅ o directamente omitir el campo
    }
  ]
}
```

**`"rpe": 0` ahora es inválido** → `400`.

### 2. `POST /api/Routine/sessions/manual` — sesión manual

Igual: `rpe` opcional dentro de cada set, `1-10` o `null`.

```jsonc
"sets": [
  { "setNumber": 1, "reps": 10, "weight": 40, "rpe": 7 },
  { "setNumber": 2, "reps": 8,  "weight": 40 }        // sin rpe: válido
]
```

### 3. `POST /api/Exercise/adjust-load` — ⚠️ AHORA OBLIGATORIO

Este es el único donde el RPE **no es opcional**: es el **input del cálculo**. Sin él no hay nada que ajustar.

```jsonc
{ "exerciseId": "…", "routineDayId": "…", "rpe": 8 }   // ✅ obligatorio, 1-10
{ "exerciseId": "…", "routineDayId": "…" }             // ❌ 400
{ "exerciseId": "…", "routineDayId": "…", "rpe": 0 }   // ❌ 400
```

**No llames a este endpoint si el usuario no eligió un esfuerzo.** No hay valor por defecto que puedas mandar.

### 4. `GET /api/Routine/training-history` — respuesta

`rpe` puede venir **`null`** en cualquier set. La UI tiene que saber renderizar la ausencia (un guion, "—", "sin registrar") en vez de mostrar un `0` o romperse.

```jsonc
"sets": [
  { "setNumber": 1, "repsPerformed": 10, "weightUsed": 40, "rpe": 8 },
  { "setNumber": 2, "repsPerformed": 9,  "weightUsed": 40, "rpe": null }
]
```

---

## La UI a construir

Son **dos flujos separados**, y la separación es el corazón del diseño.

### Flujo 1 — Registrar el esfuerzo (por SET, durante el descanso)

El usuario **no** debe ver un número del 1 al 10. Nadie sabe qué es "un RPE 7".

```
¿Cómo te fue esta serie?

   ┌──────────┐  ┌════════════┐  ┌──────────┐  ┌────────────┐
   │  Suave   │  ║   JUSTO    ║  │   Duro   │  │  Al fallo  │
   └──────────┘  └════════════┘  └──────────┘  └────────────┘
        4              6              8             10
```

| Botón | Valor que se envía |
|---|---|
| Suave | `4` |
| Justo | `6` |
| Duro | `8` |
| Al fallo | `10` |
| **No tocó nada** | **`null`** |

> ⚠️ **ESTA ESCALA VA A CAMBIAR.** Está mal calibrada: `Justo = 6` son **4 repeticiones en reserva**, o sea *por debajo* de la zona productiva — le dice al usuario que un esfuerzo insuficiente es el correcto.
>
> La escala corregida es **`Fácil 6 / Exigente 8 / Muy exigente 9 / Al fallo 10`**, y llega junto con el rediseño de la progresión de cargas (ver `docs/features/load-progression-redesign.md`, Fase 1).
>
> **Todo lo demás de este documento sigue vigente**: el contrato nullable, las reglas no negociables y los dos flujos. Lo único que cambia son las **etiquetas y su mapeo**. Construí el selector de forma que ese mapeo sea **un solo lugar** en el código, para que el cambio sea trivial.

**Categorías en la pantalla, números en el contrato.** El usuario elige una palabra; el backend recibe un número que la ciencia del entrenamiento entiende.

**No hay botón "Omitir", y no hace falta**: si el descanso termina y el usuario arranca la siguiente serie sin tocar nada, eso **ya es** omitir → se envía `null`. Un botón para no decir nada sería fricción sin propósito.

> Lo que **no** puede pasar es que ese silencio se convierta en un `6`. Ver regla 1.

### Flujo 2 — Ajustar la carga (OPCIONAL, se puede repetir)

Registrar el esfuerzo **no ajusta nada**. Si el usuario además quiere que cambie el peso, tiene que **pedirlo explícitamente**. El botón se ofrece al terminar cada set.

```
Set 2 terminado — Press de banca  (88 kg)

  Esfuerzo:  [Suave] [Justo] [Duro] [ AL FALLO ]
                                          ↑ elegido

  [ Ajustar la carga ]      ← opcional
```

#### LA REGLA: cada ajuste necesita un set nuevo que lo respalde

**Se puede ajustar varias veces en el mismo ejercicio** — el usuario tiene derecho a converger a su carga. Lo que **no** se puede es ajustar dos veces seguidas **sin haber ejecutado un set en el medio**.

> **El botón está habilitado solo si hay al menos un set con RPE registrado DESDE el último ajuste.** Apenas se ajusta, se deshabilita hasta que el usuario complete otro set.

Esto habilita la convergencia legítima:

```
Set 1 a 100 kg  →  Al fallo  →  ajusta  →  88 kg
Set 2 a  88 kg  →  Al fallo  →  ajusta  →  77 kg     ← RPE 10 sobre 88, no sobre 100
Set 3 a  77 kg  →  Duro     →  ajusta  →  72 kg
Set 4 a  72 kg  →  Justo    →  no ajusta. Llegó a su punto.
```

Cada RPE ahí es una **observación nueva sobre una carga distinta**. Eso no es insistir: **es converger**. Es lo que hace un entrenador — probar, medir, corregir, volver a probar.

Y a la vez impide el abuso: el backend calcula `nuevaCarga = cargaActual × (1 − %)` y **pisa** el valor, así que los ajustes **se acumulan**. Si se pudiera ajustar cuatro veces sin entrenar nada en el medio, el sistema bajaría el peso un 40% respondiendo cuatro veces a **la misma** observación. Exigir un set nuevo entre ajustes lo hace imposible.

#### Qué RPE se envía

> **El promedio de los sets ejecutados CON LA CARGA VIGENTE**, es decir, **desde el último ajuste**. Ignorando los `null`. Redondeado.

**Esto es importante y es fácil de hacer mal:** si el usuario ya ajustó, los sets *anteriores* al ajuste se hicieron con **otra carga**. Promediar el RPE de un set a 100 kg con el de un set a 88 kg es **promediar peras con manzanas** — no son observaciones comparables.

| Situación | Qué se promedia |
|---|---|
| **Nunca ajustó** en este ejercicio | Todos los sets con dato (todos usaron la misma carga) |
| **Ya ajustó** al menos una vez | Solo los sets con dato **posteriores** al último ajuste |

```
Sets:  Duro(8) · Duro(8) · Al fallo(10) · —(null)     ← sin ajustes previos
promedio(8, 8, 10) = 8.67  →  9

POST /api/Exercise/adjust-load  { "exerciseId": "…", "routineDayId": "…", "rpe": 9 }
```

#### Por qué registrar y ajustar son dos acciones y no una

El esfuerzo es un **HECHO** que el usuario registra. El ajuste es una **QUEJA**: *"esta carga está mal calibrada"*. **No son lo mismo**, y hay dos usuarios que lo demuestran:

| Usuario | Llega al fallo y… | Qué hace el sistema |
|---|---|---|
| **Busca hipertrofia** | registra `Al fallo` y **no** ajusta | Guarda el `10`. **No le toca el peso.** Está entrenando como quiere. |
| **Le resulta agotador** | registra `Al fallo` y **sí** ajusta | Guarda el `10` **y además** le baja la carga. |

**El mismo RPE. Dos intenciones opuestas.** Solo el tap de "ajustar" las distingue. Por eso registrar **nunca** puede ajustar solo.

> ⚠️ Si no hay **ningún** RPE registrado desde el último ajuste, el botón está **deshabilitado**. No hay promedio que calcular, y `adjust-load` exige un RPE. **No inventes uno para poder ajustar** — sin dato, no hay ajuste.

---

## Reglas no negociables (y el porqué)

Estas tienen fundamento. Si alguna parece incómoda de implementar, **preguntá antes de "arreglarla"** — hay una razón detrás de cada una.

### 1. NO preseleccionar ningún botón de esfuerzo

Es tentador dejar "Justo" marcado por defecto y asumir que quien no lo cambia está de acuerdo. **No lo hagas.**

El *default effect* está medidísimo: **la gente no cambia los valores por defecto — por inercia, no por acuerdo.** Si preseleccionás "Justo", vas a cosechar un océano de "Justo" que **no describe a los usuarios: describe tu default**.

Y peor: el usuario que la pasó **pésimo** pero está apurado y no toca nada quedaría registrado como *"estuvo justo"*, y el sistema le diría **"la carga está bien, seguí igual"**. Un default en un campo de seguridad no es neutro: es una decisión que tomás **vos**, en nombre del usuario, y la decisión es *"asumo que estás bien"*.

**Hacé que "Justo" sea el botón más grande, más visible y más obvio. Pero que requiera un tap.** Ese tap convierte una suposición tuya en una afirmación del usuario.

### 2. NUNCA enviar un valor "por defecto" cuando el usuario no eligió

Mandar un `7` inventado es **peor** que el `0` viejo. El `0` al menos era un centinela **detectable**. Un `7` fabricado es **indistinguible de un 7 real** — el sistema lo va a creer, y contamina el scoring de forma **invisible y permanente**.

El backend **sabe qué hacer con el vacío**: cuando no hay RPE, redistribuye su peso entre las otras señales. Está probado en producción: sin ningún RPE registrado, la rutina puntuó **100/100**.

**No necesita que le inventes nada. Necesita la verdad, incluso cuando la verdad es "no sé".**

### 3. Registrar NO ajusta. Ajustar es una acción aparte.

Nunca llames a `adjust-load` como efecto secundario de guardar un esfuerzo. El ajuste **siempre** nace de un tap explícito del usuario.

Dos usuarios pueden marcar `Al fallo` con **intenciones opuestas**: uno lo busca (hipertrofia) y el otro lo sufre. **El RPE no los distingue. Solo el tap de "ajustar" lo hace.**

### 4. Cada ajuste exige un set nuevo que lo respalde

Ajustar varias veces está **permitido y es deseable** — así el usuario converge a su carga. Pero **nunca dos ajustes seguidos sin un set en el medio**: el backend acumula los ajustes, y responder cuatro veces a la **misma** observación le bajaría el peso un 40% a alguien que solo describió su esfuerzo una vez.

---

## Lo que el backend hace con esto

Para que entiendas qué estás alimentando (no necesitás tocar nada de esto):

| RPE registrado | Consecuencia |
|---|---|
| **`null`** | No puntúa. Su peso se redistribuye entre adherencia y retención. **No penaliza.** |
| **< 6** | Penaliza: estímulo insuficiente para el objetivo que el usuario declaró. |
| **≥ 6** | **No penaliza, por alto que sea.** Llegar al fallo es una **elección**, no una queja. |

El RPE es un **hecho** que el usuario registra. La **queja** sería que pidiera ajustar la carga — y eso es el otro endpoint.

---

## Checklist

**Contrato**
- [ ] `rpe` es nullable en los modelos de `sessions` y `sessions/manual`.
- [ ] `rpe` **nunca** se envía como `0`.
- [ ] El historial renderiza `rpe: null` sin romperse (muestra "—", no "0").

**Registrar el esfuerzo**
- [ ] El selector tiene 4 botones: `Suave` `Justo` `Duro` `Al fallo` → `4` `6` `8` `10`.
- [ ] **Ningún botón viene preseleccionado.**
- [ ] Si el usuario no toca nada, se envía `null` (no un default).
- [ ] No existe **ningún** código que rellene el RPE con un valor por defecto.

**Ajustar la carga**
- [ ] `adjust-load` **solo** se llama desde un tap explícito del usuario, nunca al guardar.
- [ ] Se puede ajustar **varias veces** en el mismo ejercicio (el usuario tiene derecho a converger).
- [ ] **Pero cada ajuste exige un set nuevo**: apenas se ajusta, el botón se deshabilita hasta que se complete otro set con RPE.
- [ ] El RPE que se envía es el promedio de los sets con dato **posteriores al último ajuste** (si nunca ajustó: todos).
- [ ] Si no hay ningún RPE registrado desde el último ajuste, el botón está **deshabilitado**.
- [ ] El valor enviado siempre cae en `1-10`.

---

## Contexto extra (si hace falta)

- Fundamento completo del scoring: `docs/features/routine-catalog.md` §8.2
- Lección de por qué los centinelas rompen sistemas: `docs/lessons/orm-persistence.md`
- Commits: `e4a041b` (RPE nullable), `a3f5a73` (el RPE no tiene techo)
