import { useState, useEffect, useRef } from 'react';
import { useUserActivity } from './useUserActivity';

export type ReminderLevel = "low" | "medium" | "high";
export type ReminderType = "posture" | "rest" | null;

interface ReminderState {
  shouldRemind: boolean;
  level: ReminderLevel;
  type: ReminderType;
}

// Configuration
const POSTURE_INTERVAL = 20 * 60 * 1000; // 20 minutes
const REST_INTERVAL = 45 * 60 * 1000; // 45 minutes
const MIN_REMINDER_INTERVAL = 10 * 60 * 1000; // 10 minutes between reminders

export function useReminderEngine(): ReminderState {
  const { isActive, focusDuration } = useUserActivity();
  const [state, setState] = useState<ReminderState>({
    shouldRemind: false,
    level: "low",
    type: null,
  });

  const lastReminderTimeRef = useRef<number>(Date.now());
  const ignoreCountRef = useRef<number>(0);

  useEffect(() => {
    if (!isActive) {
      // Don't remind if user is idle
      if (state.shouldRemind) {
        setState({ shouldRemind: false, level: "low", type: null });
      }
      return;
    }

    const checkReminders = () => {
      const now = Date.now();
      const timeSinceLastReminder = now - lastReminderTimeRef.current;

      // Ensure minimum interval between reminders
      if (timeSinceLastReminder < MIN_REMINDER_INTERVAL) {
        return;
      }

      // Add random jitter (±2 minutes) to avoid mechanical feeling
      const jitter = (Math.random() - 0.5) * 4 * 60 * 1000;

      let newType: ReminderType = null;
      let newLevel: ReminderLevel = "low";

      // Check for rest (higher priority)
      if (focusDuration > REST_INTERVAL + jitter) {
        newType = "rest";
        newLevel = ignoreCountRef.current > 2 ? "high" : "medium";
      } 
      // Check for posture
      else if (focusDuration > POSTURE_INTERVAL + jitter) {
        newType = "posture";
        newLevel = ignoreCountRef.current > 2 ? "medium" : "low";
      }

      if (newType) {
        setState({
          shouldRemind: true,
          level: newLevel,
          type: newType,
        });
        lastReminderTimeRef.current = now;
        ignoreCountRef.current += 1; // Increment ignore count, reset when user interacts
      }
    };

    const interval = setInterval(checkReminders, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [isActive, focusDuration, state.shouldRemind]);

  // Expose a way to reset ignore count (e.g., when user clicks the pet)
  useEffect(() => {
    const handleInteraction = () => {
      if (state.shouldRemind) {
        setState({ shouldRemind: false, level: "low", type: null });
        ignoreCountRef.current = 0;
      }
    };
    
    window.addEventListener('pet-interacted', handleInteraction);
    return () => window.removeEventListener('pet-interacted', handleInteraction);
  }, [state.shouldRemind]);

  return state;
}
