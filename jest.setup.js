/* eslint-disable no-undef */
import '@testing-library/jest-native/extend-expect';
import 'react-native-gesture-handler/jestSetup';

// Mock AsyncStorage with the official in-memory mock.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// react-native-reanimated ships an official Jest mock (a JS-only stand-in for
// its native worklet runtime) — recommended by their own docs.
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// expo-speech-recognition is a native module with no meaningful behavior
// in a Node/Jest environment, so it's mocked out for component/unit tests.
jest.mock('expo-speech-recognition', () => ({
  __esModule: true,
  ExpoSpeechRecognitionModule: {
    isRecognitionAvailable: jest.fn().mockReturnValue(true),
    requestPermissionsAsync: jest.fn().mockResolvedValue({ granted: true }),
    start: jest.fn(),
    stop: jest.fn(),
    abort: jest.fn(),
  },
  useSpeechRecognitionEvent: jest.fn(),
}));
