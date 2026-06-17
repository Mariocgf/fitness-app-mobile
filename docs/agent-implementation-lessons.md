# Lecciones obligatorias antes de implementar

Este archivo registra errores cometidos durante la implementación para no repetirlos. Antes de tocar código de features, leer esta checklist y verificar contra el código real.

## Checklist rápida

- [ ] Verificar la forma real de las respuestas del backend: plana vs `{ data: ... }`.
- [ ] No poner funciones inestables (`getToken`, callbacks de storage, navigation handlers) como dependencias de effects que hacen `setState`.
- [ ] No duplicar fetch inicial con `useEffect` + `useFocusEffect` salvo que haya una razón explícita.
- [ ] No usar funciones como default param de hooks si ese valor participa en dependencias; fijarlo con `useRef`.
- [ ] No montar modales/sheets pesados si están cerrados; renderizarlos condicionalmente cuando `visible === true`.
- [ ] No envolver controles con gestos propios (`ScrollView`, sliders, ruler pickers) dentro del mismo `Pressable` que los abre.
- [ ] En effects que limpian arrays, no hacer `setState([])` en cada render; eso crea una referencia nueva y puede alimentar loops.
- [ ] Si `profile` llega pero `target/day` faltan, renderizar con fallback razonable, no bloquear la UI.
- [ ] No “arreglar” warnings de ESLint cambiando dependencias sin revisar el comportamiento runtime.
- [ ] No implementar solo la pantalla principal si el contrato también incluye onboarding o configuración.

## Errores cometidos y corrección

