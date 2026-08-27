// AsyncStorage — единственный нативный модуль, который трогает store/useAppStore.ts на импорте.
// Под jest нативных биндингов нет, поэтому подставляем официальный in-memory мок пакета.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
