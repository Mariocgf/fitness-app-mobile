import { Stack } from 'expo-router';
import React from 'react';

/**
 * Layout interno del tab Nutrición.
 */
export default function NutritionLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="register" />
      <Stack.Screen name="meal/[id]" />
      <Stack.Screen name="routines" />
      <Stack.Screen name="routine/[id]" />
    </Stack>
  );
}
