// jest-expo stubs native modules; give expo-crypto a real UUID source.
jest.mock('expo-crypto', () => ({ randomUUID: () => crypto.randomUUID() }));
