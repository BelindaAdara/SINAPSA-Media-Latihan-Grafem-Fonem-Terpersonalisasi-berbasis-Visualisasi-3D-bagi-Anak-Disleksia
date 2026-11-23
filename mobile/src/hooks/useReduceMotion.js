import { AccessibilityInfo } from 'react-native';
import { useEffect, useState } from 'react';

export function useReduceMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let active = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduced(Boolean(value));
    }).catch(() => {
      if (active) setReduced(false);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return reduced;
}
