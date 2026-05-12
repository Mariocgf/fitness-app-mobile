import React from 'react';
import { Image } from 'expo-image';

/** Wrapper memoizado para GIFs de ejercicios usando expo-image */

interface ExerciseGifProps {
  uri: string;
}

export const ExerciseGif = React.memo<ExerciseGifProps>(({ uri }) => {
  return (
    <Image
      source={{ uri }}
      style={{ width: '100%', height: '100%', borderRadius: 24 }}
      contentFit="cover"
      cachePolicy="memory"
    />
  );
});
