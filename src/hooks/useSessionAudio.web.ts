/**
 * Versión WEB de `useSessionAudio` (Metro resuelve este archivo en lugar del nativo).
 *
 * El hook nativo usa `expo-av`, que en web se traduce a un `<audio>` con un WAV en
 * base64 y un `play()`. Eso falla en la PWA: `HTMLMediaElement.play()` devuelve una
 * promesa rechazada (`NotAllowedError`) si el navegador no considera desbloqueado el
 * audio, y `expo-av` no expone ese error → los beeps simplemente nunca sonaban.
 *
 * Acá se usa la Web Audio API directamente:
 * - Un único `AudioContext` compartido, creado perezosamente.
 * - Se lo "desbloquea" (`resume()` + buffer mudo) con el PRIMER gesto del usuario. Es lo
 *   que exigen Chrome/Safari: el resume tiene que salir de un handler de gesto real, no
 *   de un `setTimeout` ni de un `useEffect`.
 * - Los beeps se sintetizan con un oscilador: cero latencia de carga y timing exacto,
 *   que es justo lo que necesita una cuenta regresiva de 3-2-1.
 *
 * ACÁ NO SE USA SÍNTESIS DE VOZ. `speechSynthesis` (vía `expo-speech`) en la PWA de
 * Android baja al motor TTS del sistema, que pide foco de audio y PAUSA lo que el
 * usuario esté escuchando: Spotify, YouTube Music, un podcast. No es configurable —
 * la Web Speech API no expone control de foco de audio. Los osciladores de Web Audio,
 * en cambio, conviven con el audio de fondo. Por eso TODAS las alertas de esta versión
 * son tonos sintetizados.
 */
import { logger } from '@/src/utils/logger';
import { useEffect, useRef } from 'react';
import { Phase } from './useActiveSession';

interface UseSessionAudioProps {
  /** Tiempo restante del cronómetro activo (REST o EXERCISE timed). null si no aplica. */
  timeLeft: number | null;
  /** Fase actual de la sesión */
  phase: Phase;
}

const UNLOCK_EVENTS = ['pointerdown', 'touchend', 'keydown'] as const;

let audioContext: AudioContext | null = null;
let isUnlocked = false;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (audioContext) return audioContext;

  const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
  if (!Ctor) return null;

  try {
    audioContext = new Ctor();
    return audioContext;
  } catch (error) {
    logger.warn('[useSessionAudio.web] No se pudo crear el AudioContext:', error);
    return null;
  }
}

/**
 * Desbloquea el audio del navegador. DEBE llamarse desde un gesto del usuario.
 * Además del `resume()`, reproduce un buffer mudo: es el truco que necesita Safari/iOS
 * para marcar el contexto como habilitado.
 */
function unlockAudio(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  void ctx.resume().catch(() => {});

  try {
    const source = ctx.createBufferSource();
    source.buffer = ctx.createBuffer(1, 1, ctx.sampleRate);
    source.connect(ctx.destination);
    source.start(0);
  } catch {
    /* Si el buffer mudo falla, el `resume()` de arriba ya cubre Chrome. */
  }

  /* Ojo: acá NO va un warmup de `speechSynthesis`. Esa utterance muda era la que
     cortaba la música al empezar el primer descanso — el motor TTS toma el foco de
     audio aunque la utterance sea silenciosa. */

  isUnlocked = true;
}

/**
 * Sintetiza un beep. El envelope replica al del hook nativo: arranca en `volume` y cae
 * a silencio a mitad de la duración, así el 3-2-1 suena seco y no arrastra cola.
 *
 * `startOffsetSec` agenda el beep a futuro sobre el reloj del `AudioContext` (no con
 * `setTimeout`), que es lo que permite encadenar dos tonos con separación exacta.
 */
