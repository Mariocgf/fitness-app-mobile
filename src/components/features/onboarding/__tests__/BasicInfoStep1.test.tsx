import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import BasicInfoStep1 from '../BasicInfoStep1';

// Los mocks globales están en jest-setup.ts

describe('BasicInfoStep1', () => {
  const mockOnDateChange = jest.fn();
  const mockOnGenderChange = jest.fn();
  const mockOnContinue = jest.fn();
  const defaultDate = new Date(2000, 0, 1);

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
  });

  it('debe renderizar correctamente los campos iniciales', () => {
    const { getByText } = render(
      <BasicInfoStep1
        date={defaultDate}
        onDateChange={mockOnDateChange}
        gender=""
        onGenderChange={mockOnGenderChange}
        onContinue={mockOnContinue}
      />
    );

    expect(getByText('Datos básicos')).toBeTruthy();
    expect(getByText('Fecha de nacimiento')).toBeTruthy();
    expect(getByText('Género')).toBeTruthy();
    // Solo dos géneros, sin "Otro"
    expect(getByText('Masculino')).toBeTruthy();
    expect(getByText('Femenino')).toBeTruthy();
  });

  it('no debe avanzar si no se seleccionó género (botón deshabilitado)', () => {
    const { getByText } = render(
      <BasicInfoStep1
        date={defaultDate}
        onDateChange={mockOnDateChange}
        gender=""
        onGenderChange={mockOnGenderChange}
        onContinue={mockOnContinue}
      />
    );

    const continueButton = getByText('Continuar');
    fireEvent.press(continueButton);

    expect(mockOnContinue).not.toHaveBeenCalled();
  });

  it('debe llamar a onContinue si el género está seleccionado', () => {
    const { getByText } = render(
      <BasicInfoStep1
        date={defaultDate}
        onDateChange={mockOnDateChange}
        gender="male"
        onGenderChange={mockOnGenderChange}
        onContinue={mockOnContinue}
      />
    );

    const continueButton = getByText('Continuar');
    fireEvent.press(continueButton);

    expect(mockOnContinue).toHaveBeenCalled();
  });

  it('debe llamar a onGenderChange al seleccionar una opción', () => {
    const { getByText } = render(
      <BasicInfoStep1
        date={defaultDate}
        onDateChange={mockOnDateChange}
        gender=""
        onGenderChange={mockOnGenderChange}
        onContinue={mockOnContinue}
      />
    );

    fireEvent.press(getByText('Femenino'));

    expect(mockOnGenderChange).toHaveBeenCalledWith('female');
  });
});
