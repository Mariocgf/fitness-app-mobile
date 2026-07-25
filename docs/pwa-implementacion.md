# Documentación técnica — Soporte Web y PWA

Período: 02/07/2026 – 07/07/2026. Rama de trabajo: `pwa`.

## Objetivo del bloque

Que la aplicación, hasta ese momento solo nativa (Android/iOS vía Expo), corra en el navegador y sea instalable como PWA, sin romper el build nativo y conservando el uso offline.

## Precondición

La app corre en Android/iOS. Ya tiene `react-native-web` como dependencia y exporta estático (`web.output: "static"`), pero nunca se había abierto en un navegador. La capa offline (SQLite) y el login social ya funcionan en nativo.

---

## Tarea: Análisis de viabilidad y plan de fases

**Objetivo:** Saber qué impide que la app corra en web y qué falta para ser PWA, antes de tocar una línea de código.

**Resultado del análisis:**

1. La app **ya corría** sobre `react-native-web`. El problema no era el framework, sino las APIs nativas sin equivalente en el navegador.
2. Los bloqueadores se verificaron leyendo el código real de las librerías instaladas, no su documentación. Dos supuestos iniciales resultaron falsos y se corrigieron antes de implementar (ver Lecciones 1 y 2).
3. Se fijó una **regla de plataforma**: toda diferencia web/nativo se resuelve con archivos separados por extensión (`Componente.tsx` nativo / `Componente.web.tsx` web). El empaquetador elige el archivo en tiempo de build, así que el bundle nativo nunca ve el código web. El riesgo de romper iOS/Android queda en cero por construcción, no por cuidado del programador.

**Entregable:** plan en 6 fases, cada una entregable por separado y con criterio de aceptación propio.

**Postcondición:** existe una lista verificada de bloqueadores reales y un orden de ataque. Se descartó la opción "web sin offline" (más rápida) a favor de offline real en el navegador, para mantener paridad con nativo.

---

## Tarea: Desbloqueo de las APIs nativas en web (Fases 1 a 3)

**Objetivo:** Que ninguna pantalla se caiga en el navegador por usar una API que solo existe en el celular.

**Precondición:** Plan de fases aprobado.

**Partes:**

1. **Sesión (Fase 1).** El almacenamiento seguro del token no existe en web. Se reemplazó el objeto propio por el que ya provee el SDK de autenticación, que en nativo usa el llavero del sistema y en web se desactiva solo. La sesión web la persiste el navegador por cookies.
2. **Base de datos offline (Fase 2).** La librería de SQLite **sí** trae versión web (WebAssembly sobre el sistema de archivos privado del navegador). Se habilitó, con dos ajustes: registrar el formato `.wasm` en el empaquetador, y detectar por adelantado si el navegador soporta el almacenamiento para degradar con un error claro en vez del error críptico de la librería.
3. **Funciones sin equivalente (Fase 3).** El escáner de códigos de barras se oculta en web (queda la búsqueda manual, que ya era la vista por defecto). La vibración se desactiva. El audio y la voz de sesión se dejaron activos: funcionan vía las APIs del navegador y la sesión arranca con un toque del usuario, que es lo que exige el navegador para permitir sonido.

**Postcondición:** la app abre en el navegador y ninguna pantalla se cae. El comportamiento nativo queda idéntico.

---

## Tarea: Convertir el sitio en PWA instalable (Fase 4)

**Objetivo:** Que el navegador reconozca la app como instalable y que abra sin conexión.

**Precondición:** La app corre en web sin errores.

**Partes:**

1. **Manifiesto** (`public/manifest.json`): nombre, ícono, color de tema, `display: standalone` y arranque en la raíz. Es lo que convierte una web en "app instalable".
2. **Íconos**: se generaron con un script propio a partir del ícono existente, incluyendo el ícono *maskable* (contenido al 80% centrado sobre fondo sólido) que exige Android para no recortar el logo.
3. **Cabecera HTML** (`app/+html.tsx`): enlaza el manifiesto, las metas de Apple y el color de tema. Registra el service worker.
4. **Service worker** (`public/sw.js`): guarda en caché el armazón de la app y los archivos estáticos. **Decisión de alcance: no cachea la API.** El offline de datos ya lo resuelve la base de datos local; cachear también las respuestas del servidor habría duplicado la lógica de sincronización con dos fuentes de verdad.

**Postcondición:** el navegador ofrece instalar la app y el manifiesto valida sin errores.

---

## Tarea: Adaptación de componentes que se veían bien en nativo y se rompían en web (Fase 6)

**Objetivo:** Corregir los defectos que solo aparecen al abrir la app en un navegador real.

**Precondición:** La PWA instala y abre. Todas las validaciones automáticas (tipos, linter, export) pasaban en verde.

**Origen:** Todos estos defectos los reportó la prueba manual en el navegador. Ninguno lo detectó una validación automática, porque no son errores de tipos ni de empaquetado: son errores de comportamiento en tiempo de ejecución.

