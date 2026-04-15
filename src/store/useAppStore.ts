import { create } from 'zustand';
import { PetState } from '../utils/messageGenerator';

export interface Task {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: number; // Timestamp for the task
  reminderAdvance?: number; // Milliseconds before dueDate to remind
  notified?: boolean; // Whether the reminder has been triggered
  createdAt: number;
}

export type PomodoroMode = 'idle' | 'work' | 'shortBreak' | 'longBreak';

interface AppState {
  petState: PetState;
  message: string | null;
  tasks: Task[];
  isPanelOpen: boolean;
  
  // Pet Position State
  petPosition: { x: number; y: number };
  petSnappedEdge: 'left' | 'right' | null;
  
  // Pomodoro State
  pomodoroMode: PomodoroMode;
  pomodoroTimeLeft: number;
  isPomodoroActive: boolean;
  
  // Experience/Level System
  xp: number;
  level: number;
  
  setPetState: (state: PetState) => void;
  setMessage: (message: string | null) => void;
  setPanelOpen: (isOpen: boolean) => void;
  setPetPosition: (position: { x: number; y: number }) => void;
  setPetSnappedEdge: (edge: 'left' | 'right' | null) => void;
  
  addTask: (text: string, dueDate?: number, reminderAdvance?: number) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  markTaskNotified: (id: string) => void;
  clearCompletedTasks: () => void;

  // Pomodoro Actions
  setPomodoroMode: (mode: PomodoroMode, duration: number) => void;
  setPomodoroTimeLeft: (time: number) => void;
  setIsPomodoroActive: (isActive: boolean) => void;

  // XP Actions
  addXP: (amount: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  petState: 'normal',
  message: null,
  tasks: [],
  isPanelOpen: false,

  petPosition: { x: window.innerWidth - 150, y: window.innerHeight - 200 },
  petSnappedEdge: null,

  pomodoroMode: 'idle',
  pomodoroTimeLeft: 25 * 60, // Default 25 mins
  isPomodoroActive: false,

  xp: 0,
  level: 1,

  setPetState: (state) => set({ petState: state }),
  setMessage: (message) => set({ message }),
  setPanelOpen: (isOpen) => set({ isPanelOpen: isOpen }),
  setPetPosition: (position) => set({ petPosition: position }),
  setPetSnappedEdge: (edge) => set({ petSnappedEdge: edge }),

  addTask: (text, dueDate, reminderAdvance) => set((state) => ({
    tasks: [
      ...state.tasks,
      {
        id: Math.random().toString(36).substring(2, 9),
        text: text.slice(0, 100),
        completed: false,
        dueDate,
        reminderAdvance,
        notified: false,
        createdAt: Date.now(),
      }
    ]
  })),

  toggleTask: (id) => set((state) => ({
    tasks: state.tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    )
  })),

  deleteTask: (id) => set((state) => ({
    tasks: state.tasks.filter(task => task.id !== id)
  })),

  markTaskNotified: (id) => set((state) => ({
    tasks: state.tasks.map(task => 
      task.id === id ? { ...task, notified: true } : task
    )
  })),

  clearCompletedTasks: () => set((state) => ({
    tasks: state.tasks.filter(task => !task.completed)
  })),

  setPomodoroMode: (mode, duration) => set({ pomodoroMode: mode, pomodoroTimeLeft: duration, isPomodoroActive: false }),
  setPomodoroTimeLeft: (time) => set({ pomodoroTimeLeft: time }),
  setIsPomodoroActive: (isActive) => set({ isPomodoroActive: isActive }),

  addXP: (amount) => set((state) => {
    const newXP = state.xp + amount;
    const xpNeeded = state.level * 100; // Simple level curve: 100, 200, 300...
    
    if (newXP >= xpNeeded) {
      return {
        xp: newXP - xpNeeded,
        level: state.level + 1,
        petState: 'happy',
        message: `升级啦！达到 Lv.${state.level + 1} 喵！`
      };
    }
    
    return { xp: newXP };
  }),
}));
