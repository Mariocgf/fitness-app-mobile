import { Stack } from 'expo-router';

/**
 * Stack anidado del Perfil. Cada sección (Fitness/Nutrición/Salud/Configuración)
 * es una ruta real pusheada desde `index`, así el swipe-back nativo vuelve a la
 * vista anterior con animación nativa y sin glitch (a diferencia de la navegación
 * por estado anterior, donde el gesto popeaba toda la ruta hacia el home).
 */
export default function ProfileStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="fitness" />
      <Stack.Screen name="nutrition" />
      <Stack.Screen name="health" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