| Qué se rompió | Por qué | Corrección |
|---|---|---|
| **Selector de fecha** (nacimiento, y los 4 formularios de Salud) | La librería de calendario no tiene versión web. El campo directamente no se dibujaba. | Se creó el componente `DatePickerField` con archivo web propio que usa el `<input type="date">` del navegador. Los 4 formularios pasaron a usarlo. |
| **Selectores de peso y altura** | La librería de rueda se dibuja en web como una lista desplegable con fondo blanco, y el texto era blanco: **texto invisible sobre fondo blanco**. | Archivo web propio que reemplaza la rueda por un deslizador (`<input type="range">`), que es la forma natural de elegir un número en un rango en el navegador. |
| **Cuenta regresiva de inicio de sesión** | La animación no se reproducía en web y su evento de "terminó" nunca disparaba, así que **la sesión no arrancaba**. | Primer intento: cuenta regresiva numérica propia (funcionaba, pero perdía la animación). Segundo intento (el que quedó): la librería de animación equivalente para web, más un temporizador de respaldo por si el evento de fin no dispara. |
| **Migraciones de la base offline** | La función que envuelve las migraciones lanza explícitamente "no soportado en web": usa una conexión separada que el motor web no permite. La capa offline reventaba al abrir la base. | Se separó la transacción por plataforma: nativo queda idéntico; web usa la transacción común. Es seguro porque las migraciones corren al abrir la base, antes de que haya concurrencia. |
| **Franja negra bajo la barra de pestañas** | El navegador no pinta el área segura inferior del teléfono y quedaba una banda negra. | Relleno pintado con el valor real del navegador (`env(safe-area-inset-bottom)`), fuera de la barra para que nada lo recorte. |
| **App estirada en escritorio** | El layout está pensado para pantalla de celular. | Contenedor centrado de ancho máximo (~480 px) solo en web. |

**Regla que salió de acá (van 3 casos iguales):** las APIs de interfaz nativas sin buena versión web se resuelven con un archivo `.web.tsx` que usa el equivalente del navegador. **No** se intenta estilar el componente nativo para que "se vea bien" en web. Y al degradar una API nativa, hay que buscar **todos** los consumidores: si son 3 o más, se atomiza el componente en vez de repetir el arreglo inline.

**Postcondición:** todos los formularios y la sesión de entrenamiento funcionan en el navegador. El bundle nativo no importa ninguno de los reemplazos web.

---

## Tarea: Offline real en la PWA

**Objetivo:** Que la PWA instalada abra y permita entrenar sin conexión, igual que la app nativa.

**Precondición:** La PWA instala y la base de datos local persiste en el navegador.

**Origen:** Esta tarea fue enteramente prueba y error. Cada versión del service worker salió de cortar la red y ver qué fallaba.

**Iteraciones:**

1. **v1 — pantalla en blanco.** El service worker cacheaba solo el HTML. Sin red, el HTML abría pero el código de la app faltaba y quedaba en blanco. **Causa:** un service worker recién instalado **no controla la carga que lo instaló**, así que en la primera visita nunca llegaba a cachear el código. **Corrección:** en la instalación se leen los nombres de los archivos desde el propio HTML (el nombre cambia en cada build, no se puede escribir a mano) y se cachean junto con él.
2. **v2 — código viejo.** El HTML quedaba congelado en el momento de la instalación, apuntando a una versión anterior del código. **Corrección:** cada visita con conexión refresca el HTML cacheado, así sin red siempre se sirve el último despliegue.
3. **v3 — se borraba la rutina descargada.** Al abrir la app sin conexión, el sistema de login nunca termina de cargar (se descarga del servidor). El arranque interpretaba "sin sesión" como **cierre de sesión** y borraba la base offline. Sin red pasaba **siempre**. **Corrección:** solo se trata como cierre de sesión real cuando el sistema de login **ya confirmó** que no hay sesión. Además se agregó un permiso de entrada sin red: si el dispositivo tiene una rutina descargada, el usuario ya estaba autenticado en él, así que se lo deja pasar.

**Postcondición:** la PWA instalada abre sin conexión, con el último código desplegado, conserva la rutina descargada y permite iniciar y registrar un entrenamiento.

---

## Tarea: Paso de instalación guiado

**Objetivo:** Ofrecerle al usuario instalar la app en vez de esperar que descubra el menú del navegador.

**Precondición:** El manifiesto es válido y el navegador considera la app instalable.

**Hallazgo:** hay una asimetría entre plataformas que no se puede programar alrededor. Chrome y Edge (Android y escritorio) avisan que la app es instalable mediante un evento, que se captura y se relanza con un botón. **Apple nunca implementó ese evento**: en iOS es imposible instalar por código, el usuario sí o sí tiene que ir a Compartir → "Añadir a inicio".

