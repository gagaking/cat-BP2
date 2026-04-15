import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { playNotificationSound } from '../utils/audio';

export function useTasks() {
  const { tasks, addTask, toggleTask, deleteTask, markTaskNotified, clearCompletedTasks } = useAppStore();

  // Sort tasks: incomplete first, then by creation time
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed === b.completed) {
      return b.createdAt - a.createdAt;
    }
    return a.completed ? 1 : -1;
  });

  // Check for due tasks
  useEffect(() => {
    const checkDueTasks = () => {
      const now = Date.now();
      
      tasks.forEach(task => {
        if (!task.completed && !task.notified && task.dueDate) {
          const reminderTime = task.dueDate - (task.reminderAdvance || 0);
          
          if (now >= reminderTime) {
            playNotificationSound();
            markTaskNotified(task.id);
            window.dispatchEvent(new CustomEvent('task-due', { detail: { task } }));
          }
        }
      });
    };

    const interval = setInterval(checkDueTasks, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [tasks, markTaskNotified]);

  return {
    tasks: sortedTasks,
    addTask,
    toggleTask,
    deleteTask,
    clearCompletedTasks
  };
}
