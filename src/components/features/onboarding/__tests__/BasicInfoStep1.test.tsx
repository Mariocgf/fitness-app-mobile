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

    expect(getByText('Datos basico')).toBeTruthy();
    expect(getByText('Ingresa tu fecha de nacimiento')).toBeTruthy();
    expect(getByText('Selecciona tu genero')).toBeTruthy();
  });

  it('debe mostrar una alerta si se intenta continuar sin seleccionar género', () => {
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

    expect(global.alert).toHaveBeenCalledWith('Por favor selecciona tu género.');
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
    const { getByTestId } = render(
      <BasicInfoStep1
        date={defaultDate}
        onDateChange={mockOnDateChange}
        gender=""
        onGenderChange={mockOnGenderChange}
        onContinue={mockOnContinue}
      />
    );

    // Buscamos el componente Picker por su testID mockeado en jest-setup
    const picker = getByTestId('Picker');
    fireEvent(picker, 'onValueChange', 'female');

    expect(mockOnGenderChange).toHaveBeenCalledWith('female');
  });
});
