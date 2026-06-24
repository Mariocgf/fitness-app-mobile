import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import BasicInfoStep2 from '../BasicInfoStep2';

// Mock minimalista usando mReact para evitar el plugin de NativeWind
jest.mock('@/src/components/common/WheelPicker', () => {
  return function MockWheelPicker(props: any) {
    const mReact = require('react');
    // Usar una cadena simple 'View' evita que el plugin intente inyectar variables interop
    return mReact.createElement('View', {
      testID: `picker-${props.label.toLowerCase()}`,
      // Guardar el callback en una prop para poder llamarlo en el test
      onChange: props.onChange
    }, null);
  };
});

describe('BasicInfoStep2', () => {
  const mockOnWeightChange = jest.fn();
  const mockOnHeightChange = jest.fn();
  const mockOnContinue = jest.fn();
  const mockOnBack = jest.fn();

  it('debe renderizar y llamar a los callbacks al simular cambios', () => {
    const { getByTestId, getByText } = render(
      <BasicInfoStep2
        weight={70}
        onWeightChange={mockOnWeightChange}
        height={170}
        onHeightChange={mockOnHeightChange}
        onContinue={mockOnContinue}
        onBack={mockOnBack}
      />
    );

    expect(getByTestId('picker-peso')).toBeTruthy();
    
    // Simular cambio de valor disparando la prop onChange del mock
    fireEvent(getByTestId('picker-peso'), 'onChange', 75);
    expect(mockOnWeightChange).toHaveBeenCalledWith(75);

    fireEvent.press(getByText('Continuar'));
    expect(mockOnContinue).toHaveBeenCalled();
  });
});
