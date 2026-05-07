import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import BasicInfoStep3 from '../BasicInfoStep3';

describe('BasicInfoStep3', () => {
  const mockGoals = [
    { id: '1', name: 'Bajar de peso' },
    { id: '2', name: 'Ganar músculo' },
    { id: '3', name: 'Mantenerse' },
    { id: '4', name: 'Mejorar salud' },
  ];

  const mockOnGoalChange = jest.fn();
  const mockOnContinue = jest.fn();
  const mockOnBack = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
  });

  it('debe renderizar la lista de objetivos', () => {
    const { getByText } = render(
      <BasicInfoStep3
        goal=""
        onGoalChange={mockOnGoalChange}
        onContinue={mockOnContinue}
        onBack={mockOnBack}
        isSubmitting={false}
        goals={mockGoals}
        isLoading={false}
      />
    );

    expect(getByText('Tu objetivo')).toBeTruthy();
    expect(getByText('Bajar de peso')).toBeTruthy();
    expect(getByText('Ganar músculo')).toBeTruthy();
  });

  it('debe mostrar el estado de carga', () => {
    const { getByText } = render(
      <BasicInfoStep3
        goal=""
        onGoalChange={mockOnGoalChange}
        onContinue={mockOnContinue}
        onBack={mockOnBack}
        isSubmitting={false}
        goals={[]}
        isLoading={true}
      />
    );

    expect(getByText('Cargando objetivos...')).toBeTruthy();
  });

  it('debe seleccionar un objetivo al presionar la tarjeta', () => {
    const { getByText } = render(
      <BasicInfoStep3
        goal=""
        onGoalChange={mockOnGoalChange}
        onContinue={mockOnContinue}
        onBack={mockOnBack}
        isSubmitting={false}
        goals={mockGoals}
        isLoading={false}
      />
    );

    fireEvent.press(getByText('Ganar músculo'));
    expect(mockOnGoalChange).toHaveBeenCalledWith('2');
  });

  it('debe mostrar alerta si intenta continuar sin objetivo', () => {
    const { getByText } = render(
      <BasicInfoStep3
        goal=""
        onGoalChange={mockOnGoalChange}
        onContinue={mockOnContinue}
        onBack={mockOnBack}
        isSubmitting={false}
        goals={mockGoals}
        isLoading={false}
      />
    );

    fireEvent.press(getByText('Continuar'));
    expect(global.alert).toHaveBeenCalledWith('Por favor selecciona tu objetivo.');
  });

  it('debe llamar a onContinue si tiene objetivo seleccionado', () => {
    const { getByText } = render(
      <BasicInfoStep3
        goal="1"
        onGoalChange={mockOnGoalChange}
        onContinue={mockOnContinue}
        onBack={mockOnBack}
        isSubmitting={false}
        goals={mockGoals}
        isLoading={false}
      />
    );

    fireEvent.press(getByText('Continuar'));
    expect(mockOnContinue).toHaveBeenCalled();
  });
});
