import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

interface PrivacyTermsStepProps {
  onContinue: () => void;
  isSubmitting: boolean;
}

export default function PrivacyTermsStep({ onContinue, isSubmitting }: PrivacyTermsStepProps) {
  const [isAccepted, setIsAccepted] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-white dark:bg-zinc-900">
      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ pt: 20, pb: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Icon */}
        <View className="items-center mb-6">
          <View className="w-16 h-16 rounded-full bg-cyan-50 dark:bg-cyan-900/30 items-center justify-center">
            <Ionicons name="shield-outline" size={32} color="#0891b2" />
          </View>
        </View>

        {/* Titles */}
        <Text className="text-2xl font-bold text-center text-zinc-900 dark:text-zinc-100 mb-3">
          Tu privacidad es lo primero
        </Text>
        <Text className="text-base text-center text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
          Para crear tu plan de entrenamiento y nutrición personalizado con IA, necesitamos procesar algunos datos sensibles.
        </Text>

        {/* Info Card */}
        <View className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl p-5 mb-8 shadow-sm">
          <Text className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-5">Lo que debes saber:</Text>

          {/* Item 1 */}
          <View className="flex-row items-start mb-5">
            <View className="w-10 h-10 rounded-full bg-cyan-50 dark:bg-cyan-900/30 items-center justify-center mr-4 mt-1">
              <Ionicons name="medical-outline" size={20} color="#0891b2" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">Datos sensibles Protegidos</Text>
              <Text className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Solo usamos tus lesiones y condiciones médicas para ajustar tus rutinas.
              </Text>
            </View>
          </View>

          {/* Item 2 */}
          <View className="flex-row items-start mb-5">
            <View className="w-10 h-10 rounded-full bg-cyan-50 dark:bg-cyan-900/30 items-center justify-center mr-4 mt-1">
              <Ionicons name="hardware-chip-outline" size={20} color="#0891b2" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">Procesamiento Seguro</Text>
              <Text className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Tus datos se envían de forma anónima a nuestra IA para generar tus dietas.
              </Text>
            </View>
          </View>

          {/* Item 3 */}
          <View className="flex-row items-start">
            <View className="w-10 h-10 rounded-full bg-cyan-50 dark:bg-cyan-900/30 items-center justify-center mr-4 mt-1">
              <Ionicons name="lock-closed-outline" size={20} color="#0891b2" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">Tú tienes el control</Text>
              <Text className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Puedes solicitar borrar todos tus datos de salud en cualquier momento desde los ajustes.
              </Text>
            </View>
          </View>
        </View>

        {/* Toggle Accept */}
        <View className="flex-row items-center mb-4 pr-4">
          <Switch
            value={isAccepted}
            onValueChange={setIsAccepted}
            trackColor={{ false: '#d4d4d8', true: '#00c2e0' }}
            thumbColor="#ffffff"
            style={{ transform: [{ scaleX: 0.9 }, { scaleY: 0.9 }] }}
          />
          <View className="flex-1 ml-3">
            <Text className="text-sm text-zinc-900 dark:text-zinc-100 font-medium">
              Acepto el tratamiento de mis datos de salud y biométricos según la{' '}
              <Text
                className="text-[#00c2e0] font-bold"
                onPress={() => setShowPolicy(true)}
              >
                Política de Privacidad
              </Text>
            </Text>
          </View>
        </View>

        <Text className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
          Al pulsar 'Continuar', confirmas que otorgas tu consentimiento para el procesamiento de tus datos de salud. Puedes revocar este permiso en cualquier momento.
        </Text>
      </ScrollView>

      {/* Footer Button with safe area handling */}
      <View
        className="px-6"
        style={{ marginBottom: Math.max(insets.bottom, 20) }}
      >
        <TouchableOpacity
          className={`w-full py-5 rounded-2xl items-center shadow-md ${isAccepted ? 'bg-[#00c2e0]' : 'bg-[#00c2e0]/50'
            }`}
          disabled={!isAccepted || isSubmitting}
          onPress={onContinue}
          activeOpacity={0.8}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-white text-lg font-bold">Continuar & Configurar</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Privacy Policy Bottom Sheet (Modal) */}
      <Modal
        visible={showPolicy}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowPolicy(false)}
      >
        <SafeAreaView className="flex-1 bg-white dark:bg-zinc-900">
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <Text className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Política de Privacidad</Text>
            <TouchableOpacity
              onPress={() => setShowPolicy(false)}
              className="w-8 h-8 items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-full"
            >
              <Ionicons name="close" size={20} color="#3f3f46" />
            </TouchableOpacity>
          </View>
          <ScrollView className="flex-1 px-6 py-6">
            <Text className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">1. Marco Legal</Text>
            <Text className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
              La presente política se rige estrictamente por la Ley N° 18.331 de Protección de Datos Personales y Acción de "Habeas Data" de la República Oriental del Uruguay.
            </Text>

            <Text className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">2. Responsable del Tratamiento</Text>
            <Text className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
              El tratamiento de los datos personales es responsabilidad del equipo de desarrollo de la plataforma.
            </Text>

            <Text className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">3. Datos Recabados y Finalidad</Text>
            <Text className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
              Se recolectan datos exclusivamente para proporcionar un servicio personalizado de fitness y nutrición:
            </Text>

            {/* Lista de puntos */}
            <View className="mb-6 ml-2">
              <Text className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                <Text className="font-bold text-zinc-800 dark:text-zinc-200">• Datos de Identidad: </Text>
                Gestionados de forma segura a través de <Text className="font-semibold">Clerk</Text>, obteniendo nombre y correo mediante autenticación OAuth (Google/Apple).
              </Text>

              <Text className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                <Text className="font-bold text-zinc-800 dark:text-zinc-200">• Datos de Salud y Biométricos: </Text>
                (Datos Sensibles) Incluye fecha de nacimiento, peso, altura, medidas, lesiones, alergias y condiciones médicas.
              </Text>

              <Text className="text-sm text-zinc-600 dark:text-zinc-400">
                <Text className="font-bold text-zinc-800 dark:text-zinc-200">• Datos de Equipamiento: </Text>
                Inventario de herramientas de entrenamiento disponibles para ajustar las rutinas.
              </Text>
            </View>

            <Text className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">4. Tratamiento por Terceros y Seudonimización</Text>
            <Text className="text-sm text-zinc-600 dark:text-zinc-400 mb-2 leading-relaxed">
              Para la generación de planes personalizados, la plataforma utiliza la API de Globant Enterprise AI.
            </Text>
            <Text className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
              Se garantiza que los datos enviados a este proveedor externo son seudonimizados, eliminando cualquier identificador directo (nombre o email), enviando únicamente los parámetros físicos y médicos necesarios para el procesamiento de la IA.
            </Text>

            <Text className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">5. Medidas de Seguridad</Text>
            <Text className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
              La plataforma implementa medidas técnicas para garantizar la confidencialidad:
            </Text>
            <View className="mb-6 ml-2">
              <Text className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                <Text className="font-bold text-zinc-800 dark:text-zinc-200">• Gestión de Identidad Externa: </Text>
                La autenticación y el resguardo de credenciales se delegan a <Text className="font-semibold">Clerk</Text>, garantizando que la plataforma no almacene contraseñas ni datos de acceso directo.
              </Text>
              <Text className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                <Text className="font-bold text-zinc-800 dark:text-zinc-200">• Cifrado de Datos Sensibles: </Text>
                Las medidas corporales y registros de salud se encriptan en la capa de aplicación mediante el estándar <Text className="font-semibold">AES-256</Text> antes de su almacenamiento..
              </Text>
              <Text className="text-sm text-zinc-600 dark:text-zinc-400">
                <Text className="font-bold text-zinc-800 dark:text-zinc-200">• Seudonimización: </Text>
                Los registros de salud se almacenan vinculados únicamente a un identificador interno, manteniendo la identidad civil del usuario (nombre y correo) aislada de su perfil médico.
              </Text>
              <Text className="text-sm text-zinc-600 dark:text-zinc-400">
                <Text className="font-bold text-zinc-800 dark:text-zinc-200">• Tráfico Seguro: </Text>
                Toda comunicación entre el cliente y el servidor se realiza bajo protocolos <Text className="font-semibold">HTTPS</Text> con cifrado TLS.
              </Text>
            </View>
            <Text className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">6. Derechos de los Usuarios (ARCO)</Text>
            <Text className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
              De acuerdo con la normativa vigente, el usuario podrá ejercer sus derechos de Acceso, Rectificación, Actualización, Inclusión o Supresión de sus datos personales. Las solicitudes serán atendidas en un plazo máximo de 5 días hábiles.
            </Text>
            <Text className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-2">7. Retención y Supresión</Text>
            <Text className="text-sm text-zinc-600 dark:text-zinc-400 mb-6 leading-relaxed">
              Los datos serán conservados únicamente mientras la cuenta del usuario permanezca activa. Ante una solicitud de baja, se procederá a la eliminación definitiva de los registros de salud vinculados al usuario.
            </Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
