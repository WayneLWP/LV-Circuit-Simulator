import React from 'react';
import { ComponentInstance, TerminalDef } from '../types';
import { COMPONENT_CATALOG } from '../constants';
import { Trash2, RotateCw, Copy, Fan, Plug } from 'lucide-react';

interface Props {
  data: ComponentInstance;
  isSelected: boolean;
  isEnergized: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onTerminalMouseDown: (e: React.MouseEvent, termId: string) => void; // Kept for interface compatibility, unused for interaction
  onTerminalMouseUp: (e: React.MouseEvent, termId: string) => void;   // Kept for interface compatibility, unused for interaction
  onDelete: () => void;
  onRotate: () => void;
  onToggleState: () => void;
  showLabels: boolean;
  onDuplicate?: () => void;
  onPlugMouseDown?: (e: React.MouseEvent) => void; 
}

// Visual-only Terminal Point (Interaction handled by Global Overlay in App.tsx)
const TerminalPoint: React.FC<{
  def: TerminalDef;
}> = ({ def }) => {
  let colorClass = 'bg-gray-400';
  if (def.type === 'L') colorClass = 'bg-red-700';
  if (def.type === 'N') colorClass = 'bg-blue-600';
  if (def.type === 'E') colorClass = 'bg-green-500';

  return (
    <div
      className="absolute flex flex-col items-center"
      style={{ left: def.x - 6, top: def.y - 6 }} // Center the 12px dot
    >
      <div
        className={`w-3 h-3 rounded-full border border-white shadow-sm pointer-events-none ${colorClass}`}
      ></div>
    </div>
  );
};

