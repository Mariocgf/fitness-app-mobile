# Resolución de conflictos de rutina offline (Frontend)

Guía para el equipo de frontend sobre cómo manejar conflictos al sincronizar ediciones de rutina hechas offline.

## Contexto

Cuando un usuario edita una rutina **offline** y mientras tanto la rutina cambió en el servidor (por ejemplo, la editó en otro dispositivo), al sincronizar se genera un **conflicto**.

La política del backend es **NO resolver automáticamente**. Ni `local-wins` ni `server-wins`. El backend detecta el conflicto, devuelve la versión del servidor, y **el usuario decide** con cuál quedarse.

## Cómo se detecta el conflicto

Al editar una rutina offline, el cliente debe haber guardado el `activeVersionId` que tenía la rutina **al momento de la descarga**. Ese valor se envía como `baseVersionId` en la operación de sync.

El backend compara:

- `baseVersionId` (lo que el cliente tenía cuando editó offline)
- `activeVersionId` actual de la rutina en el servidor

Si **no coinciden**, hubo un cambio en el medio → conflicto.

## Respuesta de conflicto

`POST /api/offline/sync` devuelve `200 OK`. El conflicto está dentro de `results[]`:

```json
{
  "results": [
    {
      "clientOperationId": "5c8fd7fe-97b4-4f84-b026-fcab98a8e74b",
      "status": "conflict",
      "error": "La rutina cambió en el servidor desde la descarga offline.",
      "result": {
        "id": "routine-guid",
        "name": "Nombre actual en el servidor",
        "activeVersionId": "version-nueva-del-servidor",
        "versionNumber": 3,
        "days": []
      }
    }
  ]
}
```

Lo nuevo e importante: **`result` contiene la rutina completa y actual del servidor** (`RoutineResponseDto`).

Antes el `result` venía vacío y había que hacer un `GET /api/routine/{id}` aparte. Ahora **no hace falta**: tenés todo en una sola respuesta para mostrarle al usuario las dos versiones.

## Flujo de resolución en el frontend

```
1. Sincronizo cola offline → POST /api/offline/sync
2. Detecto status === "conflict" en algún result
3. Comparo:
     - versión LOCAL  → la que el usuario editó offline
     - versión SERVER → result (la del servidor)
4. Muestro UI: "Esta rutina cambió en otro dispositivo. ¿Cuál querés mantener?"
5. Según la elección del usuario:
```

### Opción A: quedarse con la del servidor

- Descartar los cambios locales.
- Reemplazar la rutina local con `result`.
- Listo, nada que reenviar.

### Opción B: quedarse con la versión local (forzar la edición offline)

Reenviar la operación, pero:

- `baseVersionId` = `result.activeVersionId` (la **nueva** versión del servidor)
- `clientOperationId` = **un Guid NUEVO** ⚠️

```json
{
  "operations": [
    {
      "clientOperationId": "GUID-NUEVO-distinto-al-anterior",
      "type": "routine.update",
      "baseVersionId": "version-nueva-del-servidor",
      "payload": {
        "routineId": "routine-guid",
        "updatePayload": {
          "name": "Lo que el usuario quiere mantener",
          "activate": true,
          "days": []
        }
      }
    }
  ]
}
```

## ⚠️ Por qué un `clientOperationId` NUEVO es obligatorio

El `clientOperationId` que conflictuó **queda guardado como recibo terminal** en el backend (idempotencia persistente).

Si reenviás la operación resuelta con **el mismo** `clientOperationId`, el backend te va a devolver el **conflicto cacheado** sin reprocesar nada. Vas a quedar en un loop.

Esto es correcto por diseño: la operación resuelta es conceptualmente una operación **distinta** a la que conflictuó, por lo tanto necesita su propio ID.

**Regla:** una operación en conflicto está cerrada. La resolución es una operación nueva.

## Resumen de estados

| Status | Significado | Acción del frontend |
|---|---|---|
| `synced` | Aplicada o recuperada idempotentemente | Marcar como sincronizada |
| `failed` | Error de validación/recuperable | Reintento o manual |
| `conflict` | La rutina cambió en el servidor | Mostrar ambas versiones, pedir decisión al usuario |
| `skipped` | Duplicado en el batch o ya procesándose | Tratar como no fatal |

## Checklist de implementación frontend

- [ ] Guardar `activeVersionId` al descargar la rutina (será el `baseVersionId` del sync).
- [ ] Detectar `status === "conflict"` en cada `result` del batch.
- [ ] Usar `result` (rutina del servidor) directamente, sin hacer un GET extra.
- [ ] Mostrar UI de comparación local vs servidor.
- [ ] Al forzar la versión local: usar `result.activeVersionId` como nuevo `baseVersionId`.
- [ ] Al forzar la versión local: generar un `clientOperationId` **nuevo**.
- [ ] No reintentar automáticamente un conflicto con el mismo `clientOperationId`.
