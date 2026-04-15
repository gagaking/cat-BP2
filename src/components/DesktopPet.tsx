import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PetState } from '../utils/messageGenerator';
import { cn } from '../lib/utils';
import { CatImage } from './CatImage';
import { useAppStore } from '../store/useAppStore';

interface DesktopPetProps {
  state: PetState;
  message: string | null;
  onClick: () => void;
}

export function DesktopPet({ state, message, onClick }: DesktopPetProps) {
  const { petPosition, setPetPosition, petSnappedEdge, setPetSnappedEdge, setPetState, setMessage, addTask } = useAppStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isFeeding, setIsFeeding] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  
  // Petting detection
  const lastMousePos = useRef({ x: 0, y: 0 });
  const mouseMovement = useRef(0);
  const pettingTimer = useRef<NodeJS.Timeout | null>(null);

  // Handle window resize to keep pet on screen
  useEffect(() => {
    const handleResize = () => {
      setPetPosition({
        x: Math.min(petPosition.x, window.innerWidth - 100),
        y: Math.min(petPosition.y, window.innerHeight - 100)
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [petPosition, setPetPosition]);

  // Determine actual visual state based on interactions
  const getVisualState = (): PetState => {
    if (isDragging) return 'dragging';
    if (isFeeding) return 'eating';
    return state;
  };

  const visualState = getVisualState();

  const getPetAnimation = () => {
    // If the sprite's peeking cat is drawn on the right edge looking left:
    // Snapped to right edge -> normal (scaleX: 1)
    // Snapped to left edge -> flipped (scaleX: -1)
    const isFlipped = petSnappedEdge === 'left' && !isHovered;
    const scaleX = isFlipped ? -1 : 1;

    // When snapped, we don't want the bouncing animations
    if (petSnappedEdge && !isHovered) {
      return { y: 0, scaleX, transition: { duration: 0.3 } };
    }

    switch (visualState) {
      case 'happy':
      case 'eating':
        return { y: [0, -15, 0], scaleX, transition: { repeat: Infinity, duration: 0.8, ease: "easeInOut" } };
      case 'tired':
      case 'sleeping':
        return { scale: [1, 0.95, 1], y: [0, 2, 0], scaleX, transition: { repeat: Infinity, duration: 3, ease: "easeInOut" } };
      case 'warning':
        return { x: [-3, 3, -3, 3, 0], scaleX, transition: { repeat: Infinity, duration: 0.5, repeatDelay: 1.5 } };
      case 'dragging':
        return { rotate: [-5, 5, -5], scaleX, transition: { repeat: Infinity, duration: 0.5 } };
      case 'normal':
      default:
        return { y: [0, -5, 0], scaleX, transition: { repeat: Infinity, duration: 3, ease: "easeInOut" } };
    }
  };

  const handleDragEnd = (e: any, info: any) => {
    setTimeout(() => setIsDragging(false), 100);
    
    const newX = petPosition.x + info.offset.x;
    const newY = petPosition.y + info.offset.y;
    const screenW = window.innerWidth;
    
    let finalX = newX;
    let snap: 'left' | 'right' | null = null;
    
    // Snap to edges if close enough (within 50px)
    if (newX < 50) {
      finalX = -40; // Hide half of it
      snap = 'left';
    } else if (newX > screenW - 130) { // 80px width + 50px threshold
      finalX = screenW - 40;
      snap = 'right';
    }
    
    setPetSnappedEdge(snap);
    setPetPosition({ x: finalX, y: newY });
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowMenu(!showMenu);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging || state === 'sleeping') return;
    
    const dx = Math.abs(e.clientX - lastMousePos.current.x);
    const dy = Math.abs(e.clientY - lastMousePos.current.y);
    mouseMovement.current += dx + dy;
    
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    // If moved enough, trigger petting
    if (mouseMovement.current > 500) {
      setPetState('happy');
      setMessage("呼噜噜...好舒服喵~");
      mouseMovement.current = 0;
      
      if (pettingTimer.current) clearTimeout(pettingTimer.current);
      pettingTimer.current = setTimeout(() => {
        setPetState('normal');
        setMessage(null);
      }, 3000);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsFeeding(false);
    
    const text = e.dataTransfer.getData('text');
    if (text) {
      addTask(text);
      setMessage("啊呜！吃掉了一个任务喵！");
      setPetState('eating');
      setTimeout(() => {
        setPetState('normal');
        setMessage(null);
      }, 3000);
    }
  };

  // Calculate display position based on hover and snap state
  const displayX = petSnappedEdge && isHovered 
    ? (petSnappedEdge === 'left' ? 10 : window.innerWidth - 110) 
    : petPosition.x;

  return (
    <motion.div
      ref={dragRef}
      drag
      dragMomentum={false}
      onDragStart={() => {
        setIsDragging(true);
        setShowMenu(false);
        setPetSnappedEdge(null);
      }}
      onDragEnd={handleDragEnd}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        mouseMovement.current = 0;
      }}
      onMouseMove={handleMouseMove}
      onContextMenu={handleContextMenu}
      onDragOver={(e) => {
        e.preventDefault();
        setIsFeeding(true);
      }}
      onDragLeave={() => setIsFeeding(false)}
      onDrop={handleDrop}
      initial={petPosition}
      animate={{ x: displayX, y: petPosition.y }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{ position: 'fixed', zIndex: 9999, touchAction: 'none' }}
      className="flex flex-col items-center"
    >
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute -top-40 bg-white rounded-xl shadow-lg border border-slate-100 p-2 flex flex-col gap-1 min-w-[110px] z-50"
          >
            <button onClick={() => { setPetState('sleeping'); setShowMenu(false); }} className="text-xs text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-slate-600 font-medium">💤 睡觉</button>
            <button onClick={() => { setPetState('normal'); setShowMenu(false); }} className="text-xs text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-slate-600 font-medium">☀️ 醒来</button>
            <button onClick={() => { 
              setPetState('eating'); 
              setMessage('吧唧吧唧...好吃喵！');
              setShowMenu(false); 
              setTimeout(() => { setPetState('normal'); setMessage(null); }, 3000);
            }} className="text-xs text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-slate-600 font-medium">🐟 喂食</button>
            <button onClick={() => { onClick(); setShowMenu(false); }} className="text-xs text-left px-3 py-2 hover:bg-slate-50 rounded-lg text-slate-600 font-medium">📋 打开面板</button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {message && !petSnappedEdge && !showMenu && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, y: 10, scale: 0.8, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute bottom-full mb-2 drop-shadow-[0_8px_15px_rgba(0,0,0,0.12)] z-40 pointer-events-none"
          >
            <div className="px-4 py-2.5 bg-white rounded-3xl border-2 border-slate-100 text-sm font-bold text-slate-700 max-w-[160px] text-center tracking-wide relative z-10">
              {message}
            </div>
            {/* Seamless tail using rotated square overlapping the border */}
            <div 
              className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white border-b-2 border-r-2 border-slate-100 rotate-45 z-20 rounded-br-[2px]"
            ></div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={getPetAnimation()}
        onClick={() => {
          if (!isDragging) {
            setShowMenu(false);
            onClick();
          }
        }}
        className={cn(
          "w-28 h-28 cursor-pointer select-none transition-opacity duration-500 relative",
          petSnappedEdge && !isHovered ? "opacity-80" : "opacity-100",
          isFeeding && "scale-110 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <CatImage 
          state={visualState} 
          isSnapped={petSnappedEdge !== null && !isHovered} 
          className="w-full h-full" 
        />
      </motion.div>
    </motion.div>
  );
}
