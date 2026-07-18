import { Stack } from 'expo-router';
import React from 'react';

/**
 * Layout interno del tab Comunidad (foro).
 * Las pantallas de feed/detalle/crear se agregan en sus fases (ver docs/forum/).
 */
export default function CommunityLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" />
      <Stack.Screen name="new" />
    </Stack>
  );
}
