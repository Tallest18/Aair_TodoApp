import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ExpoSpeechRecognitionModule as ExpoSpeechRecognitionModuleType,
  useSpeechRecognitionEvent as useSpeechRecognitionEventType,
} from 'expo-speech-recognition';

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'error';

interface UseVoiceInputResult {
  status: VoiceStatus;
  partialTranscript: string;
  errorMessage: string | null;
  isAvailable: boolean;
  start: () => Promise<void>;
  stop: () => Promise<void>;
}

// expo-speech-recognition's native module is resolved with `requireNativeModule`,
// which *throws synchronously* the moment the module is imported if the native
// module isn't linked (e.g. plain Expo Go without a custom dev client — see
// README.md). A static top-level `import` would let that throw crash the whole
// app before any of our own code runs. Using `require()` inside a try/catch
// defers that same throw to a point we control and can catch, so an unlinked
// native module degrades to "voice input unavailable" instead of a hard crash.
let ExpoSpeechRecognitionModule: typeof ExpoSpeechRecognitionModuleType | null = null;
let useSpeechRecognitionEvent: typeof useSpeechRecognitionEventType = () => undefined;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const speechRecognition = require('expo-speech-recognition');
  ExpoSpeechRecognitionModule = speechRecognition.ExpoSpeechRecognitionModule;
  useSpeechRecognitionEvent = speechRecognition.useSpeechRecognitionEvent;
} catch (error) {
  console.warn('expo-speech-recognition native module is unavailable (voice input disabled):', error);
}

/**
 * React hook that wraps expo-speech-recognition (on-device/OS speech
 * recognition — iOS Speech framework / Android SpeechRecognizer). This
 * requires a custom dev client or a bare build; it will not run inside the
 * plain "Expo Go" app. See README.md for build instructions.
 *
 * --- Swapping in the OpenAI API instead ---
 * If you'd rather transcribe with OpenAI's Whisper API (as suggested in the
 * exercise brief), the on-device recognizer above can be replaced with:
 *   1. Record audio with `expo-av` (Audio.Recording).
 *   2. POST the resulting file to `https://api.openai.com/v1/audio/transcriptions`
 *      (model: "whisper-1") with your API key in the Authorization header.
 *   3. Feed the returned `text` field into `onFinalTranscript` below exactly
 *      like the on-device result is fed in the "result" event handler.
 * This keeps the rest of the app (task splitting, list updates) unchanged
 * regardless of which transcription backend is used.
 */
export function useVoiceInput(onFinalTranscript: (transcript: string) => void): UseVoiceInputResult {
  const [status, setStatus] = useState<VoiceStatus>('idle');
  const [partialTranscript, setPartialTranscript] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const onFinalTranscriptRef = useRef(onFinalTranscript);
  onFinalTranscriptRef.current = onFinalTranscript;

  useEffect(() => {
    if (!ExpoSpeechRecognitionModule) {
      setIsAvailable(false);
      return;
    }
    try {
      setIsAvailable(ExpoSpeechRecognitionModule.isRecognitionAvailable());
    } catch (error) {
      setIsAvailable(false);
    }
  }, []);

  useSpeechRecognitionEvent('start', () => {
    setStatus('listening');
    setErrorMessage(null);
  });

  useSpeechRecognitionEvent('result', (event) => {
    const text = event.results[0]?.transcript ?? '';
    if (event.isFinal) {
      setStatus('processing');
      if (text.trim()) {
        onFinalTranscriptRef.current(text.trim());
      }
      setStatus('idle');
      setPartialTranscript('');
    } else {
      setPartialTranscript(text);
    }
  });

  useSpeechRecognitionEvent('error', (event) => {
    setStatus('error');
    setErrorMessage(event.message || 'Speech recognition failed.');
  });

  useSpeechRecognitionEvent('end', () => {
    setStatus((current) => (current === 'listening' ? 'idle' : current));
  });

  const start = useCallback(async () => {
    if (!ExpoSpeechRecognitionModule) {
      setStatus('error');
      setErrorMessage('Voice input needs a custom dev build — it is not available in Expo Go.');
      return;
    }
    try {
      setErrorMessage(null);
      setPartialTranscript('');
      const permissions = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permissions.granted) {
        setStatus('error');
        setErrorMessage('Microphone and speech recognition permission is required.');
        return;
      }
      ExpoSpeechRecognitionModule.start({
        lang: 'en-US',
        interimResults: true,
        continuous: false,
      });
      setStatus('listening');
    } catch (error) {
      setStatus('error');
      setErrorMessage('Could not start the microphone. Check permissions and try again.');
    }
  }, []);

  const stop = useCallback(async () => {
    if (!ExpoSpeechRecognitionModule) return;
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch (error) {
      // Non-fatal — the recognizer may already have stopped.
    }
  }, []);

  return { status, partialTranscript, errorMessage, isAvailable, start, stop };
}
