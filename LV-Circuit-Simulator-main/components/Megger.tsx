import React, { useState, useRef, useEffect } from 'react';
import { MeggerState, Position } from '../types';
import { X, Activity, Zap } from 'lucide-react';

interface Props {
  state: MeggerState;
  reading: string;
  onPositionChange: (pos: Position) => void;
  onProbeDragStart: (e: React.MouseEvent, type: 'megger-red' | 'megger-black') => void;
  onModeChange: (mode: MeggerState['mode']) => void;
  onTestStart: () => void;
  onTestEnd: () => void;
  onClose: () => void;
}

export const Megger: React.FC<Props> = ({ 
    state, 
    reading, 
    onPositionChange, 
    onProbeDragStart,
    onModeChange,
    onTestStart,
    onTestEnd,
    onClose
}) => {
  const [isDraggingBody, setIsDraggingBody] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDraggingBody(true);
    dragOffset.current = {
      x: e.clientX - state.position.x,
      y: e.clientY - state.position.y
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingBody) {
        onPositionChange({
          x: e.clientX - dragOffset.current.x,
          y: e.clientY - dragOffset.current.y
        });
      }
    };

    const handleMouseUp = () => {
      setIsDraggingBody(false);
    };

    if (isDraggingBody) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingBody, onPositionChange]);

  // Dial Rotation
  const getDialRotation = () => {
    switch(state.mode) {
        case 'OFF': return -100;
        case 'VOLTAGE': return -60;
        case 'CONTINUITY': return -20;
        case 'IR_250': return 20;
        case 'IR_500': return 60;
        case 'IR_1000': return 100;
        default: return -100;
    }
  };

  return (
    <div 
        className="absolute w-56 bg-orange-600 rounded-xl shadow-2xl border-4 border-gray-900 flex flex-col z-50 select-none overflow-hidden"
        style={{ left: state.position.x, top: state.position.y }}
        onMouseDown={handleMouseDown}
    >
        {/* Protective Rubber Bumper Top */}
        <div className="bg-gray-900 h-4 w-full"></div>

        {/* Header / Grip */}
        <div className="bg-orange-600 p-2 flex items-center justify-between cursor-grab active:cursor-grabbing border-b border-orange-700">
            <span className="text-[10px] font-black text-gray-900 tracking-widest uppercase">IsoTest 500</span>
            <button onClick={onClose} className="text-gray-900 hover:text-white"><X size={16} /></button>
        </div>

        {/* LCD Screen Area */}
        <div className="p-4 pb-2 bg-orange-600">
            <div className="bg-[#c2d1b2] h-20 rounded-lg border-4 border-gray-700 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)] flex flex-col items-end justify-center px-3 font-mono relative overflow-hidden">
                 {/* Main Reading */}
                 <span className="text-3xl text-black/90 tracking-widest z-10 font-bold">{reading}</span>
                 
                 {/* Sub-units/Icons */}
                 <div className="w-full flex justify-between items-end mt-1 z-10">
                     <span className="text-[10px] font-bold text-black/60">
                         {state.mode === 'CONTINUITY' && <Activity size={12}/>}
                         {state.mode.startsWith('IR') && <Zap size={12}/>}
                     </span>
                     <span className="text-xs font-bold text-black/70">
                         {state.mode === 'VOLTAGE' && 'V AC'}
                         {state.mode === 'CONTINUITY' && 'Ω'}
                         {state.mode.startsWith('IR') && 'MΩ'}
                     </span>
                 </div>

                 {/* Glare */}
                 <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-white/30 to-transparent pointer-events-none"></div>
            </div>
        </div>

        {/* Controls Area */}
        <div className="bg-gray-800 p-4 relative flex flex-col items-center">
             
             {/* Test Button (Top Center) */}
             <button 
                className={`mb-6 w-32 h-10 rounded-full font-bold text-sm tracking-widest shadow-lg transform active:scale-95 transition-all flex items-center justify-center border-b-4 ${
                    state.mode === 'OFF' || state.mode === 'VOLTAGE' 
                    ? 'bg-gray-600 text-gray-400 border-gray-800 cursor-not-allowed' 
                    : (state.isTestActive ? 'bg-orange-400 text-white border-orange-600 translate-y-1' : 'bg-orange-500 text-white border-orange-700 hover:bg-orange-400')
                }`}
                onMouseDown={(e) => { e.stopPropagation(); if(state.mode !== 'OFF' && state.mode !== 'VOLTAGE') onTestStart(); }}
                onMouseUp={(e) => { e.stopPropagation(); onTestEnd(); }}
                onMouseLeave={(e) => { e.stopPropagation(); onTestEnd(); }}
             >
                 TEST
             </button>

             {/* Rotary Dial */}
             <div className="relative w-24 h-24 mb-2">
                 {/* Dial Body - Reduced size to w-10 h-10 (40px) */}
                 <div 
                    className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-gray-200 border-2 border-gray-400 shadow-md flex items-center justify-center transition-transform duration-300 z-10"
                    style={{ transform: `rotate(${getDialRotation()}deg)` }}
                 >
                     <div className="w-1 h-4 bg-orange-600 rounded-full absolute -top-1"></div>
                     <div className="w-6 h-6 rounded-full bg-gray-300 border border-gray-400"></div>
                 </div>

                 {/* Labels - Positioned Radially - Increased font size to text-xs */}
                 {/* OFF (-100 deg, 10.6% L, 56.9% T) */}
                 <div 
                    className="absolute text-xs font-bold text-white cursor-pointer hover:text-orange-400 transition-colors"
                    style={{ left: '10.6%', top: '56.9%' }}
                    onClick={() => onModeChange('OFF')}
                 >OFF</div>
                 
                 {/* V (-60 deg, 15.4% L, 30% T) */}
                 <div 
                    className="absolute text-xs font-bold text-yellow-400 cursor-pointer hover:text-white transition-colors"
                    style={{ left: '15.4%', top: '30%' }}
                    onClick={() => onModeChange('VOLTAGE')}
                 >V~</div>

                 {/* Cont (-20 deg, 36.3% L, 12.4% T) */}
                 <div 
                    className="absolute text-xs font-bold text-white cursor-pointer hover:text-orange-400 transition-colors"
                    style={{ left: '36.3%', top: '12.4%' }}
                    onClick={() => onModeChange('CONTINUITY')}
                 >Ω</div>

                 {/* 250 (20 deg, 63.7% L, 12.4% T) */}
                 <div 
                    className="absolute text-xs font-bold text-orange-400 cursor-pointer hover:text-white transition-colors"
                    style={{ left: '63.7%', top: '12.4%' }}
                    onClick={() => onModeChange('IR_250')}
                 >250</div>

                 {/* 500 (60 deg, 84.6% L, 30% T) */}
                 <div 
                    className="absolute text-xs font-bold text-red-500 cursor-pointer hover:text-white transition-colors"
                    style={{ left: '84.6%', top: '30%' }}
                    onClick={() => onModeChange('IR_500')}
                 >500</div>
                 
                 {/* 1000 (100 deg, 89.4% L, 56.9% T) - Adjusted slightly for text width */}
                 <div 
                    className="absolute text-xs font-bold text-red-600 cursor-pointer hover:text-white transition-colors"
                    style={{ left: '84.4%', top: '56.9%' }}
                    onClick={() => onModeChange('IR_1000')}
                 >1k</div>

             </div>
        </div>

        {/* Terminals Area */}
        <div className="bg-gray-900 p-3 flex justify-between px-8 border-t border-gray-700">
             {/* Red Terminal */}
             <div className="flex flex-col items-center gap-1">
                 <div 
                    className="w-10 h-10 rounded-full border-4 border-red-700 bg-black shadow-inner relative flex items-center justify-center cursor-pointer hover:border-red-500"
                    onMouseDown={(e) => { e.stopPropagation(); onProbeDragStart(e, 'megger-red'); }}
                 >
                    <div className="w-3 h-3 bg-black rounded-full border border-gray-700"></div>
                     {/* Show Probe Head if docked */}
                    {!state.redProbeNode && !state.redProbePosition && (
                        <div className="absolute -bottom-2 w-4 h-14 bg-red-600 rounded-b-md border border-red-800 shadow-md pointer-events-none"></div>
                    )}
                 </div>
                 <span className="text-[9px] font-bold text-red-500">+</span>
             </div>

             {/* Black Terminal */}
             <div className="flex flex-col items-center gap-1">
                 <div 
                    className="w-10 h-10 rounded-full border-4 border-gray-600 bg-black shadow-inner relative flex items-center justify-center cursor-pointer hover:border-gray-400"
                    onMouseDown={(e) => { e.stopPropagation(); onProbeDragStart(e, 'megger-black'); }}
                 >
                    <div className="w-3 h-3 bg-black rounded-full border border-gray-700"></div>
                    {/* Show Probe Head if docked */}
                    {!state.blackProbeNode && !state.blackProbePosition && (
                        <div className="absolute -bottom-2 w-4 h-14 bg-gray-800 rounded-b-md border border-black shadow-md pointer-events-none"></div>
                    )}
                 </div>
                 <span className="text-[9px] font-bold text-gray-400">-</span>
             </div>
        </div>
    </div>
  );
};