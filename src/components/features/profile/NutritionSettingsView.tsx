import DietaryConfig from '@/src/components/features/profile/DietaryConfig';
import { Ionicons } from '@expo/vector-icons';
import { cssInterop } from 'nativewind';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

cssInterop(Ionicons, {
  className: { target: 'style', nativeStyleToProp: { color: true } },
});

type NutritionSubView = null | 'dietary';

interface NutritionSettingsViewProps {
  onBack?: () => void;
}

interface SubMenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

const SubMenuItem: React.FC<SubMenuItemProps> = ({ icon, label, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.6}
    className="flex-row items-center px-5 py-5 bg-slate-100 dark:bg-slate-800 rounded-2xl"
  >
    <View className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 items-center justify-center mr-4">
      <Ionicons name={icon} size={20} className="text-slate-500 dark:text-slate-400" />
    </View>
    <Text className="flex-1 text-base font-medium text-slate-900 dark:text-slate-50">
      {label}
    </Text>
    <Ionicons name="chevron-forward" size={18} className="text-slate-300 dark:text-slate-600" />
  </TouchableOpacity>
);

/**
 * Vista de sub-opciones del módulo Nutrición dentro del perfil.
 */
export const NutritionSettingsView: React.FC<NutritionSettingsViewProps> = ({ onBack }) => {
  const insets = useSafeAreaInsets();
  const [activeSubView, setActiveSubView] = useState<NutritionSubView>(null);

  if (activeSubView === 'dietary') {
    return <DietaryConfig onBack={() => setActiveSubView(null)} />;
  }

  return (
    <View className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20, paddingHorizontal: 16, paddingBottom: insets.bottom + 20, gap: 10 }}
      >
        <SubMenuItem icon="ribbon-outline" label="Sub objetivo" onPress={() => {}} />
        <SubMenuItem icon="alert-circle-outline" label="Alergias alimenticias" onPress={() => {}} />
        <SubMenuItem icon="leaf-outline" label="Estilo de dieta" onPress={() => setActiveSubView('dietary')} />
      </ScrollView>
    </View>
  );
};
