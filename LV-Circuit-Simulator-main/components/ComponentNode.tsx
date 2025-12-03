


import React from 'react';
import { ComponentInstance, TerminalDef } from '../types';
import { COMPONENT_CATALOG } from '../constants';
import { Trash2, RotateCw, Copy, Fan, Plug } from 'lucide-react';

interface Props {
  data: ComponentInstance;
  isSelected: boolean;
  isEnergized: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onTerminalMouseDown: (e: React.MouseEvent, termId: string) => void;
  onTerminalMouseUp: (e: React.MouseEvent, termId: string) => void;
  onDelete: () => void;
  onRotate: () => void;
  onToggleState: (subKey?: string) => void;
  showLabels: boolean;
  showSymbols: boolean; // New prop
  onDuplicate?: () => void;
  onPlugMouseDown?: (e: React.MouseEvent) => void; 
}

// Visual-only Terminal Point (Interaction handled by Global Overlay in App.tsx)
const TerminalPoint: React.FC<{
  def: TerminalDef;
}> = ({ def }) => {
  let colorClass = 'bg-gray-400';
  if (def.type === 'L') {
      colorClass = 'bg-red-700';
      // Harmonized Phase Colors
      if (def.label === 'L1') colorClass = 'bg-[#8B4513]'; // Brown
      if (def.label === 'L2') colorClass = 'bg-black border border-gray-600';     // Black
      if (def.label === 'L3') colorClass = 'bg-gray-500';  // Grey
  }
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

// Extracted SymbolWrapper to avoid defining component inside render (React performance) and fix TS errors
interface SymbolWrapperProps {
  width: number;
  height: number;
  onToggle: () => void;
  children: React.ReactNode;
}

const SymbolWrapper: React.FC<SymbolWrapperProps> = ({ width, height, onToggle, children }) => (
  <div 
     className="w-full h-full bg-white border-2 border-black relative cursor-pointer" 
     onClick={(e) => { e.stopPropagation(); onToggle(); }}
  >
      <svg className="w-full h-full absolute inset-0 pointer-events-none" viewBox={`0 0 ${width} ${height}`}>
           {children}
      </svg>
  </div>
);

export const ComponentNode: React.FC<Props> = ({
  data,
  isSelected,
  isEnergized,
  onMouseDown,
  onDelete,
  onRotate,
  onToggleState,
  showLabels,
  showSymbols,
  onDuplicate,
  onPlugMouseDown
}) => {
  const def = COMPONENT_CATALOG[data.type];
  if (!def) return null;

  // Dynamic Styles based on state
  const isTripped = data.state.isTripped;
  const isOn = data.state.isOn;
  
  // --- Schematic Symbol Renderer ---
  const renderSymbol = () => {
      // SVG Stroke standard
      const STROKE = "black";
      const WIDTH = 2;

      const wrapperProps = {
          width: def.width,
          height: def.height,
          onToggle: () => onToggleState()
      };

      switch (data.type) {
          case 'SWITCH_1G': // Terminals: COM(40,20), L1(40,70), E(65,65)
              return (
                  <SymbolWrapper {...wrapperProps}>
                      <circle cx="40" cy="20" r="2" fill="black" />
                      <circle cx="40" cy="70" r="2" fill="black" />
                      {/* Fixed Line */}
                      <line x1="40" y1="20" x2="40" y2="35" stroke={STROKE} strokeWidth={WIDTH} />
                      {/* Lever */}
                      {isOn ? (
                          <line x1="40" y1="35" x2="40" y2="70" stroke={STROKE} strokeWidth={WIDTH} />
                      ) : (
                          <line x1="40" y1="35" x2="60" y2="50" stroke={STROKE} strokeWidth={WIDTH} />
                      )}
                  </SymbolWrapper>
              );
          case 'SWITCH_2W': // COM(40,15), L1(20,65), L2(60,65), E(75,75)
              return (
                   <SymbolWrapper {...wrapperProps}>
                      <circle cx="40" cy="15" r="2" fill="black" />
                      <circle cx="20" cy="65" r="2" fill="black" />
                      <circle cx="60" cy="65" r="2" fill="black" />
                      
                      <line x1="40" y1="15" x2="40" y2="35" stroke={STROKE} strokeWidth={WIDTH} />
                      {data.state.position === 1 ? (
                          <line x1="40" y1="35" x2="20" y2="65" stroke={STROKE} strokeWidth={WIDTH} />
                      ) : (
                          <line x1="40" y1="35" x2="60" y2="65" stroke={STROKE} strokeWidth={WIDTH} />
                      )}
                   </SymbolWrapper>
              );
          case 'SWITCH_2G_2W': 
              return (
                  <div className="w-full h-full bg-white border-2 border-black relative">
                      {/* Left Click Zone */}
                      <div 
                          className="absolute left-0 top-0 w-1/2 h-full cursor-pointer hover:bg-black/5"
                          onClick={(e) => { e.stopPropagation(); onToggleState('sw1'); }}
                          title="Switch 1"
                      />
                      {/* Right Click Zone */}
                      <div 
                          className="absolute right-0 top-0 w-1/2 h-full cursor-pointer hover:bg-black/5"
                          onClick={(e) => { e.stopPropagation(); onToggleState('sw2'); }}
                          title="Switch 2"
                      />
                      
                      <svg className="w-full h-full absolute inset-0 pointer-events-none" viewBox={`0 0 ${def.width} ${def.height}`}>
                          {/* Sw 1 Left */}
                          <circle cx="20" cy="12" r="2" fill="black" />
                          <circle cx="12" cy="64" r="2" fill="black" />
                          <circle cx="28" cy="64" r="2" fill="black" />
                          <line x1="20" y1="12" x2="20" y2="28" stroke={STROKE} strokeWidth={WIDTH} />
                          {data.state.sw1 === 1 ? 
                              <line x1="20" y1="28" x2="12" y2="64" stroke={STROKE} strokeWidth={WIDTH} /> :
                              <line x1="20" y1="28" x2="28" y2="64" stroke={STROKE} strokeWidth={WIDTH} />
                          }

                          {/* Sw 2 Right */}
                          <circle cx="60" cy="12" r="2" fill="black" />
                          <circle cx="52" cy="64" r="2" fill="black" />
                          <circle cx="68" cy="64" r="2" fill="black" />
                          <line x1="60" y1="12" x2="60" y2="28" stroke={STROKE} strokeWidth={WIDTH} />
                          {data.state.sw2 === 1 ? 
                              <line x1="60" y1="28" x2="52" y2="64" stroke={STROKE} strokeWidth={WIDTH} /> :
                              <line x1="60" y1="28" x2="68" y2="64" stroke={STROKE} strokeWidth={WIDTH} />
                          }
                          
                          {/* Earth */}
                          <text x="72" y="76" textAnchor="middle" fontSize="10">E</text>
                      </svg>
                  </div>
              );
          case 'SWITCH_INT': // L1(20,15), L2(60,15), L3(20,65), L4(60,65)
              return (
                  <SymbolWrapper {...wrapperProps}>
                      <circle cx="20" cy="15" r="2" fill="black" />
                      <circle cx="60" cy="15" r="2" fill="black" />
                      <circle cx="20" cy="65" r="2" fill="black" />
                      <circle cx="60" cy="65" r="2" fill="black" />
                      
                      {data.state.position === 1 ? (
                          // Straight
                          <>
                            <line x1="20" y1="15" x2="20" y2="65" stroke={STROKE} strokeWidth={WIDTH} strokeDasharray="4 2" />
                            <line x1="60" y1="15" x2="60" y2="65" stroke={STROKE} strokeWidth={WIDTH} strokeDasharray="4 2" />
                          </>
                      ) : (
                          // Cross
                          <>
                            <line x1="20" y1="15" x2="60" y2="65" stroke={STROKE} strokeWidth={WIDTH} strokeDasharray="4 2" />
                            <line x1="60" y1="15" x2="20" y2="65" stroke={STROKE} strokeWidth={WIDTH} strokeDasharray="4 2" />
                          </>
                      )}
                  </SymbolWrapper>
              );
          case 'MCB': // IN(30,10), OUT(30,110)
               return (
                   <SymbolWrapper {...wrapperProps}>
                       <line x1="30" y1="10" x2="30" y2="30" stroke={STROKE} strokeWidth={WIDTH} />
                       <line x1="30" y1="90" x2="30" y2="110" stroke={STROKE} strokeWidth={WIDTH} />
                       {/* Switch mechanism */}
                       {isOn ? (
                           <line x1="30" y1="30" x2="30" y2="90" stroke={STROKE} strokeWidth={WIDTH} />
                       ) : (
                           <line x1="30" y1="30" x2="45" y2="60" stroke={STROKE} strokeWidth={WIDTH} />
                       )}
                       {/* Cross for MCB */}
                       <line x1="25" y1="45" x2="35" y2="55" stroke={STROKE} strokeWidth={WIDTH} />
                       <line x1="35" y1="45" x2="25" y2="55" stroke={STROKE} strokeWidth={WIDTH} />
                       {isTripped && <text x="35" y="80" fontSize="10" fill="red" fontWeight="bold">TRIP</text>}
                   </SymbolWrapper>
               );
          case 'RCD': // L_IN(20,10), N_IN(60,10) ...
               return (
                    <SymbolWrapper {...wrapperProps}>
                        {/* L Pole */}
                        <line x1="20" y1="10" x2="20" y2="30" stroke={STROKE} strokeWidth={WIDTH} />
                        <line x1="20" y1="90" x2="20" y2="110" stroke={STROKE} strokeWidth={WIDTH} />
                        {isOn ? (
                           <line x1="20" y1="30" x2="20" y2="90" stroke={STROKE} strokeWidth={WIDTH} />
                        ) : (
                           <line x1="20" y1="30" x2="35" y2="60" stroke={STROKE} strokeWidth={WIDTH} />
                        )}
                        {/* N Pole */}
                        <line x1="60" y1="10" x2="60" y2="30" stroke={STROKE} strokeWidth={WIDTH} />
                        <line x1="60" y1="90" x2="60" y2="110" stroke={STROKE} strokeWidth={WIDTH} />
                        {isOn ? (
                           <line x1="60" y1="30" x2="60" y2="90" stroke={STROKE} strokeWidth={WIDTH} />
                        ) : (
                           <line x1="60" y1="30" x2="75" y2="60" stroke={STROKE} strokeWidth={WIDTH} />
                        )}
                        {/* RCD Oval on L switch */}
                        <ellipse cx="20" cy="60" rx="8" ry="4" fill="none" stroke={STROKE} strokeWidth={WIDTH} />
                        {/* Dashed tie */}
                        <line x1="20" y1="60" x2="60" y2="60" stroke={STROKE} strokeWidth={1} strokeDasharray="3 3" />
                    </SymbolWrapper>
               );
          case 'SOCKET_SINGLE': // L(20,60), N(60,60), E(40,20)
               return (
                   <SymbolWrapper {...wrapperProps}>
                       {/* Earth */}
                       <line x1="40" y1="20" x2="40" y2="35" stroke={STROKE} strokeWidth={WIDTH} />
                       <line x1="35" y1="35" x2="45" y2="35" stroke={STROKE} strokeWidth={WIDTH} />
                       
                       {/* Socket Arc */}
                       <path d="M 20 60 Q 40 85 60 60" fill="none" stroke={STROKE} strokeWidth={WIDTH} />
                       
                       {/* Terminals visually connecting */}
                       <line x1="20" y1="60" x2="20" y2="60" stroke={STROKE} strokeWidth={WIDTH} />
                       <line x1="60" y1="60" x2="60" y2="60" stroke={STROKE} strokeWidth={WIDTH} />

                       {/* Switch if ON/OFF */}
                       {isOn && <circle cx="70" cy="70" r="3" fill="red" opacity="0.5" />}
                   </SymbolWrapper>
               );
          case 'SOCKET_DOUBLE':
               return (
                   <SymbolWrapper {...wrapperProps}>
                       {/* Left Socket */}
                       <path d="M 30 60 Q 50 85 70 60" fill="none" stroke={STROKE} strokeWidth={WIDTH} />
                       <line x1="50" y1="35" x2="50" y2="45" stroke={STROKE} strokeWidth={WIDTH} />
                       <line x1="45" y1="45" x2="55" y2="45" stroke={STROKE} strokeWidth={WIDTH} />

                       {/* Right Socket */}
                       {/* Note: Terminals for right socket aren't explicit in double socket simple model, usually wired once */}
                       <path d="M 90 60 Q 110 85 130 60" fill="none" stroke={STROKE} strokeWidth={WIDTH} />
                       <line x1="110" y1="35" x2="110" y2="45" stroke={STROKE} strokeWidth={WIDTH} />
                       <line x1="105" y1="45" x2="115" y2="45" stroke={STROKE} strokeWidth={WIDTH} />
                   </SymbolWrapper>
               );
          case 'LAMP_PENDANT': // Center approx 50,75
               return (
                   <SymbolWrapper {...wrapperProps}>
                       {/* Circle with Cross */}
                       <circle cx="50" cy="90" r="20" fill="none" stroke={STROKE} strokeWidth={WIDTH} />
                       <line x1="36" y1="76" x2="64" y2="104" stroke={STROKE} strokeWidth={WIDTH} />
                       <line x1="64" y1="76" x2="36" y2="104" stroke={STROKE} strokeWidth={WIDTH} />
                       
                       {/* Connections from rose terminals */}
                       <line x1="20" y1="120" x2="35" y2="100" stroke={STROKE} strokeWidth={1} strokeDasharray="2 2" />
                       <line x1="80" y1="120" x2="65" y2="100" stroke={STROKE} strokeWidth={1} strokeDasharray="2 2" />
                       
                       {/* Rose Box Area */}
                       <rect x="10" y="110" width="80" height="20" fill="none" stroke={STROKE} strokeWidth={1} strokeDasharray="1 1" />
                   </SymbolWrapper>
               );
          case 'SOURCE_AC':
               return (
                   <SymbolWrapper {...wrapperProps}>
                       <circle cx="50" cy="50" r="30" fill="none" stroke={STROKE} strokeWidth={WIDTH} />
                       <path d="M 35 50 Q 42 40 50 50 T 65 50" fill="none" stroke={STROKE} strokeWidth={WIDTH} />
                   </SymbolWrapper>
               );
          case 'SOURCE_3PH':
               return (
                   <SymbolWrapper {...wrapperProps}>
                       <rect x="10" y="10" width="120" height="80" fill="none" stroke={STROKE} strokeWidth={WIDTH} />
                       <text x="60" y="55" textAnchor="middle" fontSize="20" fontFamily="serif" fontWeight="bold">3 ~</text>
                   </SymbolWrapper>
               );
           case 'FAN':
           case 'FAN_PLUG':
               return (
                   <SymbolWrapper {...wrapperProps}>
                       <circle cx="40" cy="40" r="30" fill="none" stroke={STROKE} strokeWidth={WIDTH} />
                       <text x="40" y="45" textAnchor="middle" fontSize="24" fontFamily="serif" fontWeight="bold">M</text>
                   </SymbolWrapper>
               );
           case 'JUNCTION_BOX':
               return (
                   <SymbolWrapper {...wrapperProps}>
                       <circle cx="50" cy="50" r="40" fill="none" stroke={STROKE} strokeWidth={WIDTH} />
                       <circle cx="25" cy="25" r="3" fill="black" />
                       <circle cx="75" cy="25" r="3" fill="black" />
                       <circle cx="75" cy="75" r="3" fill="black" />
                       <circle cx="25" cy="75" r="3" fill="black" />
                   </SymbolWrapper>
               );
           case 'BAR_NEUTRAL':
           case 'BAR_EARTH':
               return (
                   <SymbolWrapper {...wrapperProps}>
                       <line x1="10" y1="20" x2="130" y2="20" stroke={STROKE} strokeWidth={4} />
                       <circle cx="20" cy="20" r="3" fill="white" stroke={STROKE} />
                       <circle cx="45" cy="20" r="3" fill="white" stroke={STROKE} />
                       <circle cx="70" cy="20" r="3" fill="white" stroke={STROKE} />
                       <circle cx="95" cy="20" r="3" fill="white" stroke={STROKE} />
                       <circle cx="120" cy="20" r="3" fill="white" stroke={STROKE} />
                   </SymbolWrapper>
               );
          default:
              // Fallback generic box
              return (
                  <SymbolWrapper {...wrapperProps}>
                      <rect x="2" y="2" width={def.width-4} height={def.height-4} fill="none" stroke={STROKE} strokeWidth={WIDTH} />
                      <text x="50%" y="50%" textAnchor="middle" fontSize="10">{def.name.substring(0,8)}</text>
                  </SymbolWrapper>
              );
      }
  };

  // Specific Visuals (Realistic)
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
      case 'SWITCH_2G_2W':
        return (
          <div className="w-full h-full bg-white border border-gray-300 rounded shadow-sm flex items-center justify-center p-1 gap-1 select-none">
              {/* Switch 1 */}
              <div 
                 className={`h-4/5 flex-1 border rounded shadow-sm cursor-pointer flex items-center justify-center transition-colors ${data.state.sw1 === 1 ? 'bg-gray-50' : 'bg-gray-100'}`}
                 onClick={(e) => { e.stopPropagation(); onToggleState('sw1'); }}
              >
                  <div className={`w-3 h-8 border bg-white shadow-sm transition-transform ${data.state.sw1 === 1 ? '-translate-y-1' : 'translate-y-1'}`}></div>
              </div>
              {/* Switch 2 */}
              <div 
                 className={`h-4/5 flex-1 border rounded shadow-sm cursor-pointer flex items-center justify-center transition-colors ${data.state.sw2 === 1 ? 'bg-gray-50' : 'bg-gray-100'}`}
                 onClick={(e) => { e.stopPropagation(); onToggleState('sw2'); }}
              >
                  <div className={`w-3 h-8 border bg-white shadow-sm transition-transform ${data.state.sw2 === 1 ? '-translate-y-1' : 'translate-y-1'}`}></div>
              </div>
          </div>
        );
      case 'SWITCH_ROTARY':
        const rPos = data.state.position; // 1, 2, 3
        const rotationMap: Record<number, number> = { 1: -50, 2: 0, 3: 50 };
        const rotation = rotationMap[rPos] || -50;
        
        return (
          <div 
            className="w-full h-full bg-white border border-gray-300 rounded shadow-sm relative cursor-pointer"
            onClick={(e) => { e.stopPropagation(); onToggleState(); }}
          >
              <div className="absolute inset-0 flex items-center justify-center">
                  {/* Knob Body */}
                  <div 
                    className="w-10 h-10 rounded-full border-2 border-gray-400 bg-gray-100 shadow-sm flex items-center justify-center transition-transform duration-200"
                    style={{ transform: `rotate(${rotation}deg)`}}
                  >
                      {/* Knob Indicator Line */}
                      <div className="w-1 h-4 bg-gray-600 rounded-full absolute top-1"></div>
                  </div>
              </div>
              
              {/* Position Labels */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
                 <div className="absolute top-[20%] left-[25%] text-[8px] font-bold text-gray-400">1</div>
                 <div className="absolute top-[12%] left-1/2 -translate-x-1/2 text-[8px] font-bold text-gray-400">2</div>
                 <div className="absolute top-[20%] right-[25%] text-[8px] font-bold text-gray-400">3</div>
              </div>
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
      case 'SWITCH_COOKER':
        return (
            <div className="flex w-full h-full bg-white border border-gray-400 rounded-sm shadow-sm relative select-none">
                {/* Left Side: Socket */}
                <div 
                    className="w-1/2 h-full flex flex-col items-center justify-center border-r border-gray-200 relative cursor-pointer hover:bg-gray-50"
                    onClick={(e) => { e.stopPropagation(); onToggleState('socket'); }}
                >
                     {/* Socket Holes */}
                     <div className="flex flex-col items-center mt-1">
                          <div className="w-1.5 h-3 bg-black rounded-t-sm mb-1"></div>
                          <div className="flex gap-3">
                            <div className="w-1.5 h-2.5 bg-black"></div>
                            <div className="w-1.5 h-2.5 bg-black"></div>
                          </div>
                     </div>
                     {/* Socket Switch */}
                     <div className={`absolute top-4 right-4 w-2 h-3 border border-gray-500 flex flex-col ${data.state.isSocketOn ? 'bg-gray-200' : 'bg-gray-50'}`}>
                         <div className={`h-1.5 w-full bg-gray-600 transition-transform ${data.state.isSocketOn ? 'translate-y-1.5' : 'translate-y-0'}`}></div>
                     </div>
                </div>

                {/* Right Side: Main Switch */}
                <div 
                    className="w-1/2 h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
                    onClick={(e) => { e.stopPropagation(); onToggleState(); }}
                >
                    <div className="flex items-center gap-2 mb-2 w-full justify-center px-2">
                        <span className="text-[8px] font-bold text-gray-500 tracking-widest">COOKER</span>
                        {/* Neon */}
                        <div className={`w-3 h-3 rounded-full border border-gray-300 ${isOn && isEnergized ? 'bg-orange-500 shadow-[0_0_6px_orange]' : 'bg-red-950'}`}></div>
                    </div>

                    {/* Rocker */}
                    <div className={`w-12 h-8 border-2 border-red-900 rounded-md flex items-center justify-center transition-colors shadow-inner ${isOn ? 'bg-red-600' : 'bg-red-700'}`}>
                         <div className={`w-8 h-1 bg-white opacity-40 rounded-full ${isOn ? 'opacity-80' : 'opacity-20'}`}></div>
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
      case 'SOURCE_3PH':
        return (
          <div className="flex flex-col items-center justify-center p-2 w-full h-full bg-gray-50 border-2 border-slate-700 rounded-sm">
             <div className="flex gap-2 mb-2">
                 {/* L1 - Brown */}
                 <div className={`w-3 h-3 rounded-full ${isOn ? 'bg-[#8B4513] shadow-[0_0_5px_#8B4513]' : 'bg-[#3E1F08]'}`} title="L1 (Brown)"></div>
                 {/* L2 - Black */}
                 <div className={`w-3 h-3 rounded-full ${isOn ? 'bg-black shadow-[0_0_5px_rgba(0,0,0,0.5)] border border-gray-600' : 'bg-gray-800'}`} title="L2 (Black)"></div>
                 {/* L3 - Grey */}
                 <div className={`w-3 h-3 rounded-full ${isOn ? 'bg-gray-400 shadow-[0_0_5px_gray]' : 'bg-gray-600'}`} title="L3 (Grey)"></div>
             </div>
             <button 
              className={`w-full px-2 py-1 text-[10px] rounded text-white font-bold border-b-2 active:border-b-0 active:mt-[2px] ${isOn ? 'bg-red-600 border-red-800' : 'bg-gray-600 border-gray-800'}`}
              onClick={(e) => { e.stopPropagation(); onToggleState(); }}
            >
              {isOn ? '400V ON' : 'ISOLATED'}
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
      case 'JUNCTION_BOX':
        return (
             <div className="w-full h-full bg-white border border-gray-400 rounded-full shadow-sm flex items-center justify-center relative">
                 <div className="w-3/4 h-3/4 border border-gray-300 rounded-full flex items-center justify-center">
                     <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                 </div>
                 {/* Visual Tabs for terminals (just for show, actual terminals are overlaid) */}
                 <div className="absolute top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-200 rounded-full"></div>
                 <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-gray-200 rounded-full"></div>
                 <div className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-gray-200 rounded-full"></div>
                 <div className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-gray-200 rounded-full"></div>
             </div>
        );
      case 'OUTLET_COOKER':
        return (
          <div className="w-full h-full bg-white border border-gray-300 rounded-sm shadow-sm flex flex-col items-center justify-between py-2 relative">
             {/* Input Label */}
             <div className="text-[6px] text-gray-400 uppercase tracking-widest mt-1">Supply In</div>
             
             <div className="relative w-full flex flex-col items-center">
                 {/* Screw caps */}
                 <div className="w-full flex justify-center gap-4 mb-1">
                     <div className="w-2 h-2 rounded-full border border-gray-300 bg-gray-50"></div>
                     <div className="w-2 h-2 rounded-full border border-gray-300 bg-gray-50"></div>
                 </div>
                 
                 <div className="font-bold text-[8px] text-gray-600 text-center leading-tight">COOKER<br/>OUTLET</div>

                 {/* Cable Exit Nose */}
                 <div className="w-12 h-6 bg-gray-100 border border-gray-300 rounded-t-xl border-b-0 relative z-10 shadow-sm mt-2"></div>
                 {/* Cable Stub */}
                 <div className="w-8 h-4 bg-gray-400 rounded-b-md -mt-px z-0"></div>
             </div>
             
             {/* Output Label */}
             <div className="text-[6px] text-gray-400 uppercase tracking-widest mb-1">Load Out</div>
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

      {/* Component Content (Visuals OR Symbols) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showSymbols ? renderSymbol() : renderVisuals()}
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
                {data.properties?.label || def.name}
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
