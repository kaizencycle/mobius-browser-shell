/**
 * useSpeechRecognition - Voice input hook for Jade Chamber
 * 
 * Uses the Web Speech API (SpeechRecognition) for browser-native
 * speech-to-text. Works in Chrome, Edge, Safari.
 * 
 * Mobius Substrate - Jade Pattern Oracle
 */
import { useState, useCallback, useRef } from 'react';

interface SpeechRecognitionHook {
  /** Whether speech recognition is supported in this browser */
  supported: boolean;
  /** Whether we're currently listening for speech */
  listening: boolean;
  /** Start listening for speech input */
  start: () => void;
  /** Stop listening (if continuous mode) */
  stop: () => void;
  /** Any error that occurred */
  error: string | null;
}

// Type definitions for Web Speech API (not always in TypeScript's lib)
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

/**
 * Hook for speech recognition (voice input)
 * 
 * @param onResult - Callback when speech is recognized
 * @param onInterim - Optional callback for interim results (while speaking)
 */
export function useSpeechRecognition(
  onResult: (text: string) => void,
  onInterim?: (text: string) => void
): SpeechRecognitionHook {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Check if speech recognition is supported
  const supported =
    typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  const start = useCallback(() => {
    if (!supported) {
      setError('Speech recognition not supported in this browser');
      return;
    }

    if (listening) {
      return; // Already listening
    }

    setError(null);

    // Get the SpeechRecognition constructor
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    // Configuration
    recognition.lang = 'en-US';
    recognition.continuous = false; // Stop after one utterance
    recognition.interimResults = !!onInterim; // Enable interim results if handler provided
    recognition.maxAlternatives = 1;

    // Event handlers
    recognition.onstart = () => {
      setListening(true);
      setError(null);
    };

    recognition.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const results = event.results;
      const latestResult = results[results.length - 1];
      
      if (latestResult.isFinal) {
        // Final result - send to handler
        const transcript = latestResult[0].transcript;
        onResult(transcript);
      } else if (onInterim) {
        // Interim result (still speaking)
        const transcript = latestResult[0].transcript;
        onInterim(transcript);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      
      // Map error codes to user-friendly messages
      const errorMessages: Record<string, string> = {
        'no-speech': 'No speech detected. Please try again.',
        'audio-capture': 'Microphone not available. Please check permissions.',
        'not-allowed': 'Microphone access denied. Please enable in browser settings.',
        'network': 'Network error. Please check your connection.',
        'aborted': 'Speech recognition was stopped.',
        'service-not-allowed': 'Speech recognition service not allowed.',
      };

      setError(errorMessages[event.error] || `Error: ${event.error}`);
      setListening(false);
      recognitionRef.current = null;
    };

    recognition.onnomatch = () => {
      setError('Could not understand speech. Please try again.');
    };

    // Start listening
    try {
      recognition.start();
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      setError('Failed to start speech recognition');
    }
  }, [supported, listening, onResult, onInterim]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
      recognitionRef.current = null;
    }
  }, []);

  return { supported, listening, start, stop, error };
}

/**
 * Utility hook for text-to-speech (voice output)
 */
export function useSpeechSynthesis() {
  const [speaking, setSpeaking] = useState(false);
  
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const speak = useCallback((text: string, options?: {
    rate?: number;
    pitch?: number;
    volume?: number;
    voice?: SpeechSynthesisVoice;
  }) => {
    if (!supported) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply options
    utterance.rate = options?.rate ?? 0.95;
    utterance.pitch = options?.pitch ?? 1.05;
    utterance.volume = options?.volume ?? 1.0;
    utterance.lang = 'en-US';
    
    if (options?.voice) {
      utterance.voice = options.voice;
    }

    // Event handlers
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [supported]);

  const cancel = useCallback(() => {
    if (supported) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  }, [supported]);

  const getVoices = useCallback((): SpeechSynthesisVoice[] => {
    if (!supported) return [];
    return window.speechSynthesis.getVoices();
  }, [supported]);

  return { supported, speaking, speak, cancel, getVoices };
}
