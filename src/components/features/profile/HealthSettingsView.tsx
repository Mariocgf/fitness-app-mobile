import InjuriesConfig, { ConditionsConfig } from '@/src/components/features/profile/InjuriesConfig';
import { ProfileListGroup } from '@/src/components/features/profile/ProfileListGroup';
import { ProfileListRow } from '@/src/components/features/profile/ProfileListRow';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type HealthSubView = null | 'injuries' | 'conditions';

interface HealthSettingsViewProps {
  onBack?: () => void;
  onSubBackChange?: (fn: (() => void) | null) => void;
}

/**
 * Vista de sub-opciones del módulo Salud dentro del perfil.
 * Lista agrupada dark `zinc` (sin íconos, consistente con la pantalla de Perfil).
 */
export const HealthSettingsView: React.FC<HealthSettingsViewProps> = ({ onBack, onSubBackChange }) => {
  const insets = useSafeAreaInsets();
  const [activeSubView, setActiveSubView] = useState<HealthSubView>(null);

  const handleSubBack = () => {
    setActiveSubView(null);
    onSubBackChange?.(null);
  };

  const registerBackHandler = (fn: (() => void) | null) => {
    onSubBackChange?.(fn ? () => fn() : null);
  };

  if (activeSubView === 'injuries') {
    return <InjuriesConfig onBack={handleSubBack} onRegisterBackHandler={registerBackHandler} />;
  }

  if (activeSubView === 'conditions') {
    return <ConditionsConfig onBack={handleSubBack} onRegisterBackHandler={registerBackHandler} />;
  }

  return (
    <View className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 24, paddingBottom: insets.bottom + 20 }}
      >
        <ProfileListGroup>
          <ProfileListRow label="Lesiones" onPress={() => setActiveSubView('injuries')} />
          <ProfileListRow label="Afecciones médicas" onPress={() => setActiveSubView('conditions')} />
        </ProfileListGroup>
      </ScrollView>
    </View>
  );
};
