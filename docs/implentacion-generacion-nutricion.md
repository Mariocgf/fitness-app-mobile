# Contexto 
El usuario pide generar una rutina alimenticia generada por IA siguiendo los parametros de su perfil.

# Tarea
Generar una vista para la generacion y visulizacion de la rutina alimenticia y la implementacion de los servicios.

## Flujo vista home
1) Home muestra la tarjeta de rutina de nutricion, al precionar generar llama al backend para crear la rutina.
2) Cuando la rutina este generada, da la opcion de ver rutina, copiando el header de la vista de rutina de entrenamiento que tiene los dias arriba.
3) En la lista debe listar cada tipo de comida con su nombre y descripcion.
4) Al tocar el item de la lista, se genera una peticion para obtener el detalle de la misma. (Aca se debera crear una nueva vista para mostrar los datos, se detalla mas adelante)
5) El usuario una vez que realiza la comida la registra como alimento consumido y contar en su registro de consumo.

## Flujo vista nutricion
1) El usuario esta en vista de nutricion
2) Selecciona en el toggle de seleccion en la cual la opcion 1 muestra la vista inicial y la segunda opcion muestra el plan de nutricion
3) El sistema muestra el dia segun el dia actual y lista las comida del dia

# Estilos de vistas
## Vista nutricion (Plan diario)
Siguiendo la imagen proporcionada realizar la implementacion de la vista como se ve en la imagen.

### Consideraciones
- Las imagenes en los items no van.
- Las fechas en los dias tampoco, solo el dia
- Adaptar con los datos recibidos, no inventar nada ni agregar nada que no venga del backend.

## Vista de la comida
Siguiendo la imagen proporcionada realizar la implementacion de la vista como se ve en la imagen.

### Consideraciones
- Las imagenes no van.
- Es circulo de las calorias reutilizar el que ya esta en la vista principal de nutricion.
- El boton agregar al plan cambialo por Registar alimento (este lo registra en alimentos consumido).
- Informacion adicional no va, ya que no hay datos para eso.
- Adaptar con los datos recibidos, no inventar nada ni agregar nada que no venga del backend.