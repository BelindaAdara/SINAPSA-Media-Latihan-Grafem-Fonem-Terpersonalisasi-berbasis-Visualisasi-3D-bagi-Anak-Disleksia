import * as Speech from 'expo-speech';

export function speakLetter(text, rate = 0.8) {
  Speech.stop();
  Speech.speak(text, { language: 'id-ID', rate, pitch: 1 });
}
