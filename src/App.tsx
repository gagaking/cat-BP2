/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { DesktopPet } from './components/DesktopPet';
import { TaskPanel } from './components/TaskPanel';
import { useAppStore } from './store/useAppStore';
import { useReminderEngine } from './hooks/useReminderEngine';
import { generatePetMessage } from './utils/messageGenerator';
import { useUserActivity } from './hooks/useUserActivity';

export default function App() {
  const { 
    petState, 
    setPetState, 
    message, 
    setMessage, 
    isPanelOpen, 
    setPanelOpen,
    tasks
  } = useAppStore();
  
  const reminderState = useReminderEngine();
  const { isActive } = useUserActivity();

  // Handle reminders
  useEffect(() => {
    if (reminderState.shouldRemind && reminderState.type) {
      setPetState(reminderState.level === 'high' ? 'warning' : 'tired');
      setMessage(generatePetMessage(reminderState.type));
      import('./utils/audio').then(m => m.playNotificationSound());
    } else if (!isActive) {
      setPetState('normal');
      setMessage(generatePetMessage('idle'));
    } else {
      // Return to normal if active and no reminders
      if (petState === 'tired' || petState === 'warning') {
        setPetState('normal');
        setMessage(null);
      }
    }
  }, [reminderState.shouldRemind, reminderState.type, isActive]);

  // Handle task events
  useEffect(() => {
    const handleTaskDue = (e: Event) => {
      const customEvent = e as CustomEvent;
      setPetState('warning');
      setMessage(`任务提醒: ${customEvent.detail?.task?.text || '有任务到期啦'}`);
    };

    const handlePomodoroFinished = (e: Event) => {
      const customEvent = e as CustomEvent;
      const mode = customEvent.detail?.mode;
      setPetState('happy');
      if (mode === 'work') {
        setMessage('专注完成！休息一下吧~');
      } else {
        setMessage('休息结束！准备开始工作啦~');
      }
      setPanelOpen(true); // Open panel to show timer
    };

    window.addEventListener('task-due', handleTaskDue);
    window.addEventListener('pomodoro-finished', handlePomodoroFinished);
    
    return () => {
      window.removeEventListener('task-due', handleTaskDue);
      window.removeEventListener('pomodoro-finished', handlePomodoroFinished);
    };
  }, [setPetState, setMessage, setPanelOpen]);

  // Clear message after a few seconds if it's not a persistent warning
  useEffect(() => {
    if (message && petState !== 'warning') {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, petState, setMessage]);

  // Watch for task completion to show happy state
  const prevCompletedCount = React.useRef(0);
  useEffect(() => {
    const completedTasks = tasks.filter(t => t.completed).length;
    if (completedTasks > prevCompletedCount.current) {
      setPetState('happy');
      setMessage(generatePetMessage('task_completed'));
      setTimeout(() => {
        setPetState('normal');
        setMessage(null);
      }, 3000);
    }
    prevCompletedCount.current = completedTasks;
  }, [tasks, setPetState, setMessage]);

  const handlePetClick = () => {
    setPanelOpen(!isPanelOpen);
    window.dispatchEvent(new CustomEvent('pet-interacted'));
    
    if (!isPanelOpen) {
      setPetState('happy');
      setMessage(generatePetMessage('focus'));
      setTimeout(() => {
        setPetState('normal');
        setMessage(null);
      }, 3000);
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-transparent pointer-events-none">
      {/* 
        The main container is pointer-events-none so clicks pass through to the desktop.
        Individual components re-enable pointer events.
      */}
      <div className="pointer-events-auto">
        <DesktopPet 
          state={petState} 
          message={message} 
          onClick={handlePetClick} 
        />
        <TaskPanel 
          isOpen={isPanelOpen} 
          onClose={() => setPanelOpen(false)} 
        />
      </div>
    </div>
  );
}
