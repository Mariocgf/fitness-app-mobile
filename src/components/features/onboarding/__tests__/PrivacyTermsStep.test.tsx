import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import PrivacyTermsStep from '../PrivacyTermsStep';

describe('PrivacyTermsStep', () => {
  const mockOnContinue = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe renderizar correctamente los títulos y la información', () => {
    const { getByText } = render(
      <PrivacyTermsStep onContinue={mockOnContinue} isSubmitting={false} />
    );

    expect(getByText('Tu privacidad es lo primero.')).toBeTruthy();
    expect(getByText('Tus datos están protegidos.')).toBeTruthy();
    expect(getByText('Podés eliminar tus datos cuando quieras.')).toBeTruthy();
  });

  it('el botón debe estar deshabilitado por defecto', () => {
    const { getByText } = render(
      <PrivacyTermsStep onContinue={mockOnContinue} isSubmitting={false} />
    );

    const button = getByText('Continuar');
    // En RNTL, para verificar deshabilitado se usa el prop 'accessibilityState'
    // o se verifica que no llame al callback al ser presionado.
    fireEvent.press(button);
    expect(mockOnContinue).not.toHaveBeenCalled();
  });

  it('debe habilitar el botón cuando se acepta el switch', () => {
    const { getByRole, getByText } = render(
      <PrivacyTermsStep onContinue={mockOnContinue} isSubmitting={false} />
    );

    const switchComponent = getByRole('switch');
    fireEvent(switchComponent, 'onValueChange', true);

    const button = getByText('Continuar');
    fireEvent.press(button);

    expect(mockOnContinue).toHaveBeenCalledTimes(1);
  });

  it('debe mostrar el modal de política al presionar el link de la nota', () => {
    const { getByText } = render(
      <PrivacyTermsStep onContinue={mockOnContinue} isSubmitting={false} />
    );

    // El Modal con visible=false no monta sus hijos, así que solo existe el link.
    const policyLink = getByText('Política de Privacidad');
    fireEvent.press(policyLink);

    // Verificar que aparezca contenido que solo está en el modal
    expect(getByText('1. Marco Legal')).toBeTruthy();
  });

  it('debe mostrar un loader cuando isSubmitting es true', () => {
    const { queryByText } = render(
      <PrivacyTermsStep onContinue={mockOnContinue} isSubmitting={true} />
    );

    // El texto del botón no debería estar si hay un loader (según la lógica del componente)
    expect(queryByText('Continuar')).toBeNull();
  });
});