function playBeep(
  frequency: number,
  durationMs: number,
  volume: number,
  startOffsetSec = 0,
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  /* Si el contexto quedó suspendido (cambio de pestaña, política del navegador) se
     reintenta: sin esto el oscilador arranca y no suena nada. */
  if (ctx.state === 'suspended') void ctx.resume().catch(() => {});

  try {
    const start = ctx.currentTime + startOffsetSec;
    const durationSec = durationMs / 1000;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);

    gain.gain.setValueAtTime(volume, start);
    gain.gain.linearRampToValueAtTime(0.0001, start + durationSec / 2);

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    oscillator.start(start);
    oscillator.stop(start + durationSec);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  } catch (error) {
    logger.warn('[useSessionAudio.web] Error reproduciendo beep:', error);
  }
}

/**
 * Aviso de "quedan 10 segundos": dos toques cortos y graves (660 Hz), separados 220 ms.
 *
 * Reemplaza al `Speech.speak('Quedan 10 segundos')` que tenía esta versión. Ese era el
 * que frenaba la música del celular en cada descanso al llegar a 10 (ver cabecera del
 * archivo). El patrón de dos tonos graves no se confunde con el 880 Hz seco del 3-2-1
 * ni con el 440 Hz sostenido del final.
 */
function playTenSecondsCue(): void {
  playBeep(660, 140, 0.55);
  playBeep(660, 140, 0.55, 0.22);
}

/**
 * Hook que reacciona al tiempo restante de un cronómetro y emite alertas auditivas:
 * - 10 s → doble toque grave (660 Hz × 2). En nativo esto es la voz "Quedan 10
 *   segundos"; en web se usa un tono para no frenar la música del celular.
 * - 3, 2, 1 s → beep corto (880 Hz, 200 ms)
 * - 0 s → beep sostenido final (440 Hz, 800 ms)
 */
export function useSessionAudio({ timeLeft, phase }: UseSessionAudioProps): void {
  /* Refs de guardia para evitar disparos duplicados por re-renders */
  const cuedTenRef = useRef(false);
  const beepedSecondsRef = useRef<Set<number>>(new Set());

  /* Desbloqueo: el usuario ya tocó algo para llegar acá, pero ese gesto vivió en otra
     pantalla. Enganchamos el primer gesto DENTRO de la sesión (tocar un botón, la
     pantalla, lo que sea) y ahí sí habilitamos el contexto. */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    /* Chrome mantiene la activación a nivel documento: si ya hubo un gesto previo, este
       resume alcanza y los beeps funcionan desde el primer descanso. */
    unlockAudio();

    if (isUnlocked && audioContext?.state === 'running') return;

    const handler = () => unlockAudio();
    UNLOCK_EVENTS.forEach((event) =>
      window.addEventListener(event, handler, { capture: true, once: true }),
    );

    return () => {
      UNLOCK_EVENTS.forEach((event) =>
        window.removeEventListener(event, handler, { capture: true }),
      );
    };
  }, []);

  /* Resetear los flags cuando cambia la fase (nuevo ciclo de cronómetro) */
  useEffect(() => {
    cuedTenRef.current = false;
    beepedSecondsRef.current = new Set();
  }, [phase]);

  useEffect(() => {
    /* Solo actuar en fases con cronómetro descendente */
    if (phase !== 'REST' && phase !== 'EXERCISE') return;
    if (timeLeft === null) return;

    /* Aviso a los 10 segundos */
    if (timeLeft === 10 && !cuedTenRef.current) {
      cuedTenRef.current = true;
      playTenSecondsCue();
      return;
    }

    /* Beeps cortos a 3, 2, 1 */
    if (timeLeft >= 1 && timeLeft <= 3 && !beepedSecondsRef.current.has(timeLeft)) {
      beepedSecondsRef.current.add(timeLeft);
      playBeep(880, 200, 0.8);
      return;
    }

    /* Beep sostenido al llegar a 0 */
    if (timeLeft === 0 && !beepedSecondsRef.current.has(0)) {
      beepedSecondsRef.current.add(0);
      playBeep(440, 800, 1.0);
    }
  }, [timeLeft, phase]);
}
