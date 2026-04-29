import React from 'react';
import {
  Image,
  Platform,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ProfileHeaderProps {
  /** URL del avatar del usuario (Clerk imageUrl) */
  avatarUrl?: string;
  /** Nombre completo del usuario */
  fullName: string;
  /** Email del usuario */
  email: string;
  /** Callback al presionar el botón de logout */
  onLogout: () => void;
}

/**
 * Header del perfil con:
 * - Imagen circular del avatar
 * - Botón rojo de logout en la esquina superior derecha
 * - Card con info del usuario superpuesta a -40px con efecto blur
 */
export default function ProfileHeader({
  avatarUrl,
  fullName,
  email,
  onLogout,
}: ProfileHeaderProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  return (
    <View style={{ width: '100%', alignItems: 'center', paddingTop: insets.top + 20, position: 'relative' }}>
      {/* Botón de logout — esquina superior derecha de la pantalla */}
      <TouchableOpacity
        onPress={onLogout}
        activeOpacity={0.7}
        style={{
          position: 'absolute',
          top: insets.top + 10,
          right: 24,
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: '#f87171', // red-400
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#f87171',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.4,
          shadowRadius: 6,
          elevation: 5,
          zIndex: 10,
        }}
      >
        <Ionicons name="log-out-outline" size={22} color="#ffffff" />
      </TouchableOpacity>

      {/* Contenedor del avatar */}
      <View
        style={{
          width: 130,
          height: 130,
          borderRadius: 65,
          borderWidth: 3,
          borderColor: '#f5d6b8',
          overflow: 'hidden',
          backgroundColor: isDark ? '#27272a' : '#f1f5f9',
        }}
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDark ? '#3f3f46' : '#e2e8f0',
            }}
          >
            <Text
              style={{
                fontSize: 48,
                fontWeight: 'bold',
                color: isDark ? '#a1a1aa' : '#64748b',
              }}
            >
              {fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Card de info del usuario — superpuesta -40px sobre el avatar */}
      <View
        style={{
          marginTop: -20,
          width: '85%',
          borderRadius: 20,
          overflow: 'hidden',
          // Sombra
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 6,
        }}
      >
        {Platform.OS === 'ios' ? (
          <BlurView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            style={{
              paddingTop: 20,
              paddingBottom: 20,
              paddingHorizontal: 24,
              alignItems: 'flex-start',
            }}
          >
            <CardContent
              fullName={fullName}
              email={email}
              isDark={isDark}
            />
          </BlurView>
        ) : (
          /* Android: simular blur con fondo semi-transparente */
          <View
            style={{
              paddingTop: 52,
              paddingBottom: 20,
              paddingHorizontal: 24,
              alignItems: 'flex-start',
              backgroundColor: isDark
                ? 'rgba(24, 24, 27, 0.92)'
                : 'rgba(255, 255, 255, 0.92)',
              borderWidth: 1,
              borderColor: isDark
                ? 'rgba(63, 63, 70, 0.5)'
                : 'rgba(226, 232, 240, 0.6)',
            }}
          >
            <CardContent
              fullName={fullName}
              email={email}
              isDark={isDark}
            />
          </View>
        )}
      </View>
    </View>
  );
}

/**
 * Contenido interno de la card (nombre, Premium, email).
 */
function CardContent({
  fullName,
  email,
  isDark,
}: {
  fullName: string;
  email: string;
  isDark: boolean;
}) {
  return (
    <>
      <Text
        style={{
          fontSize: 22,
          fontWeight: '700',
          color: isDark ? '#fafafa' : '#0f172a',
          marginBottom: 2,
        }}
      >
        {fullName}
      </Text>
      <Text
        style={{
          fontSize: 14,
          fontWeight: '600',
          color: isDark ? '#a1a1aa' : '#64748b',
          marginBottom: 2,
        }}
      >
        Premium
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: isDark ? '#71717a' : '#94a3b8',
        }}
      >
        {email}
      </Text>
    </>
  );
}
