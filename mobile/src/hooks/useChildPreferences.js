import { useChild } from '../context/ChildContext';

export function useChildPreferences() {
  const { child } = useChild();
  return {
    fontScale: Number(child?.settings?.font_scale || 1),
    letterSpacing: Number(child?.settings?.letter_spacing || 0.05),
    speechRate: Number(child?.settings?.speech_rate || 0.8),
    choiceCount: Number(child?.settings?.choice_count || 3),
    sessionLength: Number(child?.settings?.session_length || 10),
    weeklyTarget: Number(child?.weekly_target || 5),
  };
}
