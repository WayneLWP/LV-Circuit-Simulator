

import React, { useState, useRef, useEffect } from 'react';
import { MultimeterState, Position } from '../types';
import { GripHorizontal, Zap, Gauge, X } from 'lucide-react';

interface Props {
  state: MultimeterState;
  reading: string;
  onPositionChange: (pos: Position) => void;
  onProbeDragStart: (e: React.MouseEvent, type: 'red' | 'black') => void;
  onModeChange: (mode: 'VOLTAGE' | 'CURRENT') => void;
  onClose: () => void;
  onClampDragStart: (e: React.MouseEvent) => void;
}

export const Multimeter: React.FC<Props> = ({ 
    state, 
    reading, 
    onPositionChange, 
    onProbeDragStart,
    onModeChange,
    onClose,
    onClampDragStart
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

  return (
    <div 
        className="absolute w-48 bg-yellow-400 rounded-lg shadow-2xl border-4 border-gray-800 flex flex-col z-50 select-none"
        style={{ left: state.position.x, top: state.position.y }}
        onMouseDown={handleMouseDown}
    >
        {/* Header / Grip */}
        <div className="bg-gray-800 p-2 flex items-center justify-between cursor-grab active:cursor-grabbing">
            <span className="text-[10px] font-bold text-white tracking-widest">FLUKE-LIKE 117</span>
            <div className="flex gap-2">
                 <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={14} /></button>
            </div>
        </div>

        {/* LCD Screen */}
        <div className="p-3 bg-gray-800">
            <div className="bg-[#9ea792] h-16 rounded border-2 border-gray-600 inset-shadow flex items-center justify-end px-2 font-mono relative overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]">
                 <span className="text-3xl text-black/90 tracking-widest z-10 font-bold">{reading}</span>
                 <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none"></div>
                 {state.mode === 'VOLTAGE' && <span className="absolute top-1 right-1 text-[8px] font-bold">V ~</span>}
                 {state.mode === 'CURRENT' && <span className="absolute top-1 right-1 text-[8px] font-bold">A</span>}
                 {state.mode === 'CURRENT' && state.clampedWireId && <span className="absolute bottom-1 left-1 text-[8px] font-bold flex items-center gap-1 text-black"><Gauge size={10}/> CLAMPED</span>}
            </div>
        </div>

        {/* Dial & Controls */}
        <div className="p-4 bg-gray-800 flex justify-center items-center relative">
             {/* Dial Base */}
             <div className="w-16 h-16 rounded-full bg-gray-700 border-2 border-gray-900 shadow-lg relative flex items-center justify-center">
                  {/* Selector */}
                  <div 
                    className="w-full h-2 bg-gray-300 absolute rounded-full transition-transform duration-200"
                    style={{ transform: state.mode === 'VOLTAGE' ? 'rotate(-45deg)' : 'rotate(45deg)' }}
                  ></div>
                  <div className="w-10 h-10 rounded-full bg-gray-900 z-10 border border-gray-600 shadow-inner"></div>
             </div>

             {/* Mode Labels */}
             <div 
                className={`absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold ${state.mode === 'VOLTAGE' ? 'text-yellow-400' : 'text-gray-500'} cursor-pointer hover:text-white transition-colors`}
                onClick={() => onModeChange('VOLTAGE')}
             >
                <div className="flex flex-col items-center">
                    <span className="">V~</span>
                    <span className="text-[8px] opacity-60">AC</span>
                </div>
             </div>
             <div 
                className={`absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold ${state.mode === 'CURRENT' ? 'text-yellow-400' : 'text-gray-500'} cursor-pointer hover:text-white transition-colors`}
                onClick={() => onModeChange('CURRENT')}
             >
                <div className="flex flex-col items-center">
                    <span className="">A</span>
                    <span className="text-[8px] opacity-60">Clamp</span>
                </div>
             </div>
        </div>

        {/* Ports area - Dock for Probes */}
        <div className="bg-gray-800 p-2 pt-0 pb-4 flex justify-around">
            {/* Red Probe Socket */}
            <div className="flex flex-col items-center gap-1">
                 <div 
                    className="w-8 h-8 rounded-full border-4 border-red-900 bg-black shadow-inner cursor-pointer hover:border-red-700 relative flex items-center justify-center"
                    onMouseDown={(e) => { e.stopPropagation(); onProbeDragStart(e, 'red'); }}
                    title="Drag Red Probe"
                 >
                    {/* Inner Socket */}
                    <div className="w-2 h-2 bg-black rounded-full border border-gray-700"></div>
                    
                    {/* Show Probe Head if NOT dragging and NOT connected */}
                    {!state.redProbeNode && !state.redProbePosition && (
                        <div className="absolute -bottom-2 w-3 h-12 bg-red-600 rounded-b-md border border-red-800 shadow-md pointer-events-none"></div>
                    )}
                 </div>
                 <span className="text-[8px] text-red-500 font-bold mt-2">VΩ</span>
            </div>

            {/* Black Probe Socket */}
            <div className="flex flex-col items-center gap-1">
                 <div 
                    className="w-8 h-8 rounded-full border-4 border-gray-700 bg-black shadow-inner cursor-pointer hover:border-gray-500 relative flex items-center justify-center"
                    onMouseDown={(e) => { e.stopPropagation(); onProbeDragStart(e, 'black'); }}
                    title="Drag Black Probe"
                 >
                     {/* Inner Socket */}
                     <div className="w-2 h-2 bg-black rounded-full border border-gray-700"></div>

                    {/* Show Probe Head if NOT dragging and NOT connected */}
                    {!state.blackProbeNode && !state.blackProbePosition && (
                        <div className="absolute -bottom-2 w-3 h-12 bg-gray-800 rounded-b-md border border-black shadow-md pointer-events-none"></div>
                    )}
                 </div>
                 <span className="text-[8px] text-white font-bold mt-2">COM</span>
            </div>
        </div>

        {/* Clamp Attachment */}
        <div className="bg-yellow-500 h-2"></div>
        
        {/* Docked Clamp Tool */}
        {state.mode === 'CURRENT' && !state.clampedWireId && (
             <div 
                className="absolute -right-10 top-2 bg-gray-900 border-2 border-yellow-500 p-1 rounded-r-lg cursor-grab active:cursor-grabbing flex flex-col items-center shadow-lg hover:bg-gray-800"
                onMouseDown={(e) => { e.stopPropagation(); onClampDragStart(e); }}
                title="Drag Current Clamp"
             >
                <Gauge className="text-yellow-400 w-6 h-6" />
                <div className="w-1 h-6 bg-gray-700 mt-1 rounded-full"></div>
                <div className="w-3 h-3 border-2 border-yellow-400 rounded-full mt-[-4px] bg-gray-900"></div>
             </div>
        )}
    </div>
  );
};