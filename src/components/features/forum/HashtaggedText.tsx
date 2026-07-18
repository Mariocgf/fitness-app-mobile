import React from 'react';
import { Text } from 'react-native';

const SKY = 'text-sky-400';

/** Regex que separa el texto en tokens, capturando los hashtags (#palabra). */
const HASHTAG_SPLIT = /(#[\p{L}\p{N}_]+)/gu;

interface HashtaggedTextProps {
  text: string;
  /** Clases del texto base (color/tamaño). El hashtag hereda tamaño y solo cambia el color. */
  className?: string;
  /** Trunca a N líneas (para la card del feed). Omitir en el detalle. */
  numberOfLines?: number;
}

/**
 * Renderiza texto plano resaltando los hashtags (#palabra) en `sky-400`. Es puramente
 * cosmético: el backend NO devuelve hashtags estructurados, se parsean del `body`.
 * Se reutiliza en la card del feed (truncado) y en el detalle (completo).
 */
export function HashtaggedText({ text, className = '', numberOfLines }: HashtaggedTextProps) {
  const parts = text.split(HASHTAG_SPLIT);

  return (
    <Text className={className} numberOfLines={numberOfLines}>
      {parts.map((part, index) =>
        part.startsWith('#') ? (
          <Text key={index} className={`${SKY} font-semibold`}>
            {part}
          </Text>
        ) : (
          part
        ),
      )}
    </Text>
  );
}
