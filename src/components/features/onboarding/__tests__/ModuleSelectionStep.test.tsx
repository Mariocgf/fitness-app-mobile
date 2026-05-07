import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ModuleSelectionStep from '../ModuleSelectionStep';

// Mock de expo-image
jest.mock('expo-image', () => ({
  Image: 'Image',
}));

describe('ModuleSelectionStep', () => {
  const mockModules = [
    { id: '1', name: 'Health', description: 'Salud', imageUrl: 'url1', brandColor: '#FF0000' },
    { id: '2', name: 'Fitness', description: 'Entrenamiento', imageUrl: 'url2', brandColor: '#00FF00' },
  ];

  const mockOnSelectionChange = jest.fn();
  const mockOnContinue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
  });

  it('debe renderizar la lista de módulos', () => {
    const { getByText } = render(
      <ModuleSelectionStep
        modules={mockModules}
        selectedModuleIds={[]}
        onSelectionChange={mockOnSelectionChange}
        onContinue={mockOnContinue}
        isSubmitting={false}
        isLoading={false}
      />
    );

    expect(getByText('Health')).toBeTruthy();
    expect(getByText('Fitness')).toBeTruthy();
    expect(getByText('Experiencia completa')).toBeTruthy();
  });

  it('debe permitir seleccionar un módulo', () => {
    const { getByText } = render(
      <ModuleSelectionStep
        modules={mockModules}
        selectedModuleIds={[]}
        onSelectionChange={mockOnSelectionChange}
        onContinue={mockOnContinue}
        isSubmitting={false}
        isLoading={false}
      />
    );

    fireEvent.press(getByText('Health'));
    expect(mockOnSelectionChange).toHaveBeenCalledWith(['1']);
  });

  it('debe permitir deseleccionar un módulo', () => {
    const { getByText } = render(
      <ModuleSelectionStep
        modules={mockModules}
        selectedModuleIds={['1']}
        onSelectionChange={mockOnSelectionChange}
        onContinue={mockOnContinue}
        isSubmitting={false}
        isLoading={false}
      />
    );

    fireEvent.press(getByText('Health'));
    expect(mockOnSelectionChange).toHaveBeenCalledWith([]);
  });

  it('debe seleccionar todo al presionar "Experiencia completa"', () => {
    const { getByText } = render(
      <ModuleSelectionStep
        modules={mockModules}
        selectedModuleIds={[]}
        onSelectionChange={mockOnSelectionChange}
        onContinue={mockOnContinue}
        isSubmitting={false}
        isLoading={false}
      />
    );

    fireEvent.press(getByText('Experiencia completa'));
    expect(mockOnSelectionChange).toHaveBeenCalledWith(['1', '2']);
  });

  it('debe mostrar una alerta si no se selecciona ningún módulo al continuar', () => {
    const { getByText } = render(
      <ModuleSelectionStep
        modules={mockModules}
        selectedModuleIds={[]}
        onSelectionChange={mockOnSelectionChange}
        onContinue={mockOnContinue}
        isSubmitting={false}
        isLoading={false}
      />
    );

    const continueButton = getByText('Continuar');
    fireEvent.press(continueButton);

    expect(global.alert).toHaveBeenCalledWith('Por favor selecciona al menos un módulo.');
    expect(mockOnContinue).not.toHaveBeenCalled();
  });

  it('debe llamar a onContinue si hay módulos seleccionados', () => {
    const { getByText } = render(
      <ModuleSelectionStep
        modules={mockModules}
        selectedModuleIds={['1']}
        onSelectionChange={mockOnSelectionChange}
        onContinue={mockOnContinue}
        isSubmitting={false}
        isLoading={false}
      />
    );

    const continueButton = getByText('Continuar');
    fireEvent.press(continueButton);

    expect(mockOnContinue).toHaveBeenCalled();
  });
});
