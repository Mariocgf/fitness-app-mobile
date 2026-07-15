import { EFFORT_OPTIONS, MAX_RPE, MIN_RPE, averageRpe, effortLabelFor } from '../rpe';

describe('rpe.averageRpe', () => {
  it('debe devolver null cuando no hay ningún esfuerzo registrado', () => {
    // Sin dato no hay ajuste: el contrato exige un RPE y NO se inventa uno.
    expect(averageRpe([])).toBeNull();
    expect(averageRpe([null, null, null])).toBeNull();
  });

  it('debe ignorar los null en vez de promediarlos como 0', () => {
    // Si los null contaran como 0, el promedio de (8, 8, null) daría 5 en vez de 8.
    expect(averageRpe([8, 8, null])).toBe(8);
  });

  it('debe redondear el promedio de los sets con dato', () => {
    // El ejemplo del contrato: promedio(8, 8, 10) = 8.67 → 9.
    expect(averageRpe([8, 8, 10, null])).toBe(9);
  });

  it('debe devolver siempre un valor dentro del rango válido del contrato', () => {
    const result = averageRpe([10, 10, 10]);

    expect(result).toBeGreaterThanOrEqual(MIN_RPE);
    expect(result).toBeLessThanOrEqual(MAX_RPE);
  });
});

describe('rpe.EFFORT_OPTIONS', () => {
  it('debe mapear las 4 categorías a los valores del contrato', () => {
    expect(EFFORT_OPTIONS.map((option) => [option.label, option.value])).toEqual([
      ['Suave', 4],
      ['Justo', 6],
      ['Duro', 8],
      ['Al fallo', 10],
    ]);
  });

  it('no debe permitir elegir un 0: dejó de ser un valor válido', () => {
    expect(EFFORT_OPTIONS.every((option) => option.value >= MIN_RPE && option.value <= MAX_RPE)).toBe(true);
  });

  it('debe destacar una sola opción, pero ninguna viene preseleccionada', () => {
    // `emphasized` es solo tamaño/visibilidad. La ausencia de un valor por defecto se
    // garantiza en el selector (value = null hasta que el usuario toca algo).
    expect(EFFORT_OPTIONS.filter((option) => option.emphasized)).toHaveLength(1);
  });
});

describe('rpe.effortLabelFor', () => {
  it('debe devolver null cuando no hay esfuerzo registrado', () => {
    // Sin dato no hay etiqueta: el consumidor decide cómo decir la ausencia.
    expect(effortLabelFor(null)).toBeNull();
  });

  it('debe devolver la etiqueta exacta de cada opción de la escala', () => {
    expect(effortLabelFor(4)).toBe('Suave');
    expect(effortLabelFor(6)).toBe('Justo');
    expect(effortLabelFor(8)).toBe('Duro');
    expect(effortLabelFor(10)).toBe('Al fallo');
  });

  it('debe mapear a la categoría más cercana los valores que no están en la escala', () => {
    // Datos viejos o promedios de sesión pueden caer entre dos opciones.
    expect(effortLabelFor(1)).toBe('Suave');
    expect(effortLabelFor(3)).toBe('Suave');
  });

  it('ante un empate debe elegir la categoría MÁS SUAVE', () => {
    // Nunca atribuirle al usuario más esfuerzo del que el dato sostiene.
    expect(effortLabelFor(5)).toBe('Suave'); // empata entre Suave(4) y Justo(6)
    expect(effortLabelFor(7)).toBe('Justo'); // empata entre Justo(6) y Duro(8)
    expect(effortLabelFor(9)).toBe('Duro'); // empata entre Duro(8) y Al fallo(10)
  });
});
