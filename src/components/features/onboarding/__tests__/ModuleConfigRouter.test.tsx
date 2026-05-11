import React from 'react';
import { render } from '@testing-library/react-native';
import ModuleConfigRouter from '../ModuleConfigRouter';

// Usar mReact para evitar el plugin de NativeWind en los mocks
const mockComponent = jest.fn((props: any) => {
  const mReact = require('react');
  return mReact.createElement('View', { testID: props.testID || 'mock-component' }, null);
});

jest.mock('../HealthConfigStep', () => (props: any) => mockComponent({ ...props, testID: 'health-config' }));
jest.mock('../FitnessConfigStep', () => (props: any) => mockComponent({ ...props, testID: 'fitness-config' }));
jest.mock('../NutritionConfigStep', () => (props: any) => mockComponent({ ...props, testID: 'nutrition-config' }));

describe('ModuleConfigRouter', () => {
  const mockOnModuleConfigured = jest.fn();
  const modules = [
    { id: '1', name: 'Health', brandColor: '#000', description: '', imageUrl: '' },
    { id: '2', name: 'Fitness', brandColor: '#111', description: '', imageUrl: '' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe renderizar HealthConfigStep para el primer módulo si es Health', () => {
    const { getByTestId } = render(
      <ModuleConfigRouter
        activeModules={modules}
        currentConfigIndex={0}
        onModuleConfigured={mockOnModuleConfigured}
        isSubmitting={false}
        setIsSubmitting={jest.fn()}
        globalGoalName="Bajar de peso"
      />
    );

    expect(getByTestId('health-config')).toBeTruthy();
  });

  it('debe renderizar FitnessConfigStep si el índice apunta al segundo módulo', () => {
    const { getByTestId } = render(
      <ModuleConfigRouter
        activeModules={modules}
        currentConfigIndex={1}
        onModuleConfigured={mockOnModuleConfigured}
        isSubmitting={false}
        setIsSubmitting={jest.fn()}
        globalGoalName="Bajar de peso"
      />
    );

    expect(getByTestId('fitness-config')).toBeTruthy();
  });
});
