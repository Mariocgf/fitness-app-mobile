import { Stack } from 'expo-router';
import React from 'react';

/**
 * Layout interno del tab Salud.
 * Usa un Stack navigator para soportar la sub-pantalla de registro de medidas.
 */
export default function HealthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="wellness" />
      <Stack.Screen name="sleep" />
      <Stack.Screen name="sleep-new" />
      <Stack.Screen name="sleep-detail" />
      <Stack.Screen name="hydration" />
      <Stack.Screen name="hydration-new" />
      <Stack.Screen name="hydration-detail" />
      <Stack.Screen name="mood" />
      <Stack.Screen name="mood-new" />
      <Stack.Screen name="mood-detail" />
      <Stack.Screen name="measurements" />
      <Stack.Screen name="history" />
      <Stack.Screen name="evolution" />
      <Stack.Screen name="clinical" />
      <Stack.Screen name="clinical-reading-new" />
      <Stack.Screen name="clinical-readings" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
