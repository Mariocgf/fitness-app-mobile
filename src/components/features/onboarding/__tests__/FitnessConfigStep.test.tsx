import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import FitnessConfigStep from '../FitnessConfigStep';
import * as fitnessService from '@/src/services/fitness.service';

// Mocks
jest.mock('@/src/services/fitness.service');
jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({ getToken: jest.fn(() => Promise.resolve('token')) }),
}));
jest.mock('@/src/hooks/use-module-config-storage', () => ({
  useModuleConfigStorage: () => ({
    saveFitnessConfig: jest.fn(),
    loadFitnessConfig: jest.fn().mockResolvedValue(null),
  }),
}));

describe('FitnessConfigStep', () => {
  const mockOnComplete = jest.fn();
  const mockSetIsSubmitting = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
    (fitnessService.getSubGoals as jest.Mock).mockResolvedValue([]);
    (fitnessService.getEquipments as jest.Mock).mockResolvedValue([]);
  });

  it('debe navegar a través de los sub-pasos correctamente', async () => {
    const { getByText, findByText } = render(
      <FitnessConfigStep
        brandColor="#00c2e0"
        moduleId="fit-1"
        globalGoalName="Meta Test"
        onComplete={mockOnComplete}
        isSubmitting={false}
        setIsSubmitting={mockSetIsSubmitting}
      />
    );

    // SubStep 0: Experiencia + Actividad
    expect(getByText('Nivel de experiencia')).toBeTruthy();
    
    // Seleccionar opciones (Usando los labels correctos definidos en los tipos)
    fireEvent.press(getByText('Principiante'));
    fireEvent.press(getByText('0 a 3 meses'));

    fireEvent.press(getByText('Continuar'));

    // SubStep 1: Sub-objetivos
    await waitFor(() => expect(getByText('Tu objetivo')).toBeTruthy());
    fireEvent.press(getByText('Continuar'));

    // SubStep 2: Disponibilidad
    await waitFor(() => expect(getByText('Disponibilidad')).toBeTruthy());
    fireEvent.press(getByText('Continuar'));

    // SubStep 3: Entorno + Equipamiento
    await waitFor(() => expect(getByText('Entorno')).toBeTruthy());
  });

  it('debe mostrar alerta si no selecciona experiencia o actividad en el paso 0', () => {
    const { getByText } = render(
      <FitnessConfigStep
        brandColor="#00c2e0"
        moduleId="fit-1"
        globalGoalName="Meta Test"
        onComplete={mockOnComplete}
        isSubmitting={false}
        setIsSubmitting={mockSetIsSubmitting}
      />
    );

    fireEvent.press(getByText('Continuar'));
    expect(global.alert).toHaveBeenCalledWith('Por favor selecciona tu nivel de experiencia.');
    
    fireEvent.press(getByText('Principiante'));
    fireEvent.press(getByText('Continuar'));
    expect(global.alert).toHaveBeenCalledWith('Por favor selecciona tu nivel de actividad.');
  });

  it('debe enviar el perfil al finalizar', async () => {
    (fitnessService.submitFitnessProfile as jest.Mock).mockResolvedValue({ success: true });

    const { getByText } = render(
      <FitnessConfigStep
        brandColor="#00c2e0"
        moduleId="fit-1"
        globalGoalName="Meta Test"
        onComplete={mockOnComplete}
        isSubmitting={false}
        setIsSubmitting={mockSetIsSubmitting}
      />
    );

    // Llegar al último paso rápidamente
    fireEvent.press(getByText('Principiante'));
    fireEvent.press(getByText('0 a 3 meses'));
    fireEvent.press(getByText('Continuar')); // a 1
    await waitFor(() => getByText('Tu objetivo'));
    fireEvent.press(getByText('Continuar')); // a 2
    await waitFor(() => getByText('Disponibilidad'));
    fireEvent.press(getByText('Continuar')); // a 3
    await waitFor(() => getByText('Entorno'));

    fireEvent.press(getByText('Home'));
    
    await act(async () => {
      fireEvent.press(getByText('Continuar'));
    });

    expect(fitnessService.submitFitnessProfile).toHaveBeenCalled();
    expect(mockOnComplete).toHaveBeenCalled();
  });
});
