import React, { useState, useEffect } from 'react';
import { PetState } from '../utils/messageGenerator';

interface CatImageProps {
  state: PetState;
  isSnapped: boolean;
  className?: string;
}

export function CatImage({ state, isSnapped, className = "" }: CatImageProps) {
  const [frameIndex, setFrameIndex] = useState(0);

  // Define pools of frames for each state (x: column 0-3, y: row 0-3)
  // We are using a 4x4 grid (16 frames total)
  const frames: Record<string, {x: number, y: number}[]> = {
    normal: [{ x: 0, y: 0 }, { x: 1, y: 0 }],
    happy: [{ x: 2, y: 0 }],
    eating: [{ x: 3, y: 0 }],
    dragging: [{ x: 0, y: 1 }],
    sleeping: [{ x: 1, y: 1 }, { x: 2, y: 1 }],
    peeking: [{ x: 3, y: 1 }],
    focusing: [{ x: 0, y: 2 }],
    warning: [{ x: 1, y: 2 }],
    tired: [{ x: 2, y: 2 }],
    weather: [{ x: 3, y: 2 }],
    snapped: [{ x: 3, y: 1 }] // Same as peeking
  };

  const [imageError, setImageError] = useState(false);

  // Cycle through frames for the current state
  useEffect(() => {
    const currentPool = isSnapped ? frames.snapped : frames[state] || frames.normal;
    
    // Reset frame index when state changes
    setFrameIndex(0);

    // Do not animate if snapped
    if (isSnapped) return;

    if (currentPool.length > 1) {
      const interval = setInterval(() => {
        setFrameIndex((prev) => (prev + 1) % currentPool.length);
      }, 60000); // Change pose every 1 minute
      return () => clearInterval(interval);
    }
  }, [state, isSnapped]);

  const currentPool = isSnapped ? frames.snapped : frames[state] || frames.normal;
  const pos = currentPool[frameIndex % currentPool.length];

  if (imageError) {
    return (
      <div className={`flex items-center justify-center bg-slate-100 rounded-2xl border-2 border-dashed border-slate-300 text-slate-400 text-xs text-center p-2 ${className}`}>
        请在 public 文件夹<br/>上传 cat-sprite.png
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img 
        src="/cat-sprite.png" 
        alt="Desktop Pet"
        onError={() => setImageError(true)}
        className="absolute w-[400%] h-[400%] max-w-none pointer-events-none"
        style={{
          // Move the image to show the correct cell
          left: `-${pos.x * 100}%`,
          top: `-${pos.y * 100}%`,
          // Add a slight drop shadow to the image itself
          filter: 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.1))'
        }}
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
