import { WeightInventoryResponse } from '../../services/equipment.service';
import { getWeightOptions } from '../weight.utils';

/** Inventario real del usuario: el inventario habla inglés, la API de ejercicios español. */
const inventory: WeightInventoryResponse = {
  plateCombinations: [
    {
      apiFamilyIdentifier: 'barbell',
      symmetryMultiplier: 2,
      baseWeight: 20,
      achievableWeights: [20, 25, 30],
    },
    {
      apiFamilyIdentifier: 'dumbbell',
      symmetryMultiplier: 2,
      baseWeight: 2,
      achievableWeights: [2, 7, 12],
    },
    {
      apiFamilyIdentifier: 'weighted',
      symmetryMultiplier: 1,
      baseWeight: 0,
      achievableWeights: [2.5, 5, 10],
    },
  ],
  dumbbellWeights: [],
};

const bodyweightOnly = [{ label: 'Peso corporal', value: null }];

describe('getWeightOptions', () => {
  it('devuelve solo peso corporal cuando no hay equipo o no hay inventario', () => {
    expect(getWeightOptions(undefined, inventory)).toEqual(bodyweightOnly);
    expect(getWeightOptions([], inventory)).toEqual(bodyweightOnly);
    expect(getWeightOptions(['Mancuerna'], null)).toEqual(bodyweightOnly);
  });

  it('traduce la etiqueta en español a la familia del inventario', () => {
    expect(getWeightOptions(['Mancuerna'], inventory)).toEqual([
      { label: 'Peso corporal', value: null },
      { label: '2 kg (sin discos)', value: 2 },
      { label: '7 kg', value: 7 },
      { label: '12 kg', value: 12 },
    ]);
  });

  it('ignora las aclaraciones entre paréntesis', () => {
    expect(getWeightOptions(['Mancuerna (usada como agarre para mayor rango)'], inventory))
      .toEqual(getWeightOptions(['Mancuerna'], inventory));
  });

  it('separa las etiquetas compuestas por coma', () => {
    // "pelota de ejercicio" no aporta peso; la mancuerna sí.
    expect(getWeightOptions(['Mancuerna, pelota de ejercicio, pelota de tenis'], inventory))
      .toEqual(getWeightOptions(['Mancuerna'], inventory));
  });

  it('no deja que un equipo sin carga tape a los que sí la tienen', () => {
    expect(getWeightOptions(['Peso corporal', 'Mancuerna'], inventory))
      .toEqual(getWeightOptions(['Mancuerna'], inventory));
  });

  it('devuelve solo peso corporal si ningún equipo del ejercicio tiene carga', () => {
    expect(getWeightOptions(['Peso corporal'], inventory)).toEqual(bodyweightOnly);
    expect(getWeightOptions(['Peso corporal (con banda de resistencia)'], inventory))
      .toEqual(bodyweightOnly);
    expect(getWeightOptions(['Cable'], inventory)).toEqual(bodyweightOnly);
  });

  it('une los pesos de todos los equipos, ordenados y sin duplicados', () => {
    expect(getWeightOptions(['Barra', 'Mancuerna'], inventory)).toEqual([
      { label: 'Peso corporal', value: null },
      { label: '2 kg (sin discos)', value: 2 },
      { label: '7 kg', value: 7 },
      { label: '12 kg', value: 12 },
      { label: '20 kg (sin discos)', value: 20 },
      { label: '25 kg', value: 25 },
      { label: '30 kg', value: 30 },
    ]);
  });

  it('mapea "Con peso adicional" a la familia weighted (baseWeight 0)', () => {
    expect(getWeightOptions(['Con peso adicional'], inventory)).toEqual([
      { label: 'Peso corporal', value: null },
      { label: '2.5 kg', value: 2.5 },
      { label: '5 kg', value: 5 },
      { label: '10 kg', value: 10 },
    ]);
  });

  it('sigue aceptando familias en inglés (rutinas y borradores previos al cambio)', () => {
    expect(getWeightOptions(['body weight', 'dumbbell'], inventory))
      .toEqual(getWeightOptions(['Mancuerna'], inventory));
  });
});
