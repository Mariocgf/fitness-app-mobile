import {
  SessionExerciseDelta,
  SessionMetricDelta,
  TrainingHistoryExercise,
  TrainingHistorySession,
  TrainingSessionComparison,
} from '../types/training-history';

const DIRECTION_THRESHOLD = 0.001;

function computeDirection(diff: number): 'up' | 'down' | 'same' {
  if (Math.abs(diff) < DIRECTION_THRESHOLD) return 'same';
  return diff > 0 ? 'up' : 'down';
}

function buildDelta(
  key: string,
  label: string,
  unit: string,
  baseValue: number,
  targetValue: number,
): SessionMetricDelta {
  const diff = targetValue - baseValue;
  const percentChange = baseValue !== 0 ? (diff / baseValue) * 100 : null;
  return { key, label, unit, baseValue, targetValue, diff, percentChange, direction: computeDirection(diff) };
}

function exerciseVolume(ex: TrainingHistoryExercise): number {
  return ex.sets
    .filter((s) => s.isCompleted)
    .reduce((acc, s) => acc + s.weightUsed * s.repsPerformed, 0);
}

function exerciseMaxWeight(ex: TrainingHistoryExercise): number {
  const completed = ex.sets.filter((s) => s.isCompleted && s.weightUsed > 0);
  if (completed.length === 0) return 0;
  return Math.max(...completed.map((s) => s.weightUsed));
}

function exerciseCompletedSets(ex: TrainingHistoryExercise): number {
  return ex.sets.filter((s) => s.isCompleted).length;
}

function sessionTotalVolume(session: TrainingHistorySession): number {
  return session.exercises.reduce((acc, ex) => acc + exerciseVolume(ex), 0);
}

function sessionTotalCompletedSets(session: TrainingHistorySession): number {
  return session.exercises.reduce((acc, ex) => acc + exerciseCompletedSets(ex), 0);
}

/**
 * Calcula los deltas de resumen y por ejercicio entre dos sesiones de entrenamiento.
 * El ejercicio base se "compara contra" el ejercicio objetivo.
 * Solo incluye ejercicios presentes en ambas sesiones (match por exerciseId).
 */
export function buildTrainingSessionComparison(
  base: TrainingHistorySession,
  target: TrainingHistorySession,
): TrainingSessionComparison {
  const summaryDeltas: SessionMetricDelta[] = [
    buildDelta('duration', 'Duración', 's', base.totalSeconds, target.totalSeconds),
    buildDelta('exercises', 'Ejercicios', '', base.exercises.length, target.exercises.length),
    buildDelta('completedSets', 'Sets completados', '', sessionTotalCompletedSets(base), sessionTotalCompletedSets(target)),
    buildDelta('totalVolume', 'Volumen total', 'kg', sessionTotalVolume(base), sessionTotalVolume(target)),
  ];

  const exerciseDeltas: SessionExerciseDelta[] = [];

  for (const baseEx of base.exercises) {
    const targetEx = target.exercises.find((e) => e.exerciseId === baseEx.exerciseId);
    if (!targetEx) continue;

    const metrics: SessionMetricDelta[] = [
      buildDelta('volume', 'Volumen', 'kg', exerciseVolume(baseEx), exerciseVolume(targetEx)),
      buildDelta('maxWeight', 'Peso máximo', 'kg', exerciseMaxWeight(baseEx), exerciseMaxWeight(targetEx)),
      buildDelta('completedSets', 'Sets completados', '', exerciseCompletedSets(baseEx), exerciseCompletedSets(targetEx)),
    ];

    if (baseEx.rpe > 0 && targetEx.rpe > 0) {
      metrics.push(buildDelta('rpe', 'RPE', '', baseEx.rpe, targetEx.rpe));
    }

    exerciseDeltas.push({
      exerciseId: baseEx.exerciseId,
      exerciseName: baseEx.exerciseName,
      exerciseNameEs: baseEx.exerciseNameEs,
      metrics,
    });
  }

  return { base, target, summaryDeltas, exerciseDeltas };
}
