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
      <Stack.Screen name="measurements" />
      <Stack.Screen name="history" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
