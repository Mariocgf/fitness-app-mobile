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
      <Stack.Screen name="fitness-equipment" />
      <Stack.Screen name="fitness-training" />
      <Stack.Screen name="fitness-subgoal" />
      <Stack.Screen name="nutrition" />
      <Stack.Screen name="nutrition-dietary" />
      <Stack.Screen name="nutrition-allergy" />
      <Stack.Screen name="health" />
      <Stack.Screen name="health-injuries" />
      <Stack.Screen name="health-conditions" />
      <Stack.Screen name="settings" />
    </Stack>
  );
}
