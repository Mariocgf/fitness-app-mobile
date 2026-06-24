import {
  ComparisonVerdict,
  ExerciseHeadlineKind,
  SessionExerciseDelta,
  SessionMetricDelta,
  SessionSetSnapshot,
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
 * Set representativo de un ejercicio: el set completado de mayor peso
 * (desempate por más repeticiones). Si no hay sets completados, usa el primero.
 */
function topSet(ex: TrainingHistoryExercise): SessionSetSnapshot {
  const completed = ex.sets.filter((s) => s.isCompleted);
  const pool = completed.length > 0 ? completed : ex.sets;
  if (pool.length === 0) return { weight: 0, reps: 0 };
  const best = pool.reduce((a, b) => {
    if (b.weightUsed !== a.weightUsed) return b.weightUsed > a.weightUsed ? b : a;
    return b.repsPerformed > a.repsPerformed ? b : a;
  });
  return { weight: best.weightUsed, reps: best.repsPerformed };
}

/** Compara los top sets de un ejercicio y arma el delta destacado (peso o reps). */
function buildExerciseDelta(
  baseEx: TrainingHistoryExercise,
  targetEx: TrainingHistoryExercise,
): SessionExerciseDelta {
  const baseTopSet = topSet(baseEx);
  const targetTopSet = topSet(targetEx);

  let headlineKind: ExerciseHeadlineKind = 'none';
  let headlineDiff = 0;
  if (targetTopSet.weight !== baseTopSet.weight) {
    headlineKind = 'weight';
    headlineDiff = targetTopSet.weight - baseTopSet.weight;
  } else if (targetTopSet.reps !== baseTopSet.reps) {
    headlineKind = 'reps';
    headlineDiff = targetTopSet.reps - baseTopSet.reps;
  }

  return {
    exerciseId: baseEx.exerciseId,
    exerciseName: baseEx.exerciseName,
    exerciseNameEs: baseEx.exerciseNameEs,
    baseTopSet,
    targetTopSet,
    headlineKind,
    headlineDiff,
  };
}

/** Veredicto general: pesa series completadas y volumen (la duración es neutra). */
function computeOverall(completedSetsDiff: number, volumeDiff: number): ComparisonVerdict {
  let improvements = 0;
  let regressions = 0;
  for (const diff of [completedSetsDiff, volumeDiff]) {
    if (diff > DIRECTION_THRESHOLD) improvements += 1;
    else if (diff < -DIRECTION_THRESHOLD) regressions += 1;
  }
  if (improvements > regressions) return 'better';
  if (regressions > improvements) return 'worse';
  return 'similar';
}

/**
 * Calcula los deltas de resumen y por ejercicio entre dos sesiones de entrenamiento.
 * Las sesiones se ordenan cronológicamente: `base` es la más antigua y `target` la más
 * reciente, así el diff siempre representa la evolución "anterior → actual".
 * Solo incluye ejercicios presentes en ambas sesiones (match por exerciseId).
 */
export function buildTrainingSessionComparison(
  a: TrainingHistorySession,
  b: TrainingHistorySession,
): TrainingSessionComparison {
  const [base, target] =
    a.trainedAt.getTime() <= b.trainedAt.getTime() ? [a, b] : [b, a];

  const baseCompletedSets = sessionTotalCompletedSets(base);
  const targetCompletedSets = sessionTotalCompletedSets(target);
  const baseVolume = sessionTotalVolume(base);
  const targetVolume = sessionTotalVolume(target);

  const summaryDeltas: SessionMetricDelta[] = [
    buildDelta('duration', 'Duración', 's', base.totalSeconds, target.totalSeconds),
    buildDelta('completedSets', 'Series completadas', '', baseCompletedSets, targetCompletedSets),
    buildDelta('totalVolume', 'Volumen total', 'kg', baseVolume, targetVolume),
  ];

  const exerciseDeltas: SessionExerciseDelta[] = [];
  for (const baseEx of base.exercises) {
    const targetEx = target.exercises.find((e) => e.exerciseId === baseEx.exerciseId);
    if (!targetEx) continue;
    exerciseDeltas.push(buildExerciseDelta(baseEx, targetEx));
  }

  const overall = computeOverall(
    targetCompletedSets - baseCompletedSets,
    targetVolume - baseVolume,
  );

  return { base, target, overall, summaryDeltas, exerciseDeltas };
}
