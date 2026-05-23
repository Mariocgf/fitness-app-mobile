import { Stack } from 'expo-router';
import React from 'react';

/**
 * Layout del tab Fitness con navegación Stack interna.
 * Permite sub-rutas como fitness/routines manteniendo el tab activo.
 */
export default function FitnessLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="routines" />
    </Stack>
  );
}
