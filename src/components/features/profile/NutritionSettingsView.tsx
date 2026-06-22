import DietaryConfig from '@/src/components/features/profile/DietaryConfig';
import { ProfileListGroup } from '@/src/components/features/profile/ProfileListGroup';
import { ProfileListRow } from '@/src/components/features/profile/ProfileListRow';
import React, { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type NutritionSubView = null | 'dietary';

interface NutritionSettingsViewProps {
  onBack?: () => void;
  onSubBackChange?: (fn: (() => void) | null) => void;
}

/**
 * Vista de sub-opciones del módulo Nutrición dentro del perfil.
 * Lista agrupada dark `zinc` (sin íconos, consistente con la pantalla de Perfil).
 */
export const NutritionSettingsView: React.FC<NutritionSettingsViewProps> = ({ onBack, onSubBackChange }) => {
  const insets = useSafeAreaInsets();
  const [activeSubView, setActiveSubView] = useState<NutritionSubView>(null);

  const handleSubBack = () => {
    setActiveSubView(null);
    onSubBackChange?.(null);
  };

  const registerBackHandler = (fn: (() => void) | null) => {
    onSubBackChange?.(fn ? () => fn() : null);
  };

  if (activeSubView === 'dietary') {
    return <DietaryConfig onBack={handleSubBack} onRegisterBackHandler={registerBackHandler} />;
  }

  return (
    <View className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 24, paddingBottom: insets.bottom + 20 }}
      >
        <ProfileListGroup>
          <ProfileListRow
            label="Sub objetivo"
            onPress={() => Alert.alert('Sub objetivo', 'Próximamente.')}
          />
          <ProfileListRow
            label="Alergias alimenticias"
            onPress={() => Alert.alert('Alergias alimenticias', 'Próximamente.')}
          />
          <ProfileListRow label="Estilo de dieta" onPress={() => setActiveSubView('dietary')} />
        </ProfileListGroup>
      </ScrollView>
    </View>
  );
};
