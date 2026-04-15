import React from 'react';
import { PetState } from '../utils/messageGenerator';

interface CatSvgProps {
  state: PetState;
  className?: string;
}

export function CatSvg({ state, className = "" }: CatSvgProps) {
  // Base colors
  const catColor = "#FFFFFF";
  const outlineColor = "#475569"; // slate-600
  const accentColor = "#FCA5A5"; // red-300 (blush/inside ears)
  const spotColor = "#FDBA74"; // orange-300 (spots)

  const renderEyes = () => {
    switch (state) {
      case 'happy':
        return (
          <g stroke={outlineColor} strokeWidth="3" strokeLinecap="round" fill="none">
            <path d="M 30 55 Q 35 48 40 55" />
            <path d="M 60 55 Q 65 48 70 55" />
          </g>
        );
      case 'tired':
        return (
          <g stroke={outlineColor} strokeWidth="3" strokeLinecap="round" fill="none">
            <path d="M 30 55 L 40 55" />
            <path d="M 60 55 L 70 55" />
            {/* Dark circles */}
            <path d="M 30 60 Q 35 63 40 60" stroke="#CBD5E1" strokeWidth="2" />
            <path d="M 60 60 Q 65 63 70 60" stroke="#CBD5E1" strokeWidth="2" />
            {/* Zzz */}
            <text x="75" y="30" fill="#94A3B8" fontSize="12" fontWeight="bold" className="animate-pulse">Z</text>
            <text x="85" y="20" fill="#94A3B8" fontSize="8" fontWeight="bold" className="animate-pulse" style={{ animationDelay: '0.5s' }}>z</text>
          </g>
        );
      case 'warning':
        return (
          <g fill={outlineColor}>
            <circle cx="35" cy="52" r="5" />
            <circle cx="65" cy="52" r="5" />
            {/* Exclamation mark */}
            <path d="M 80 15 L 80 30 M 80 35 L 80 38" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" />
          </g>
        );
      case 'normal':
      default:
        return (
          <g fill={outlineColor}>
            <circle cx="35" cy="55" r="4" />
            <circle cx="65" cy="55" r="4" />
          </g>
        );
    }
  };

  const renderMouth = () => {
    switch (state) {
      case 'happy':
        return <path d="M 45 62 Q 50 68 55 62" fill="none" stroke={outlineColor} strokeWidth="3" strokeLinecap="round" />;
      case 'tired':
        return <path d="M 47 65 L 53 65" fill="none" stroke={outlineColor} strokeWidth="3" strokeLinecap="round" />;
      case 'warning':
        return <circle cx="50" cy="65" r="3" fill={outlineColor} />;
      case 'normal':
      default:
        return (
          <g fill="none" stroke={outlineColor} strokeWidth="2" strokeLinecap="round">
            <path d="M 45 63 Q 47.5 66 50 63" />
            <path d="M 50 63 Q 52.5 66 55 63" />
          </g>
        );
    }
  };

  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Left Ear */}
      <path d="M 25 40 L 15 15 L 45 30 Z" fill={catColor} stroke={outlineColor} strokeWidth="4" strokeLinejoin="round" />
      <path d="M 24 35 L 20 22 L 38 30 Z" fill={accentColor} opacity="0.6" />
      
      {/* Right Ear */}
      <path d="M 75 40 L 85 15 L 55 30 Z" fill={catColor} stroke={outlineColor} strokeWidth="4" strokeLinejoin="round" />
      <path d="M 76 35 L 80 22 L 62 30 Z" fill={accentColor} opacity="0.6" />

      {/* Tail (animated slightly based on state) */}
      <path 
        d={state === 'happy' ? "M 80 80 Q 95 70 90 50" : "M 80 80 Q 95 85 90 70"} 
        fill="none" 
        stroke={catColor} 
        strokeWidth="12" 
        strokeLinecap="round" 
      />
      <path 
        d={state === 'happy' ? "M 80 80 Q 95 70 90 50" : "M 80 80 Q 95 85 90 70"} 
        fill="none" 
        stroke={outlineColor} 
        strokeWidth="4" 
        strokeLinecap="round" 
      />

      {/* Body/Face */}
      <rect x="15" y="30" width="70" height="60" rx="30" fill={catColor} stroke={outlineColor} strokeWidth="4" />
      
      {/* Head Spot */}
      <path d="M 35 30 Q 50 45 65 30 Z" fill={spotColor} opacity="0.8" />

      {/* Blush */}
      {state !== 'tired' && (
        <g fill={accentColor} opacity="0.4">
          <circle cx="25" cy="60" r="5" />
          <circle cx="75" cy="60" r="5" />
        </g>
      )}

      {/* Whiskers */}
      <g stroke={outlineColor} strokeWidth="2" strokeLinecap="round" opacity="0.5">
        <path d="M 5 55 L 15 57" />
        <path d="M 5 62 L 15 60" />
        <path d="M 95 55 L 85 57" />
        <path d="M 95 62 L 85 60" />
      </g>

      {/* Eyes and Mouth */}
      {renderEyes()}
      {renderMouth()}
      
      {/* Little Paws */}
      <circle cx="35" cy="90" r="6" fill={catColor} stroke={outlineColor} strokeWidth="3" />
      <circle cx="65" cy="90" r="6" fill={catColor} stroke={outlineColor} strokeWidth="3" />
    </svg>
  );
}
