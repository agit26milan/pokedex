// AsyncStorage is a native module, so Jest needs the package's own in-memory mock.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Safe-area is a native module too; the package ships a Jest mock for it. Its mock file uses a
// default export while the real module uses named ones, so `.default` is what has to be returned.
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
