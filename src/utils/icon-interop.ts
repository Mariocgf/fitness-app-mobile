/**
 * Registro global de `cssInterop` para las familias de íconos.
 *
 * `cssInterop` muta el componente para que acepte `className` (NativeWind mapea
 * la clase a `style`/`color`). Es una operación GLOBAL e idempotente sobre la
 * referencia del componente: registrándola UNA vez al arranque, todos los
 * `<Ionicons className=... />` de la app funcionan.
 *
 * Import de side-effect: se importa una sola vez desde `app/_layout.tsx` (la
 * raíz, que se evalúa antes de cualquier render). NO repetir esta llamada en
 * cada archivo — antes estaba duplicada en ~39 componentes.
 */
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});
cssInterop(MaterialCommunityIcons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});
