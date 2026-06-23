import { SafeAreaView } from 'react-native-safe-area-context';

import { FullPageLoader } from '@/src/components/common/FullPageLoader';
import SwipeBackWrapper from '@/src/components/common/SwipeBackWrapper';
import BasicInfoStep1 from '@/src/components/features/onboarding/BasicInfoStep1';
import BasicInfoStep2 from '@/src/components/features/onboarding/BasicInfoStep2';
import BasicInfoStep3 from '@/src/components/features/onboarding/BasicInfoStep3';
import ModuleConfigRouter from '@/src/components/features/onboarding/ModuleConfigRouter';
import ModuleSelectionStep from '@/src/components/features/onboarding/ModuleSelectionStep';
import PrivacyTermsStep from '@/src/components/features/onboarding/PrivacyTermsStep';
import { useOnboardingFlow } from '@/src/hooks/useOnboardingFlow';

export default function OnboardingScreen() {
  const {
    step,
    setStep,
    isSubmitting,
    setIsSubmitting,
    isTransitioning,
    date,
    setDate,
    gender,
    setGender,
    weight,
    setWeight,
    height,
    setHeight,
    goal,
    setGoal,
    globalGoals,
    isLoadingGoals,
    modules,
    selectedModuleIds,
    setSelectedModuleIds,
    isLoadingModules,
    activeModules,
    configIndex,
    globalGoalName,
    advanceStep,
    handleAcceptTerms,
    handleBasicInfoSubmit,
    handleModulesSubmit,
    handleModuleConfigured,
  } = useOnboardingFlow();

  // Mientras inicializamos o estamos en transición, mostramos el loader
  if (step === -1 || isTransitioning) {
    return (
      <FullPageLoader message={isTransitioning ? 'Guardando tu progreso...' : 'Cargando tu progreso...'} />
    );
  }

  return (
    <SafeAreaView edges={['top', 'left', 'right']} className="flex-1 bg-zinc-950">
      {step === -2 && (
        <PrivacyTermsStep
          onContinue={handleAcceptTerms}
          isSubmitting={isTransitioning}
        />
      )}

      {step === 0 && (
        <BasicInfoStep1
          date={date}
          onDateChange={setDate}
          gender={gender}
          onGenderChange={setGender}
          onContinue={() => advanceStep(1)}
        />
      )}

      {step === 1 && (
        <SwipeBackWrapper onSwipeBack={() => setStep(0)}>
        <BasicInfoStep2
          weight={weight}
          onWeightChange={setWeight}
          height={height}
          onHeightChange={setHeight}
          onContinue={() => advanceStep(2)}
          onBack={() => setStep(0)}
        />
        </SwipeBackWrapper>
      )}

      {step === 2 && (
        <SwipeBackWrapper onSwipeBack={() => setStep(1)}>
        <BasicInfoStep3
          goal={goal}
          onGoalChange={setGoal}
          onContinue={handleBasicInfoSubmit}
          onBack={() => setStep(1)}
          isSubmitting={isSubmitting}
          goals={globalGoals}
          isLoading={isLoadingGoals}
        />
        </SwipeBackWrapper>
      )}

      {step === 3 && (
        <ModuleSelectionStep
          modules={modules}
          selectedModuleIds={selectedModuleIds}
          onSelectionChange={setSelectedModuleIds}
          onContinue={handleModulesSubmit}
          isSubmitting={isSubmitting}
          isLoading={isLoadingModules}
        />
      )}

      {step === 4 && (
        <ModuleConfigRouter
          activeModules={activeModules}
          currentConfigIndex={configIndex}
          onModuleConfigured={handleModuleConfigured}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
          globalGoalName={globalGoalName}
        />
      )}
    </SafeAreaView>
  );
}
