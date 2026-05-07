import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import NutritionConfigStep from '../NutritionConfigStep';
import * as nutritionService from '@/src/services/nutrition.service';

// Mocks
jest.mock('@/src/services/nutrition.service');
jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({ getToken: jest.fn(() => Promise.resolve('token')) }),
}));
jest.mock('@/src/hooks/use-module-config-storage', () => ({
  useModuleConfigStorage: () => ({
    saveNutritionConfig: jest.fn(),
    loadNutritionConfig: jest.fn().mockResolvedValue(null),
  }),
}));

describe('NutritionConfigStep', () => {
  const mockOnComplete = jest.fn();
  const mockSetIsSubmitting = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
    (nutritionService.getSubGoals as jest.Mock).mockResolvedValue([{ id: 'g1', name: 'Goal 1', description: 'Desc' }]);
    (nutritionService.getFoodAllergies as jest.Mock).mockResolvedValue([]);
    (nutritionService.getDietaryPreferences as jest.Mock).mockResolvedValue([]);
  });

  it('debe navegar a través de los sub-pasos correctamente', async () => {
    const { getByText, findByText } = render(
      <NutritionConfigStep
        brandColor="#00c2e0"
        moduleId="nut-1"
        globalGoalName="Meta Test"
        onComplete={mockOnComplete}
        isSubmitting={false}
        setIsSubmitting={mockSetIsSubmitting}
      />
    );

    // Esperar carga inicial
    await waitFor(() => expect(getByText('Tu objetivo')).toBeTruthy());
    
    fireEvent.press(getByText('Goal 1'));
    fireEvent.press(getByText('Continuar'));

    // SubStep 1: Alergias + Dieta
    await waitFor(() => expect(getByText('¿Tienes alguna alergia?')).toBeTruthy());
  });

  it('debe enviar el perfil al finalizar', async () => {
    (nutritionService.submitNutritionProfile as jest.Mock).mockResolvedValue({ success: true });

    const { getByText } = render(
      <NutritionConfigStep
        brandColor="#00c2e0"
        moduleId="nut-1"
        globalGoalName="Meta Test"
        onComplete={mockOnComplete}
        isSubmitting={false}
        setIsSubmitting={mockSetIsSubmitting}
      />
    );

    await waitFor(() => getByText('Tu objetivo'));
    fireEvent.press(getByText('Continuar')); // a paso 1

    await waitFor(() => getByText('¿Tienes alguna alergia?'));
    
    await act(async () => {
      fireEvent.press(getByText('Continuar'));
    });

    expect(nutritionService.submitNutritionProfile).toHaveBeenCalled();
    expect(mockOnComplete).toHaveBeenCalled();
  });
});
