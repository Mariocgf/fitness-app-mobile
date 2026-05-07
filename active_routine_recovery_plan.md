# Plan de Implementación: Recuperación de Rutina y Caché de Módulos

## 1. Capa de Servicios (`src/services/routineService.ts`)
- **Nuevo Endpoint**: Agregar la función `getActiveRoutine(token: string)` para realizar el `GET /api/Routine/active-routine`.
- **Manejo de Respuestas**:
  - Si el endpoint responde con un `200 OK`, retornará el objeto estructurado de tipo `Routine`.
  - Si responde con un `404 Not Found`, se capturará el error y la función retornará `null` de forma controlada (sin romper la ejecución), indicando que el usuario no tiene ninguna rutina activa.

## 2. Lógica y Sincronización en Home (`app/(tabs)/index.tsx`)
- **Nuevo Estado de Carga Global**: Añadir `isFetchingData` (inicializado en `true`) para evitar parpadeos en la interfaz mientras se verifica si hay rutinas preexistentes.
- **Flujo del `useEffect` de inicialización**:
  1. Intentar cargar `@user_routine` de `AsyncStorage` como un "optimistic load" (para mostrar la rutina instantáneamente si está cacheada localmente).
  2. Obtener el token de autenticación (`getToken()`).
  3. Lanzar dos consultas en paralelo usando `Promise.allSettled`:
     - `getActiveModules(token)`
     - `getActiveRoutine(token)`
  4. **Procesar Módulos**: Guardar la respuesta en el estado local (si es necesario) y, críticamente, hacer un `AsyncStorage.setItem('@active_modules', JSON.stringify(modules))` para tenerlos listos en caché.
  5. **Procesar Rutina**:
     - Si retorna la `Routine` (código 200): Actualizar el estado `routine`, guardarlo de nuevo en `@user_routine` (AsyncStorage) por si hubo cambios y establecer `cardState` en `'success'`.
     - Si retorna `null` (código 404): Asegurarnos de limpiar AsyncStorage (por si había una rutina vieja cacheada) y establecer `cardState` en `'initial'`.
  6. Finalizar la carga global estableciendo `isFetchingData` en `false`.

## 3. UI y Componente Action Card (`src/components/features/home/ActionCard.tsx`)
- **Prevenir Parpadeos**: En el momento en el que el Home esté evaluando qué mostrar (`isFetchingData === true`), la `ActionCard` no debería mostrar el texto "No tienes planes activos".
- Se añadirá un estado transitorio o loader de "Buscando información..." o se le pasará a la tarjeta un prop `isLoadingInitial` para que muestre un esqueleto de carga / spinner hasta que el backend responda si hay o no rutina.

## 4. Optimización de la Vista Perfil (`app/(tabs)/profile.tsx`)
- Modificar el actual flujo del `useEffect` de los módulos activos.
- **Implementar Caché-First**:
  1. Leer `@active_modules` de `AsyncStorage`. Si existen, establecer `setActiveModules` y poner el estado de carga en `false` de inmediato. ¡El usuario verá sus módulos sin esperar!
  2. Lanzar la consulta a la API (`getActiveModules`) en segundo plano. Si la API responde con éxito, reemplazar el estado de módulos en memoria de la UI y actualizar `AsyncStorage` (Background Refresh). De este modo, si borró los datos de la app, el perfil igual recuperará todo mediante la API.

---

### ¿Cómo continuar?
Si estás de acuerdo con la estrategia (en especial con cómo se manejará el estado de carga visual en la tarjeta durante la verificación y el manejo del 404), confírmame y procedo a programar e implementar los archivos correspondientes.
