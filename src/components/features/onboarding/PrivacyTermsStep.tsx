import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconTile } from '@/src/components/common/IconTile';

interface PrivacyTermsStepProps {
  onContinue: () => void;
  isSubmitting: boolean;
}

/** Color del ícono de los tiles de feature (zinc-200, acento mono — no es módulo) */
const TILE_ICON = '#e4e4e7';

/** Features informativas de privacidad. */
const FEATURES: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { icon: 'shield-checkmark-outline', label: 'Tus datos están protegidos.' },
  { icon: 'sparkles-outline', label: 'La IA genera planes adaptados a vos.' },
  { icon: 'trash-outline', label: 'Podés eliminar tus datos cuando quieras.' },
];

export default function PrivacyTermsStep({ onContinue, isSubmitting }: PrivacyTermsStepProps) {
  const [isAccepted, setIsAccepted] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-zinc-950">
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero: escudo de privacidad (mono, sin el glow azul de la maqueta) */}
        <View className="items-center mt-2 mb-6">
          <View className="w-32 h-32 rounded-full border border-zinc-900 items-center justify-center">
            <View className="w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 items-center justify-center">
              <Ionicons name="shield-outline" size={52} color="#fafafa" />
            </View>
          </View>
        </View>

        {/* Títulos */}
        <Text className="text-3xl font-extrabold text-white mb-2">
          Tu privacidad es lo primero.
        </Text>
        <Text className="text-base text-zinc-400 leading-relaxed mb-6">
          Wellium utiliza algunos datos de salud para crear planes personalizados de Fitness, Nutrición y Salud.
        </Text>

        {/* Filas de features informativas — divisores finos, sin card (como la maqueta) */}
        <View className="mb-6">
          {FEATURES.map((feature, index) => (
            <View
              key={feature.label}
              className={`flex-row items-center py-3 ${index < FEATURES.length - 1 ? 'border-b border-zinc-800' : ''
                }`}
            >
              <IconTile name={feature.icon} color={TILE_ICON} size={48} iconSize={22} className="bg-zinc-900 mr-4" />
              <Text className="flex-1 text-base text-white">{feature.label}</Text>
            </View>
          ))}
        </View>

        {/* Card de consentimiento */}
        <View className="bg-zinc-900 rounded-3xl p-5">
          <View className="flex-row items-center">
            <Text className="flex-1 text-base text-white leading-relaxed mr-4">
              Acepto el uso de mis datos de salud para personalizar mi experiencia.
            </Text>
            <Switch
              value={isAccepted}
              onValueChange={setIsAccepted}
              trackColor={{ false: '#3f3f46', true: '#a1a1aa' }}
              thumbColor="#ffffff"
              ios_backgroundColor="#3f3f46"
            />
          </View>

          <View className="h-px bg-zinc-800 my-4" />

          <View className="flex-row items-start">
            <Ionicons name="lock-closed-outline" size={16} color="#71717a" className="mt-0.5 mr-2" />
            <Text className="flex-1 text-sm text-zinc-500 leading-relaxed">
              Tu información nunca se comparte con terceros. Solo la usamos para mejorar tu experiencia.{' '}
              <Text className="text-zinc-300 underline" onPress={() => setShowPolicy(true)}>
                Política de Privacidad
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Botón fijo con safe area */}
      <View className="px-6" style={{ marginBottom: Math.max(insets.bottom, 20) }}>
        <TouchableOpacity
          className={`w-full py-5 rounded-full items-center ${isAccepted ? 'bg-zinc-50' : 'bg-zinc-50/40'}`}
          disabled={!isAccepted || isSubmitting}
          onPress={onContinue}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#18181b" />
          ) : (
            <Text className="text-zinc-950 text-lg font-bold">Continuar</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Política de Privacidad (modal con el contenido legal real) */}
      <Modal
        visible={showPolicy}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPolicy(false)}
      >
        <SafeAreaView className="flex-1 bg-zinc-950">
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-zinc-800">
            <Text className="text-xl font-bold text-white">Política de Privacidad</Text>
            <TouchableOpacity
              onPress={() => setShowPolicy(false)}
              className="w-8 h-8 items-center justify-center bg-zinc-800 rounded-full"
            >
              <Ionicons name="close" size={20} color="#a1a1aa" />
            </TouchableOpacity>
          </View>
          <ScrollView className="flex-1 px-6 py-6">
            <Text className="text-base font-bold text-white mb-2">1. Marco Legal</Text>
            <Text className="text-sm text-zinc-400 mb-6 leading-relaxed">
              La presente política se rige estrictamente por la Ley N° 18.331 de Protección de Datos Personales y Acción de “Habeas Data” de la República Oriental del Uruguay.
            </Text>

            <Text className="text-base font-bold text-white mb-2">2. Responsable del Tratamiento</Text>
            <Text className="text-sm text-zinc-400 mb-6 leading-relaxed">
              El tratamiento de los datos personales es responsabilidad del equipo de desarrollo de la plataforma.
            </Text>

            <Text className="text-base font-bold text-white mb-2">3. Datos Recabados y Finalidad</Text>
            <Text className="text-sm text-zinc-400 mb-4 leading-relaxed">
              Se recolectan datos exclusivamente para proporcionar un servicio personalizado de fitness y nutrición:
            </Text>

            <View className="mb-6 ml-2">
              <Text className="text-sm text-zinc-400 mb-2">
                <Text className="font-bold text-white">• Datos de Identidad: </Text>
                Gestionados de forma segura a través de <Text className="font-semibold">Clerk</Text>, obteniendo nombre y correo mediante autenticación OAuth (Google/Apple).
              </Text>

              <Text className="text-sm text-zinc-400 mb-2">
                <Text className="font-bold text-white">• Datos de Salud y Biométricos: </Text>
                (Datos Sensibles) Incluye fecha de nacimiento, peso, altura, medidas, lesiones, alergias y condiciones médicas.
              </Text>

              <Text className="text-sm text-zinc-400">
                <Text className="font-bold text-white">• Datos de Equipamiento: </Text>
                Inventario de herramientas de entrenamiento disponibles para ajustar las rutinas.
              </Text>
            </View>

            <Text className="text-base font-bold text-white mb-2">4. Tratamiento por Terceros y Seudonimización</Text>
            <Text className="text-sm text-zinc-400 mb-2 leading-relaxed">
              Para la generación de planes personalizados, la plataforma utiliza la API de Globant Enterprise AI.
            </Text>
            <Text className="text-sm text-zinc-400 mb-6 leading-relaxed">
              Se garantiza que los datos enviados a este proveedor externo son seudonimizados, eliminando cualquier identificador directo (nombre o email), enviando únicamente los parámetros físicos y médicos necesarios para el procesamiento de la IA.
            </Text>

            <Text className="text-base font-bold text-white mb-2">5. Medidas de Seguridad</Text>
            <Text className="text-sm text-zinc-400 mb-4 leading-relaxed">
              La plataforma implementa medidas técnicas para garantizar la confidencialidad:
            </Text>
            <View className="mb-6 ml-2">
              <Text className="text-sm text-zinc-400 mb-2">
                <Text className="font-bold text-white">• Gestión de Identidad Externa: </Text>
                La autenticación y el resguardo de credenciales se delegan a <Text className="font-semibold">Clerk</Text>, garantizando que la plataforma no almacene contraseñas ni datos de acceso directo.
              </Text>
              <Text className="text-sm text-zinc-400 mb-2">
                <Text className="font-bold text-white">• Cifrado de Datos Sensibles: </Text>
                Las medidas corporales y registros de salud se encriptan en la capa de aplicación mediante el estándar <Text className="font-semibold">AES-256</Text> antes de su almacenamiento..
              </Text>
              <Text className="text-sm text-zinc-400">
                <Text className="font-bold text-white">• Seudonimización: </Text>
                Los registros de salud se almacenan vinculados únicamente a un identificador interno, manteniendo la identidad civil del usuario (nombre y correo) aislada de su perfil médico.
              </Text>
              <Text className="text-sm text-zinc-400">
                <Text className="font-bold text-white">• Tráfico Seguro: </Text>
                Toda comunicación entre el cliente y el servidor se realiza bajo protocolos <Text className="font-semibold">HTTPS</Text> con cifrado TLS.
              </Text>
            </View>
            <Text className="text-base font-bold text-white mb-2">6. Derechos de los Usuarios (ARCO)</Text>
            <Text className="text-sm text-zinc-400 mb-6 leading-relaxed">
              De acuerdo con la normativa vigente, el usuario podrá ejercer sus derechos de Acceso, Rectificación, Actualización, Inclusión o Supresión de sus datos personales. Las solicitudes serán atendidas en un plazo máximo de 5 días hábiles.
            </Text>
            <Text className="text-base font-bold text-white mb-2">7. Retención y Supresión</Text>
            <Text className="text-sm text-zinc-400 mb-6 leading-relaxed">
              Los datos serán conservados únicamente mientras la cuenta del usuario permanezca activa. Ante una solicitud de baja, se procederá a la eliminación definitiva de los registros de salud vinculados al usuario.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
