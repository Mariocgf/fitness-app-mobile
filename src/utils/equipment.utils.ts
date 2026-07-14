/**
 * Normaliza el equipamiento de un ejercicio a las "familias" canónicas que usa
 * el backend en `apiFamilyIdentifier` (weight-inventory).
 *
 * La API de ejercicios devuelve etiquetas de display en español, no identificadores:
 * vienen capitalizadas, con acentos, con aclaraciones entre paréntesis
 * ("Mancuerna (usada como agarre para mayor rango)") y con varios equipos en un
 * mismo string separados por coma ("Barra EZ, pelota de ejercicio"). El
 * weight-inventory, en cambio, sigue hablando inglés atómico ("barbell",
 * "dumbbell", "weighted"), así que sin esta traducción ningún equipo matchea.
 *
 * Esto es un puente, no un contrato: lo correcto es que la API de ejercicios
 * exponga el identificador de familia junto a la etiqueta traducible.
 */

const stripAccents = (value: string): string =>
  value.normalize('NFD').replace(/[̀-ͯ]/g, '');

/** minúsculas, sin acentos y sin las aclaraciones entre paréntesis */
const normalizeLabel = (value: string): string =>
  stripAccents(value.toLowerCase())
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Etiqueta en español (normalizada) → familia canónica en inglés. */
const FAMILY_BY_LABEL: Record<string, string> = {
  'asistido': 'assisted',
  'balon medicinal': 'medicine ball',
  'banda': 'band',
  'banda de resistencia': 'resistance band',
  'barra': 'barbell',
  'barra ez': 'ez barbell',
  'barra olimpica': 'olympic barbell',
  'barra trampa': 'trap bar',
  'bicicleta estatica': 'stationary bike',
  'bosu': 'bosu ball',
  'cable': 'cable',
  'con peso adicional': 'weighted',
  'cuerda': 'rope',
  'eliptica': 'elliptical machine',
  'ergometro de tren superior': 'upper body ergometer',
  'mancuerna': 'dumbbell',
  'maquina de escalones': 'stepmill machine',
  'maquina de palanca': 'leverage machine',
  'maquina hammer': 'hammer',
  'maquina skierg': 'skierg machine',
  'maquina smith': 'smith machine',
  'neumatico': 'tire',
  'pelota de ejercicio': 'stability ball',
  'pelota de estabilidad': 'stability ball',
  'pesa rusa': 'kettlebell',
  'peso corporal': 'body weight',
  'rodillo': 'roller',
  'rueda abdominal': 'wheel roller',
  'trineo': 'sled machine',
};

/** Las rutinas y borradores guardados antes del cambio de idioma ya traen la familia en inglés. */
const KNOWN_FAMILIES = new Set(Object.values(FAMILY_BY_LABEL));

/**
 * Traduce una etiqueta de equipamiento a sus familias canónicas.
 * Un string puede contener varios equipos ("Mancuerna, pelota de ejercicio").
 * Las etiquetas desconocidas se descartan: no aportan peso.
 */
export const toEquipmentFamilies = (label: string): string[] =>
  label
    .split(',')
    .map(normalizeLabel)
    .filter(Boolean)
    .map((part) => FAMILY_BY_LABEL[part] ?? (KNOWN_FAMILIES.has(part) ? part : null))
    .filter((family): family is string => family !== null);