export const ComponentNode: React.FC<Props> = ({
  data,
  isSelected,
  isEnergized,
  onMouseDown,
  onDelete,
  onRotate,
  onToggleState,
  showLabels,
  onDuplicate,
  onPlugMouseDown
}) => {
  const def = COMPONENT_CATALOG[data.type];
  if (!def) return null;

  // Dynamic Styles based on state
  const isTripped = data.state.isTripped;
  const isOn = data.state.isOn;
  
  // Specific Visuals
  const renderVisuals = () => {
    switch(data.type) {
      case 'LAMP_PENDANT':
        return (
          <div className="w-full h-full relative flex flex-col items-center">
             {/* Bulb */}
             <div className={`w-14 h-14 rounded-full border-2 z-20 relative top-2 ${isEnergized ? 'bg-yellow-300 border-yellow-500 shadow-[0_0_20px_rgba(250,204,21,0.8)]' : 'bg-white border-gray-400'}`}>
               {/* Filament visual */}
               <div className="w-6 h-6 border-t-2 border-gray-500 rounded-full mx-auto mt-4 opacity-40"></div>
               <div className="w-4 h-4 border-t-2 border-gray-500 rounded-full mx-auto -mt-1 opacity-40 rotate-180"></div>
             </div>
             
             {/* Holder/Neck */}
             <div className="w-10 h-12 bg-white border-x-2 border-gray-300 -mt-2 z-10 relative flex justify-center">
                 <div className="absolute top-0 w-12 h-4 bg-white border border-gray-300 rounded-sm"></div>
                 {/* Internal Flex Wires emerging from holder - drawn via SVG overlay */}
             </div>
    
             {/* Ceiling Rose Base */}
             <div className="absolute bottom-4 w-24 h-24 bg-white rounded-full border-2 border-gray-300 shadow-sm z-0">
                 {/* Visual terminals blocks inside the rose */}
                 <div className="absolute top-[60%] left-1/2 -translate-x-1/2 flex gap-4 opacity-30">
                     <div className="w-5 h-5 bg-black rounded-sm border border-gray-500"></div> {/* L */}
                     <div className="w-5 h-5 bg-black rounded-sm border border-gray-500"></div> {/* Loop */}
                     <div className="w-5 h-5 bg-black rounded-sm border border-gray-500"></div> {/* N */}
                 </div>
                 {/* Earth Tag visual */}
                 <div className="absolute bottom-[15%] right-[20%] w-4 h-4 rounded-full border-2 border-green-600 bg-green-100 opacity-50"></div>
             </div>

             {/* Internal Wiring Overlay */}
             <svg className="absolute inset-0 w-full h-full z-10 pointer-events-none overflow-visible">
                 {/* Brown wire from holder to L (Left Terminal) */}
                 <path 
                    d="M 45 60 Q 40 90 20 115" 
                    fill="none" 
                    stroke="#8B4513" 
                    strokeWidth="3"
                    strokeLinecap="round"
                 />
                 {/* Blue wire from holder to N (Right Terminal) */}
                 <path 
                    d="M 55 60 Q 60 90 80 115" 
                    fill="none" 
                    stroke="#0056b3" 
                    strokeWidth="3"
                    strokeLinecap="round"
                 />
             </svg>
          </div>
        );
      case 'SWITCH_1G':
      case 'SWITCH_2W':
      case 'SWITCH_INT':
        return (
          <div 
            className={`w-8 h-12 border rounded cursor-pointer flex items-center justify-center shadow-inner ${isOn || (data.state.position === 2) ? 'bg-gray-100' : 'bg-gray-50'}`}
            onClick={(e) => { e.stopPropagation(); onToggleState(); }}
          >
             <div className={`w-4 h-8 bg-white border shadow-md transition-transform ${isOn || (data.state.position === 2) ? 'translate-y-2' : '-translate-y-2'}`}></div>
          </div>
        );
      case 'SWITCH_FUSED':
        return (
            <div 
            className="w-full h-full bg-white border-2 border-slate-500 rounded-md shadow-sm p-1 relative flex flex-col select-none"
            onClick={(e) => { e.stopPropagation(); onToggleState(); }}
            >
                {/* Header Text - Centered properly */}
                <div className="absolute top-2 left-0 w-full text-center text-[10px] font-bold text-slate-600 tracking-wider pointer-events-none" style={{ fontFamily: 'sans-serif' }}>FUSED</div>
                
                <div className="absolute top-[55%] -translate-y-1/2 w-full flex justify-around px-1">
                    {/* Switch (Left) */}
                    <div className="flex flex-col items-center">
                        <div className={`w-6 h-10 border-2 border-slate-800 flex items-center justify-center transition-colors ${isOn ? 'bg-slate-50' : 'bg-white'}`}>
                            {/* Horizontal Red Line for Switch Rocker */}
                             <div className={`w-4 h-1 bg-red-700 ${isOn ? 'opacity-100' : 'opacity-40'}`}></div>
                        </div>
                    </div>

                    {/* Fuse Holder (Right) */}
                    <div className="flex flex-col items-center">
                        <div className="w-6 h-10 bg-slate-100 border border-slate-300 shadow-inner flex items-center justify-center">
                            <div className="w-3 h-6 bg-white border border-slate-300 shadow-sm"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
      case 'MCB':
      case 'RCD':
        return (
           <div 
            className={`w-6 h-10 border rounded cursor-pointer flex flex-col items-center justify-center ${isTripped ? 'bg-red-100' : (isOn ? 'bg-green-100' : 'bg-gray-200')}`}
            onClick={(e) => { e.stopPropagation(); onToggleState(); }}
           >
              <span className="text-[8px] font-mono mb-1">{isTripped ? 'TRIP' : (isOn ? 'ON' : 'OFF')}</span>
              <div className={`w-4 h-4 bg-black rounded-sm transition-transform ${isOn && !isTripped ? '-translate-y-1' : 'translate-y-1'}`}></div>
           </div>
        );
      case 'SOCKET_SINGLE':
        return (
            <div 
              className="w-full h-full bg-white border border-gray-400 rounded-sm shadow-sm p-2 relative flex flex-col items-center justify-center"
              onClick={(e) => { e.stopPropagation(); onToggleState(); }} // Enable Toggle
            >
                {/* Earth Pin */}
                <div className="w-1.5 h-3 bg-black rounded-t-sm mb-1"></div>
                {/* Line/Neutral Pins */}
                <div className="flex gap-4">
                    <div className="w-1.5 h-2.5 bg-black"></div>
                    <div className="w-1.5 h-2.5 bg-black"></div>
                </div>
                {/* Switch toggle (visual) */}
                <div className={`absolute top-2 right-2 w-2 h-3 border border-gray-500 flex flex-col ${isOn ? 'bg-gray-200' : 'bg-gray-50'}`}>
                   <div className={`h-1.5 w-full bg-gray-600 transition-transform ${isOn ? 'translate-y-1.5' : 'translate-y-0'}`}></div>
                </div>
                {/* Indicator */}
                <div className={`absolute top-2 left-2 w-1.5 h-1.5 rounded-full ${isEnergized && isOn ? 'bg-red-500 shadow-[0_0_5px_red]' : 'bg-gray-300'}`}></div>
            </div>
        );
      case 'SOCKET_DOUBLE':
        return (
           <div 
            className="flex w-full h-full bg-white border border-gray-400 rounded-sm shadow-sm p-2 items-center justify-between relative"
            onClick={(e) => { e.stopPropagation(); onToggleState(); }} // Enable Toggle
           >
              {/* Left Outlet */}
              <div className="flex-1 flex flex-col items-center justify-center">
                  {/* Earth Pin */}
                   <div className="w-1.5 h-3 bg-black rounded-t-sm mb-1"></div>
                   {/* Line/Neutral Pins */}
                   <div className="flex gap-3">
                       <div className="w-1.5 h-2.5 bg-black"></div>
                       <div className="w-1.5 h-2.5 bg-black"></div>
                   </div>
              </div>
              
              {/* Switch toggles (visual only - one state for both) */}
              <div className="absolute top-2 left-[40%] flex gap-4">
                   <div className={`w-2 h-3 border border-gray-500 flex flex-col ${isOn ? 'bg-gray-200' : 'bg-gray-50'}`}>
                      <div className={`h-1.5 w-full bg-gray-600 transition-transform ${isOn ? 'translate-y-1.5' : 'translate-y-0'}`}></div>
                   </div>
                   <div className={`w-2 h-3 border border-gray-500 flex flex-col ${isOn ? 'bg-gray-200' : 'bg-gray-50'}`}>
                      <div className={`h-1.5 w-full bg-gray-600 transition-transform ${isOn ? 'translate-y-1.5' : 'translate-y-0'}`}></div>
                   </div>
              </div>

              {/* Right Outlet */}
              <div className="flex-1 flex flex-col items-center justify-center border-l border-gray-200">
                  {/* Earth Pin */}
                   <div className="w-1.5 h-3 bg-black rounded-t-sm mb-1"></div>
                   {/* Line/Neutral Pins */}
                   <div className="flex gap-3">
                       <div className="w-1.5 h-2.5 bg-black"></div>
                       <div className="w-1.5 h-2.5 bg-black"></div>
                   </div>
              </div>

              {/* Indicator */}
              <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full ${isEnergized && isOn ? 'bg-red-500 shadow-[0_0_5px_red]' : 'bg-gray-300'}`}></div>
           </div>
        );
      case 'FAN':
        return (
            <div className="w-full h-full bg-white border border-gray-400 rounded-sm shadow-sm p-2 relative flex flex-col items-center justify-center">
                <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${isEnergized ? 'animate-spin border-blue-500 shadow-[0_0_10px_#3b82f6]' : 'border-gray-300'}`}>
                    <Fan className={`w-8 h-8 ${isEnergized ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
                <div className="absolute bottom-1 right-1 text-[8px] font-bold text-gray-500">FAN</div>
            </div>
        );
      case 'FAN_PLUG':
        // Calculate cable end point relative to component center
        // data.plugPosition is Global. data.position is Global.
        // We are rendering inside a div at data.position.
        const localPlugX = (data.plugPosition?.x || 0) - data.position.x;
        const localPlugY = (data.plugPosition?.y || 0) - data.position.y;
        const centerX = def.width / 2;
        const centerY = def.height / 2;
        
        // Control Point for Bezier Curve (make it droop or curve)
        const cpX = (centerX + localPlugX) / 2;
        const cpY = Math.max(centerY, localPlugY) + 40; // Droop down

        return (
            <>
                {/* Cable - Rendered OUTSIDE the main rotation transform usually, but here we are inside. 
                    Note: For FAN_PLUG, we will assume rotation is 0 for simplicity of cable physics, or handle it.
                    Since we disabled rotation for FAN_PLUG in App logic (implied), this works.
                */}
                <svg className="absolute overflow-visible pointer-events-none" style={{ left: 0, top: 0, width: '100%', height: '100%', zIndex: -1 }}>
                    <path 
                        d={`M ${centerX} ${centerY} Q ${cpX} ${cpY} ${localPlugX} ${localPlugY}`}
                        fill="none"
                        stroke="#333"
                        strokeWidth="4"
                        strokeLinecap="round"
                    />
                </svg>

                {/* Fan Body */}
                <div className="w-full h-full bg-white border border-gray-400 rounded-sm shadow-sm p-2 relative flex flex-col items-center justify-center z-10">
                    <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center ${isEnergized ? 'animate-spin border-blue-500 shadow-[0_0_10px_#3b82f6]' : 'border-gray-300'}`}>
                        <Fan className={`w-8 h-8 ${isEnergized ? 'text-blue-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="absolute bottom-1 right-1 text-[8px] font-bold text-gray-500">PORTABLE</div>
                </div>

                {/* Plug Head - Rendered relatively. Draggable. */}
                <div 
                    className="absolute z-50 cursor-grab active:cursor-grabbing group"
                    style={{ left: localPlugX - 10, top: localPlugY - 10, width: 20, height: 20 }}
                    onMouseDown={(e) => { e.stopPropagation(); if (onPlugMouseDown) onPlugMouseDown(e); }}
                >
                    <div className={`w-full h-full bg-black rounded shadow-md flex items-center justify-center border border-gray-600 ${data.pluggedSocketId ? 'ring-2 ring-green-400' : ''}`}>
                         <Plug size={12} className="text-white transform rotate-180" />
                    </div>
                    {!data.pluggedSocketId && <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[8px] bg-black text-white px-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">Drag Me</div>}
                </div>
            </>
        );
      case 'SOURCE_AC':
        return (
          <div className="flex flex-col items-center justify-center p-2">
            <div className={`w-4 h-4 rounded-full mb-1 ${isOn ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-gray-400'}`}></div>
            <button 
              className={`px-2 py-1 text-[10px] rounded text-white ${isOn ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-600 hover:bg-gray-700'}`}
              onClick={(e) => { e.stopPropagation(); onToggleState(); }}
            >
              {isOn ? 'LIVE' : 'OFF'}
            </button>
          </div>
        );
      case 'CONNECTOR_BLOCK':
        return (
          <div className="w-full h-full bg-white/90 border border-gray-400 rounded-sm shadow-sm flex flex-col items-center justify-between py-1 relative overflow-hidden select-none">
             {/* Brass internal */}
             <div className="absolute inset-y-0 w-2.5 bg-yellow-600/50 mx-auto left-0 right-0 border-x border-yellow-600/30"></div>
             
             {/* Screw Top */}
             <div className="w-2.5 h-2.5 rounded-full border border-gray-500 bg-gray-200 z-10 flex items-center justify-center shadow-sm">
                 <div className="w-1.5 h-px bg-gray-600 rotate-45"></div>
             </div>
             
             {/* Screw Bottom */}
             <div className="w-2.5 h-2.5 rounded-full border border-gray-500 bg-gray-200 z-10 flex items-center justify-center shadow-sm">
                  <div className="w-1.5 h-px bg-gray-600 rotate-45"></div>
             </div>
          </div>
        );
      case 'BAR_NEUTRAL':
        return (
          <div className="w-full h-full bg-gray-50 border border-gray-300 rounded shadow-sm flex items-center px-2 relative">
             <div className="absolute inset-0 bg-blue-50 opacity-20"></div>
             {/* Brass Bar */}
             <div className="w-full h-4 bg-yellow-600 rounded-sm shadow-inner mx-1 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-yellow-400 to-yellow-700 opacity-70"></div>
             </div>
             <div className="absolute top-0 left-1 text-[10px] font-bold text-blue-800">Neutral</div>
          </div>
        );
      case 'BAR_EARTH':
        return (
           <div className="w-full h-full bg-gray-50 border border-gray-300 rounded shadow-sm flex items-center px-2 relative">
             <div className="absolute inset-0 bg-green-50 opacity-20"></div>
             {/* Brass Bar */}
             <div className="w-full h-4 bg-yellow-600 rounded-sm shadow-inner mx-1 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-yellow-400 to-yellow-700 opacity-70"></div>
             </div>
             <div className="absolute top-0 left-1 text-[10px] font-bold text-green-700">Earth</div>
          </div>
        );
      default:
        return null;
    }
  }

  // Z-Index Management
  // z-10: Standard Component Level (Below Wires z-20)
  // z-30: Fan Plug (Needs to be above wires)
  let zIndexClass = 'z-10'; 
  if (data.type === 'FAN_PLUG') {
     zIndexClass = 'z-30';
  } else if (data.type === 'CONNECTOR_BLOCK') {
     // Connector blocks are often placed "inside" (visually on top of) backboxes/switches
     zIndexClass = 'z-30';
  } else {
     // Even selected components stay at z-10 (or z-15) to be under wires, 
     // but we can bump slightly to be above other components if needed.
     zIndexClass = isSelected ? 'z-15' : 'z-10';
  }

  return (
    <div
      className={`absolute select-none group ${zIndexClass}`}
      style={{
        left: data.position.x,
        top: data.position.y,
        width: def.width,
        height: def.height,
        // Disable rotation transform for FAN_PLUG container to simplify cable coordinate logic
        transform: data.type === 'FAN_PLUG' ? 'none' : `rotate(${data.rotation || 0}deg)`,
        transformOrigin: 'center center'
      }}
      onMouseDown={onMouseDown}
    >
      {/* Selection Halo */}
      <div className={`absolute inset-0 rounded-lg pointer-events-none border-2 transition-colors ${isSelected ? 'border-blue-500 bg-blue-50/10' : 'border-gray-300 bg-white/80'}`}></div>

      {/* Component Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {renderVisuals()}
      </div>

      {/* Label positioned above (or side when rotated), counter-rotated to stay upright */}
      {showLabels && (
        <div 
            className="absolute w-[200px] flex justify-center pointer-events-none"
            style={{
                top: -25, 
                left: '50%',
                transform: `translateX(-50%) rotate(-${data.type === 'FAN_PLUG' ? 0 : (data.rotation || 0)}deg)`
            }}
        >
            <span className="text-[10px] font-semibold text-gray-700 bg-white/90 px-1.5 py-0.5 rounded whitespace-nowrap shadow-sm border border-gray-200 backdrop-blur-sm">
                {def.name}
            </span>
        </div>
      )}

      {/* Terminals (Visual Only - Interaction handled by Global Overlay) */}
      {data.type !== 'FAN_PLUG' && def.terminals.map((t) => (
        <TerminalPoint key={t.id} def={t} />
      ))}

      {/* Controls (Delete, Rotate, Duplicate) - Only show on hover/select */}
      {isSelected && (
        <div className="absolute -top-6 -right-8 flex gap-1 z-30 scale-90">
           <button
            className="bg-gray-100 text-gray-700 border border-gray-300 p-1.5 rounded-full shadow hover:bg-gray-200 flex items-center justify-center"
            onClick={(e) => { e.stopPropagation(); if(onDuplicate) onDuplicate(); }}
            title="Duplicate (Ctrl+D)"
          >
            <Copy size={14} />
          </button>
          {data.type !== 'FAN_PLUG' && (
            <button
                className="bg-blue-500 text-white p-1.5 rounded-full shadow hover:bg-blue-600 flex items-center justify-center"
                onClick={(e) => { e.stopPropagation(); onRotate(); }}
                title="Rotate 90° (R)"
            >
                <RotateCw size={14} />
            </button>
          )}
          <button
            className="bg-red-500 text-white p-1.5 rounded-full shadow hover:bg-red-600 flex items-center justify-center"
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            title="Delete (Del)"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  );
};