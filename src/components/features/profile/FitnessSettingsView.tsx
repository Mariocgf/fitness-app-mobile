import EquipmentConfig from '@/src/components/features/profile/EquipmentConfig';
import FitnessSubGoalConfig from '@/src/components/features/profile/FitnessSubGoalConfig';
import FitnessTrainingPreferencesConfig from '@/src/components/features/profile/FitnessTrainingPreferencesConfig';
import { ProfileListGroup } from '@/src/components/features/profile/ProfileListGroup';
import { ProfileListRow } from '@/src/components/features/profile/ProfileListRow';
import React, { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type FitnessSubView = null | 'equipment' | 'trainingPreferences' | 'subGoal';

interface FitnessSettingsViewProps {
  onBack?: () => void;
  /** Callback que recibe la función de back de la sub-vista activa, o null si no hay */
  onSubBackChange?: (fn: (() => void) | null) => void;
}

/**
 * Vista de sub-opciones del módulo Fitness dentro del perfil.
 * Lista agrupada dark `zinc` (sin íconos, consistente con la pantalla de Perfil).
 */
export const FitnessSettingsView: React.FC<FitnessSettingsViewProps> = ({ onBack, onSubBackChange }) => {
  const insets = useSafeAreaInsets();
  const [activeSubView, setActiveSubView] = useState<FitnessSubView>(null);

  const handleSubBack = () => {
    setActiveSubView(null);
    onSubBackChange?.(null);
  };

  const registerBackHandler = (fn: (() => void) | null) => {
    onSubBackChange?.(fn ? () => fn() : null);
  };

  if (activeSubView === 'equipment') {
    return <EquipmentConfig onBack={handleSubBack} onRegisterBackHandler={registerBackHandler} />;
  }

  if (activeSubView === 'trainingPreferences') {
    return (
      <FitnessTrainingPreferencesConfig onBack={handleSubBack} onRegisterBackHandler={registerBackHandler} />
    );
  }

  if (activeSubView === 'subGoal') {
    return <FitnessSubGoalConfig onBack={handleSubBack} onRegisterBackHandler={registerBackHandler} />;
  }

  return (
    <View className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 24, paddingBottom: insets.bottom + 20 }}
      >
        <ProfileListGroup>
          <ProfileListRow label="Equipamiento" onPress={() => setActiveSubView('equipment')} />
          <ProfileListRow label="Días y duración" onPress={() => setActiveSubView('trainingPreferences')} />
          <ProfileListRow label="Sub objetivo" onPress={() => setActiveSubView('subGoal')} />
          <ProfileListRow
            label="Ejercicios favoritos"
            onPress={() => Alert.alert('Ejercicios favoritos', 'Próximamente.')}
          />
          <ProfileListRow
            label="Ejercicios no deseados"
            onPress={() => Alert.alert('Ejercicios no deseados', 'Próximamente.')}
          />
        </ProfileListGroup>
      </ScrollView>
    </View>
  );
};
