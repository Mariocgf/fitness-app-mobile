import '@testing-library/jest-native/extend-expect';

// 1. Mock de react-native-css-interop para evitar el error de displayName e inyección de variables
jest.mock('react-native-css-interop', () => ({
  cssInterop: (c: any) => c,
  remapProps: (c: any) => c,
  withStaticProperties: (c: any) => c,
}));

// 2. Mock de apiClient global
jest.mock('@/src/api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  },
}));

// 3. Mock de Safe Area
const SafeAreaProvider = ({ children }: any) => children;
const SafeAreaView = ({ children }: any) => children;
SafeAreaProvider.displayName = 'SafeAreaProvider';
SafeAreaView.displayName = 'SafeAreaView';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  useSafeAreaFrame: () => ({ x: 0, y: 0, width: 390, height: 844 }),
}));

// 4. Mock de alert global
global.alert = jest.fn();

// 5. Mock de componentes nativos complejos - USANDO PREFIJO mock PARA EVITAR ERRORES DE SCOPE
const mockReact = require('react');

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

jest.mock('@react-native-picker/picker', () => {
  const mReact = require('react');
  const Picker = (props: any) => mReact.createElement('Picker', { ...props, testID: 'Picker' }, props.children);
  const PickerItem = (props: any) => mReact.createElement('Text', null, props.label);
  Picker.displayName = 'Picker';
  PickerItem.displayName = 'Picker.Item';
  Picker.Item = PickerItem;
  return { Picker };
});

// 6. Mock de Expo Router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  useLocalSearchParams: () => ({}),
}));

// 7. Mock de Clerk
jest.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({
    getToken: jest.fn().mockResolvedValue('test-token'),
    userId: 'user_123',
    isSignedIn: true,
  }),
  useUser: () => ({
    user: { id: 'user_123', firstName: 'Test' },
  }),
}));

// 8. Mock de Vector Icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
  MaterialIcons: 'MaterialIcons',
}));

// 9. Mock de expo-image
jest.mock('expo-image', () => ({
  Image: 'Image',
}));