**Qué se hizo:** un componente con dos modos — botón "Instalar app" en Chrome/Edge, e instrucciones manuales en iOS. No se muestra si la app ya está instalada, y si el usuario lo descarta no vuelve a aparecer por 7 días.

**Postcondición:** el usuario recibe la vía de instalación real de su plataforma. En iOS se documenta la limitación en vez de prometer algo que Apple no permite.

---

## Tarea: Despliegue de la PWA en Vercel

**Objetivo:** Servir la PWA sobre HTTPS con una dirección pública estable.

**Precondición:** El export web genera el manifiesto, el service worker y los íconos en la raíz.

**Pasos:**

1. Se agregó el script de build web y la configuración de Vercel: comando de build, directorio de salida y **reescritura de todas las rutas al HTML raíz** (sin esto, entrar directo a una URL interna da 404, porque el enrutamiento es del lado del cliente).
2. Se subió el repositorio; Vercel detecta el cambio y despliega automáticamente.

**Nota:** HTTPS no es opcional. El service worker y el almacenamiento de la base offline solo funcionan en contexto seguro. Es requisito, no una mejora.

**Postcondición:** la PWA queda accesible y instalable desde una URL pública.

---

## Tarea: Arreglo del login social en la PWA

**Síntoma:** el usuario completaba el flujo de Google, volvía a la app y seguía sin sesión.

**Causa raíz (lado app):** al volver de Google, la ventana emergente aterrizaba en la app completa en lugar de cerrar el flujo. La sesión quedaba atrapada en esa ventana y nunca volvía a la original.

**Qué se hizo:** se creó una ruta de retorno dedicada (`/sso-callback`) cuya única función es cerrar la ventana emergente y devolver la sesión a la ventana que inició el flujo. Se apuntó el retorno del login a esa ruta y se excluyó del redirector automático, para que no mande a `/login` antes de que el flujo termine.

**Defecto derivado:** en la PWA instalada en el celular, si el usuario **cerraba** la ventana de Google sin completar, el botón quedaba en "Ingresando…" para siempre, porque el flujo nunca resolvía. **Corrección:** al volver a la app se le da un margen a que la sesión se active; si sigue sin sesión, se libera el botón.

> La configuración de entorno de este mismo problema (instancia de producción, dominio propio, DNS y consentimiento de Google) está documentada aparte, en la tarea "Arreglo del login social en producción". Acá solo se documenta la parte de la aplicación.

---

## Lecciones aprendidas

1. **La documentación de una librería puede mentir; su código no.** El plan asumía que la configuración del proyecto generaba el manifiesto automáticamente. Es cierto solo con el empaquetador antiguo; con el actual esos campos se ignoran. Escribirlos habría sido **configuración muerta silenciosa**: sin error, sin efecto. Se verificó en el código instalado y el manifiesto se escribió a mano.
2. **Un diagnóstico sin verificar cuesta trabajo inútil.** El análisis dio por bloqueante el almacenamiento seguro del token en web. Al leer el SDK, resultaba que en web ese objeto se ignora por completo: era configuración muerta, no un bloqueante. Verificar primero evitó "arreglar" algo que no estaba roto.
3. **Las validaciones automáticas no prueban que la app funcione.** Tipos, linter y export validan estructura y empaquetado, **no comportamiento**. Todos los defectos de la Fase 6 pasaron esas tres validaciones en verde y aparecieron recién al abrir el navegador. La prueba manual no es opcional: es el único carril que encuentra esta clase de error.
4. **Sin red no se puede confiar en lo que se descarga del servidor.** El bug más caro (borrar la rutina descargada en cada apertura offline) salió de asumir que el sistema de login siempre carga. Todo lo remoto tiene tres estados —cargando, sí, no— y colapsar "cargando" con "no" destruye datos.
5. **Separar por archivo es más barato que separar por condición.** Resolver las diferencias con archivos `.web.tsx` en vez de condicionales dispersos mantuvo el riesgo nativo en cero de forma verificable, y dejó cada plataforma legible por separado.
6. **Hay límites de plataforma que no son deuda técnica.** La instalación automática en iOS no existe. Corresponde documentar la limitación, no dejarla como pendiente abierto que nadie va a poder cerrar.

---

## Estado final y pendientes

**Cumplido:** la app corre en el navegador, instala como PWA en Android/escritorio (y en iOS por "Añadir a inicio"), abre y permite entrenar sin conexión, y está desplegada sobre HTTPS. El build nativo no cambió de comportamiento.

**Pendientes:**

- Regresión nativa completa en dispositivo (Android/iOS) tras los cambios de plataforma.
- Validar el comportamiento de la base offline con varias pestañas abiertas a la vez.
- El plan original (`docs/pwa-web-support-plan.md`) fue **borrado por error** en un commit posterior de otra funcionalidad (`feat: fase 0 - fundamentos`). El service worker todavía lo referencia en sus comentarios. Recuperarlo del historial o actualizar la referencia.
