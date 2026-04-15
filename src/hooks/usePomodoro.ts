import { useEffect, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { playNotificationSound } from '../utils/audio';

export function usePomodoro() {
  const { 
    pomodoroMode, 
    pomodoroTimeLeft, 
    isPomodoroActive,
    setPomodoroMode,
    setPomodoroTimeLeft,
    setIsPomodoroActive,
    addXP,
    setPetState,
    setMessage
  } = useAppStore();

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPomodoroActive && pomodoroTimeLeft > 0) {
      intervalRef.current = window.setInterval(() => {
        setPomodoroTimeLeft(pomodoroTimeLeft - 1);
      }, 1000);
    } else if (isPomodoroActive && pomodoroTimeLeft === 0) {
      // Timer finished
      playNotificationSound();
      setIsPomodoroActive(false);
      
      if (pomodoroMode === 'work') {
        addXP(50); // 50 XP for a pomodoro
        setPetState('happy');
        setMessage('专注完成！+50 XP 喵~ 休息一下吧！');
      } else {
        setPetState('normal');
        setMessage('休息结束啦，准备好继续了吗喵？');
      }
      
      setTimeout(() => {
        setPetState('normal');
        setMessage(null);
      }, 5000);
      
      // Dispatch event for pet reaction
      window.dispatchEvent(new CustomEvent('pomodoro-finished', { 
        detail: { mode: pomodoroMode } 
      }));
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPomodoroActive, pomodoroTimeLeft, pomodoroMode, setPomodoroTimeLeft, setIsPomodoroActive, addXP, setPetState, setMessage]);

  const toggleTimer = () => {
    if (pomodoroMode === 'idle') {
      setPomodoroMode('work', 25 * 60);
      setIsPomodoroActive(true);
      setPetState('focusing');
      setMessage('开始专注喵！');
      setTimeout(() => setMessage(null), 3000);
    } else {
      const newActive = !isPomodoroActive;
      setIsPomodoroActive(newActive);
      if (newActive && pomodoroMode === 'work') {
        setPetState('focusing');
      } else if (!newActive) {
        setPetState('normal');
      }
    }
  };

  const resetTimer = () => {
    setIsPomodoroActive(false);
    setPetState('normal');
    if (pomodoroMode === 'work') setPomodoroTimeLeft(25 * 60);
    else if (pomodoroMode === 'shortBreak') setPomodoroTimeLeft(5 * 60);
    else if (pomodoroMode === 'longBreak') setPomodoroTimeLeft(15 * 60);
  };

  const setMode = (mode: 'work' | 'shortBreak' | 'longBreak') => {
    const duration = mode === 'work' ? 25 * 60 : mode === 'shortBreak' ? 5 * 60 : 15 * 60;
    setPomodoroMode(mode, duration);
    if (mode === 'work') {
      setPetState('focusing');
    } else {
      setPetState('sleeping');
    }
  };

  return {
    mode: pomodoroMode,
    timeLeft: pomodoroTimeLeft,
    isActive: isPomodoroActive,
    toggleTimer,
    resetTimer,
    setMode
  };
}
