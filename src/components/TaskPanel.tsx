import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Circle, Trash2, Plus, X, Clock, Play, Square, MessageSquare, ListTodo, Send } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import { usePomodoro } from '../hooks/usePomodoro';
import { useAppStore } from '../store/useAppStore';
import { cn } from '../lib/utils';

interface TaskPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export function TaskPanel({ isOpen, onClose }: TaskPanelProps) {
  const { tasks, addTask, toggleTask, deleteTask } = useTasks();
  const { mode, timeLeft, isActive, toggleTimer, resetTimer, setMode } = usePomodoro();
  const { petPosition, level, xp, addXP, setPetState, setMessage } = useAppStore();
  
  const [activeTab, setActiveTab] = useState<'tasks' | 'chat'>('tasks');
  const [newTaskText, setNewTaskText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [reminderAdvance, setReminderAdvance] = useState<number>(0);

  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Set default date and time when panel opens
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      setDueDate(`${year}-${month}-${day}`);
      
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setDueTime(`${hours}:${minutes}`);
    }
  }, [isOpen]);

  // Scroll to bottom of chat
  useEffect(() => {
    if (activeTab === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, activeTab, isTyping]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      let timestamp: number | undefined = undefined;
      
      if (dueDate && dueTime) {
        timestamp = new Date(`${dueDate}T${dueTime}`).getTime();
      } else if (dueDate) {
        timestamp = new Date(`${dueDate}T23:59:00`).getTime();
      }

      addTask(newTaskText.trim(), timestamp, reminderAdvance);
      setNewTaskText('');
      
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      setDueDate(`${year}-${month}-${day}`);
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setDueTime(`${hours}:${minutes}`);
      
      setReminderAdvance(0);
    }
  };

  const handleToggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task && !task.completed) {
      addXP(10); // 10 XP for completing a task
      setPetState('happy');
      setMessage('完成了一个任务！+10 XP 喵~');
      setTimeout(() => {
        setPetState('normal');
        setMessage(null);
      }, 3000);
    }
    toggleTask(id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      // Local Ollama API endpoint
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemma4:e4b', // Defaulting to a good local model, can be made configurable
          messages: [
            { 
              role: 'system', 
              content: '你是一个可爱的桌面宠物助手，名叫小猫。你的回复要简短、可爱、带一点猫咪的语气（比如句尾加“喵”）。你的主要任务是陪伴用户、提醒他们休息和专注。不要输出长篇大论。' 
            },
            ...chatHistory,
            { role: 'user', content: userMsg }
          ],
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error('Ollama API error');
      }

      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.message.content }]);
    } catch (error) {
      console.error("Chat error:", error);
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: '呜呜，我联系不上本地的大脑了喵... 请确保你已经安装并启动了 Ollama，并且下载了 qwen2.5 模型喵！(可以在终端运行 `ollama run qwen2.5`)' 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatTaskDate = (timestamp?: number) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && 
                    date.getMonth() === now.getMonth() && 
                    date.getFullYear() === now.getFullYear();
    
    if (isToday) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // Calculate panel position to follow the pet
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;
  const panelWidth = 320;
  const panelHeight = 550; // approximate max height
  
  let panelLeft = petPosition.x > screenW / 2 ? petPosition.x - panelWidth - 20 : petPosition.x + 130;
  let panelTop = petPosition.y - 100;
  
  // Keep panel within screen bounds
  panelLeft = Math.max(10, Math.min(panelLeft, screenW - panelWidth - 10));
  panelTop = Math.max(10, Math.min(panelTop, screenH - panelHeight - 10));

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: petPosition.x > screenW / 2 ? 20 : -20 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, x: petPosition.x > screenW / 2 ? 20 : -20 }}
          transition={{ duration: 0.2 }}
          style={{ 
            position: 'fixed', 
            left: panelLeft, 
            top: panelTop,
            zIndex: 9998 
          }}
          className="w-80 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header with Tabs */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <div className="flex gap-1 bg-slate-200/50 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab('tasks')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5",
                    activeTab === 'tasks' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <ListTodo size={16} strokeWidth={2.5} /> 任务
                </button>
                <button
                  onClick={() => setActiveTab('chat')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-sm font-bold transition-all flex items-center gap-1.5",
                    activeTab === 'chat' ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <MessageSquare size={16} strokeWidth={2.5} /> 聊天
                </button>
              </div>
              <button 
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/50 transition-colors"
              >
                <X size={16} strokeWidth={3} />
              </button>
            </div>
            
            {/* XP Bar */}
            <div className="flex items-center gap-2 px-1">
              <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                Lv.{level}
              </div>
              <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-500 ease-out" 
                  style={{ width: `${(xp / (level * 100)) * 100}%` }}
                />
              </div>
              <div className="text-[10px] font-medium text-slate-400 tabular-nums">
                {xp}/{level * 100}
              </div>
            </div>
          </div>

          {activeTab === 'tasks' ? (
            <>
              {/* Compact Pomodoro Section */}
              <div className="px-4 py-3 border-b border-slate-100 bg-white flex items-center justify-between">
                <div className="flex gap-1 bg-slate-100/50 p-1 rounded-lg">
                  <button 
                    onClick={() => setMode('work')}
                    className={cn("text-[10px] px-2 py-1 rounded-md transition-all font-bold", mode === 'work' ? "bg-red-100 text-red-600" : "text-slate-500 hover:text-slate-700")}
                  >
                    专注
                  </button>
                  <button 
                    onClick={() => setMode('shortBreak')}
                    className={cn("text-[10px] px-2 py-1 rounded-md transition-all font-bold", mode === 'shortBreak' ? "bg-green-100 text-green-600" : "text-slate-500 hover:text-slate-700")}
                  >
                    休息
                  </button>
                </div>
                
                <div className="text-2xl font-bold text-slate-800 tracking-tighter tabular-nums">
                  {formatTime(timeLeft)}
                </div>
                
                <div className="flex gap-1.5">
                  <button 
                    onClick={toggleTimer}
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full text-white shadow-sm transition-all active:scale-90",
                      isActive ? "bg-orange-400 hover:bg-orange-500" : "bg-indigo-500 hover:bg-indigo-600"
                    )}
                  >
                    {isActive ? <Square size={12} fill="currentColor" /> : <Play size={14} fill="currentColor" className="ml-0.5" />}
                  </button>
                  <button 
                    onClick={resetTimer}
                    className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all active:scale-90"
                  >
                    <Clock size={14} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* Tasks Section */}
              <div className="flex-1 overflow-y-auto p-3 bg-slate-50/50 min-h-[200px]">
                {tasks.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm flex flex-col items-center justify-center h-full">
                    <div className="text-4xl mb-3 opacity-50">🌱</div>
                    <p className="font-medium">暂无任务</p>
                    <p className="text-xs mt-1 opacity-70">和小猫一起休息一下吧~</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {tasks.map(task => (
                      <motion.li 
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        key={task.id}
                        className="group flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-indigo-100 hover:shadow transition-all"
                      >
                        <button 
                          onClick={() => handleToggleTask(task.id)}
                          className={cn(
                            "flex-shrink-0 transition-colors",
                            task.completed ? "text-green-400" : "text-slate-300 hover:text-indigo-400"
                          )}
                        >
                          {task.completed ? <CheckCircle2 size={20} fill="currentColor" className="text-white" /> : <Circle size={20} strokeWidth={2.5} />}
                        </button>
                        
                        <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                          <div 
                            className={cn(
                              "text-sm font-medium transition-all truncate",
                              task.completed ? "text-slate-400 line-through" : "text-slate-700"
                            )}
                            title={task.text}
                          >
                            {task.text}
                          </div>
                          {task.dueDate && (
                            <div className={cn(
                              "text-[11px] flex items-center gap-1 font-medium whitespace-nowrap flex-shrink-0",
                              task.completed ? "text-slate-400" : (task.dueDate < Date.now() ? "text-red-500" : "text-indigo-500")
                            )}>
                              <Clock size={12} strokeWidth={2.5} />
                              {formatTaskDate(task.dueDate)}
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => deleteTask(task.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all flex-shrink-0"
                        >
                          <Trash2 size={16} strokeWidth={2.5} />
                        </button>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Add Task Form */}
              <div className="p-4 border-t border-slate-100 bg-white">
                <form onSubmit={handleAddTask} className="flex flex-col gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={newTaskText}
                      onChange={(e) => setNewTaskText(e.target.value)}
                      placeholder="添加新任务..."
                      maxLength={100}
                      className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-400 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 transition-all outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!newTaskText.trim()}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      <Plus size={18} strokeWidth={3} />
                    </button>
                  </div>
                  
                  <div className="flex gap-2 items-center">
                    <input 
                      type="date" 
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="flex-1 bg-slate-50 text-xs font-medium px-3 py-2 rounded-xl border-2 border-transparent focus:border-indigo-400 outline-none text-slate-600 transition-all"
                    />
                    <input 
                      type="time" 
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      className="flex-1 bg-slate-50 text-xs font-medium px-3 py-2 rounded-xl border-2 border-transparent focus:border-indigo-400 outline-none text-slate-600 transition-all"
                    />
                  </div>
                  
                  {(dueDate || dueTime) && (
                    <select 
                      value={reminderAdvance}
                      onChange={(e) => setReminderAdvance(Number(e.target.value))}
                      className="w-full bg-slate-50 text-xs font-medium px-3 py-2 rounded-xl border-2 border-transparent focus:border-indigo-400 outline-none text-slate-600 transition-all cursor-pointer"
                    >
                      <option value={0}>准时提醒</option>
                      <option value={5 * 60 * 1000}>提前 5 分钟</option>
                      <option value={15 * 60 * 1000}>提前 15 分钟</option>
                      <option value={30 * 60 * 1000}>提前 30 分钟</option>
                      <option value={60 * 60 * 1000}>提前 1 小时</option>
                    </select>
                  )}
                </form>
              </div>
            </>
          ) : (
            <>
              {/* Chat Section */}
              <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 min-h-[300px] flex flex-col gap-3">
                {chatHistory.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-sm flex flex-col items-center justify-center h-full">
                    <div className="text-4xl mb-3 opacity-50">🐱</div>
                    <p className="font-medium">我是你的桌面小猫</p>
                    <p className="text-xs mt-1 opacity-70">有什么想跟我说的喵？</p>
                    <p className="text-[10px] mt-4 opacity-50 max-w-[200px]">
                      (需要本地运行 Ollama 并下载 qwen2.5 模型)
                    </p>
                  </div>
                ) : (
                  chatHistory.map((msg, i) => (
                    <div 
                      key={i} 
                      className={cn(
                        "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                        msg.role === 'user' 
                          ? "bg-indigo-500 text-white self-end rounded-tr-sm" 
                          : "bg-white border border-slate-100 text-slate-700 self-start rounded-tl-sm shadow-sm"
                      )}
                    >
                      {msg.content}
                    </div>
                  ))
                )}
                {isTyping && (
                  <div className="bg-white border border-slate-100 text-slate-400 self-start rounded-2xl rounded-tl-sm shadow-sm px-4 py-2 text-sm flex gap-1">
                    <span className="animate-bounce">.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: '0.4s' }}>.</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
              
              {/* Chat Input */}
              <div className="p-3 border-t border-slate-100 bg-white">
                <form onSubmit={handleSendMessage} className="relative">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="和小猫聊天..."
                    className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border-2 border-transparent focus:bg-white focus:border-indigo-400 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-400 transition-all outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isTyping}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  >
                    <Send size={16} strokeWidth={2.5} />
                  </button>
                </form>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
