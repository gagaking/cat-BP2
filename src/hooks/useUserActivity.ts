import { useState, useEffect, useRef } from 'react';

interface UserActivity {
  isActive: boolean;
  idleTime: number;
  focusDuration: number;
}

const IDLE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

export function useUserActivity(): UserActivity {
  const [isActive, setIsActive] = useState(true);
  const [idleTime, setIdleTime] = useState(0);
  const [focusDuration, setFocusDuration] = useState(0);
  
  const lastActivityRef = useRef<number>(Date.now());
  const focusStartRef = useRef<number>(Date.now());

  useEffect(() => {
    const handleActivity = () => {
      const now = Date.now();
      lastActivityRef.current = now;
      
      if (!isActive) {
        setIsActive(true);
        focusStartRef.current = now; // Reset focus when coming back from idle
        setIdleTime(0);
      }
    };

    // Listen to mouse and keyboard events
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('scroll', handleActivity);

    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;

      if (timeSinceLastActivity > IDLE_THRESHOLD) {
        if (isActive) {
          setIsActive(false);
          // Stop accumulating focus time
        }
        setIdleTime(timeSinceLastActivity);
      } else {
        if (isActive) {
          setFocusDuration(now - focusStartRef.current);
        }
      }
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      clearInterval(interval);
    };
  }, [isActive]);

  return { isActive, idleTime, focusDuration };
}
