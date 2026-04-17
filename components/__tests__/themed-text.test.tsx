import * as React from 'react';
import { render } from '@testing-library/react-native';
import { ThemedText } from '../themed-text';

describe('ThemedText Component', () => {
  it('renders correctly with default props', () => {
    const { getByText } = render(<ThemedText>Prueba de texto</ThemedText>);
    const textElement = getByText('Prueba de texto');
    expect(textElement).toBeTruthy();
  });

  it('renders correctly as a title', () => {
    const { getByText } = render(<ThemedText type="title">Título</ThemedText>);
    const textElement = getByText('Título');
    expect(textElement).toBeTruthy();
    // Verify title style exists (basic check)
    // textElement.props.style will contain the text style array
    expect(textElement.props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ fontSize: 32 })])
    );
  });
});