| Error | Qué pasó | Corrección aplicada |
|---|---|---|
| Onboarding Nutrition incompleto | Se implementó dashboard/registro, pero faltaba el nuevo contenido de onboarding. | Se agregó paso de `activityLevel`, `subGoalId` singular y payload actualizado. |
| Loop de requests en onboarding | `NutritionConfigStep` tenía `getToken/loadNutritionConfig` en deps de un `useEffect` que hacía `setState`. | Se usaron refs estables y autosave solo después de hidratar el draft. |
| Loop de requests en pantalla Nutrition | `useNutritionDay` dependía de `getToken` y la pantalla duplicaba `refresh` con `useFocusEffect`. | `refresh` depende solo de `date`, usa `getTokenRef` y se removió el focus refresh duplicado. |
| “No hay datos para hoy” con profile válido | La UI exigía `day && target`, aunque el backend devolvía `profile`. | `profile` es obligatorio; `target` cae a fallback desde profile y `day` cae a día vacío. |
| Respuesta backend envuelta no contemplada | El service asumía DTO plano, pero el backend podía responder `{ data: ... }`. | Se agregó `unwrapApiData` en `nutrition.service.ts`. |
| Maximum update depth en registro de comidas | `useNutritionDay(date = getTodayDateKey())` evaluaba fecha durante render y alimentaba effects/callbacks. | La fecha default se fija una sola vez con `useRef`; callbacks externos se estabilizan. |
| Maximum update depth por sheet cerrado | `FoodSearchSheet` estaba montado aunque `visible=false`; `useFoodSearch` ejecutaba un effect con `getToken` inestable y hacía `setFoods([])` creando arrays nuevos. | El sheet se monta solo cuando está visible; `useFoodSearch` usa `getTokenRef` y evita setear arrays vacíos si ya están vacíos. |
| Marca de alimentos registrados inventable | El mock mostraba marca, pero `ConsumedFoodItemDto` no trae `brand`. | No se muestra marca hasta que backend extienda el DTO. |
| Scanner prometido sin soporte | El contrato mencionaba scanner, pero no había dependencia de cámara/barcode. | Acción queda placeholder/deshabilitada hasta fase específica. |
| Scanner real requiere configuración nativa | Para escanear códigos con Expo no alcanza con pintar el botón: hay que instalar `expo-camera`, configurar permiso en `app.json` y bloquear lecturas duplicadas mientras el backend responde. | Usar `CameraView` con `barcodeScannerSettings`, pedir permiso con `useCameraPermissions` y resolver el código con un hook estable contra `getFoodByBarcode`. |
| Barcode directo puede devolver 404 aunque el contrato exista | El controller tiene `GET /api/nutrition/foods/barcode/{code}`, pero puede devolver 404 si el alimento no está completo en catálogo o si el backend corriendo todavía no expone esa ruta. | En scanner, intentar `getFoodByBarcode` primero y ante fallo caer a `searchFoods(code)` para aprovechar la búsqueda por código ya soportada por el endpoint de catálogo. |
| Normalización de barcode demasiado agresiva rompe códigos válidos | Quitar ceros finales siempre puede eliminar un check digit real en EAN/UPC; no todo cero es padding. | Mantener el código original, generar variante UPC cuando EAN-13 viene con `0` inicial y solo recortar ceros finales/externos cuando el largo queda fuera de estándares normales. |
| `CameraView` sin alto visible | Se puso `className="h-96"` directamente en `CameraView`, pero al ser componente nativo de `expo-camera` NativeWind puede no aplicar esa clase y el preview queda sin caja visible. | Dar altura al `View` wrapper (`h-96`) y hacer que `CameraView` ocupe esa caja con `style={{ flex: 1 }}`. |
| Validación bloqueada por entorno, no por código | En Windows sandbox `npm`, `npx` o `node_modules/.bin/*.cmd` pueden fallar con “not recognized” o “Acceso denegado”, aunque el código compile. | Ejecutar binarios vía `node .\node_modules\...\bin\...` con escalación cuando el sandbox bloquee Node, y registrar claramente qué validación falló por errores preexistentes del repo. |
| `expo lint` puede dar falso OK si falta `npx` | En este entorno `node .\node_modules\expo\bin\cli lint` terminó con exit code 0 pero imprimió `"npx" no se reconoce...`, por lo que el lint real no corrió. | No confiar solo en el exit code de `expo lint`; ejecutar ESLint directo con `node .\node_modules\eslint\bin\eslint.js` para validar archivos tocados. |
| Git bloqueado por ownership dudoso | `git status/diff` puede fallar con “detected dubious ownership” si el repo pertenece a otro SID de Windows. | No asumir que no hay repo; usar `git -C` para confirmar el error y pedir/configurar `safe.directory` solo si hace falta operar con Git. |
| `git diff` sin contexto seguro | Se intentó revisar diff desde el shell y Git respondió como si no estuviera en repo; al validar con `git -C` apareció `dubious ownership`. | Antes de usar diff/status en este repo, confirmar ownership con `git -C <repo> status` y no perder tiempo interpretando el primer error como ausencia de repo. |
| RulerPicker bloqueado por `Pressable` padre | El selector de gramos se abría, pero no dejaba arrastrar porque el `Pressable` que lo disparaba seguía envolviendo el `ScrollView` horizontal y capturaba el gesto. | El `Pressable` queda solo para el estado cerrado; al abrir, el picker se renderiza dentro de un `View` y el `ScrollView` usa `nestedScrollEnabled`. |

## Regla de oro

NO codifiques por imagen ni por intuición. Primero verificá contrato, DTO real, estado actual del repo y dependencias. Después implementá. Si el backend devuelve algo útil parcialmente, la UI debe degradar con criterio, no esconder datos.

## Regla para controles interactivos anidados

Un control que necesita arrastrar, scrollear o seleccionar NO debe quedar dentro de un `Pressable` activo de la misma zona táctil. Usá este patrón:

1. Estado cerrado: `Pressable` chico que abre el control.
2. Estado abierto: contenedor pasivo (`View`) con el control interactivo adentro.
3. Si el control vive dentro de otro `ScrollView`, habilitar `nestedScrollEnabled` cuando aplique.

Esto evita pelearte con el responder system de React Native. La UI puede verse bien y aun así estar mal compuesta: si el gesto no llega al componente correcto, NO funciona.
