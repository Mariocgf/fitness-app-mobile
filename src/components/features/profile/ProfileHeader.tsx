import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import {
    Image,
    Platform,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
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
  const insets = useSafeAreaInsets();

  return (
    <View className="w-full items-center relative" style={{ paddingTop: insets.top + 20 }}>
      {/* Botón de logout — esquina superior derecha de la pantalla */}
      <TouchableOpacity
        onPress={onLogout}
        activeOpacity={0.7}
        className="absolute right-6 w-11 h-11 rounded-full bg-red-400 items-center justify-center z-10"
        style={{
          top: insets.top + 10,
          shadowColor: '#f87171',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.4,
          shadowRadius: 6,
          elevation: 5,
        }}
      >
        <Ionicons name="log-out-outline" size={22} className="text-white" />
      </TouchableOpacity>

      {/* Contenedor del avatar */}
      <View className="w-[130px] h-[130px] rounded-full border-[3px] border-[#f5d6b8] overflow-hidden bg-slate-100 dark:bg-zinc-800">
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="w-full h-full items-center justify-center bg-slate-200 dark:bg-zinc-700">
            <Text className="text-5xl font-bold text-slate-500 dark:text-zinc-400">
              {fullName.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      {/* Card de info del usuario — superpuesta -40px sobre el avatar */}
      <View
        className="-mt-5 w-[85%] rounded-[20px] overflow-hidden"
        style={{
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
            tint="default"
            className="pt-5 pb-5 px-6 items-start"
          >
            <CardContent fullName={fullName} email={email} />
          </BlurView>
        ) : (
          /* Android: simular blur con fondo semi-transparente */
          <View className="pt-[52px] pb-5 px-6 items-start bg-white/90 dark:bg-zinc-900/90 border border-slate-200/60 dark:border-zinc-700/50">
            <CardContent fullName={fullName} email={email} />
          </View>
        )}
      </View>
    </View>
  );
}

/**
 * Contenido interno de la card (nombre, Premium, email).
 */
function CardContent({ fullName, email }: { fullName: string; email: string }) {
  return (
    <>
      <Text className="text-[22px] font-bold text-slate-950 dark:text-zinc-50 mb-0.5">
        {fullName}
      </Text>
      <Text className="text-sm font-semibold text-slate-500 dark:text-zinc-400 mb-0.5">
        Premium
      </Text>
      <Text className="text-sm text-slate-400 dark:text-zinc-500">
        {email}
      </Text>
    </>
  );
}
