import React from 'react';
import { ComponentInstance, Wire, WireColor } from '../types';
import { COMPONENT_CATALOG } from '../constants';
import { Trash2, Zap, Tag, Activity, Pipette, Disc, X, Earth } from 'lucide-react';

interface Props {
  selectedCompId: string | null;
  selectedWireId: string | null;
  components: ComponentInstance[];
  wires: Wire[];
  onUpdateComponent: (id: string, updates: Partial<ComponentInstance> | ((prev: ComponentInstance) => Partial<ComponentInstance>)) => void;
  onUpdateWire: (id: string, updates: Partial<Wire>) => void;
  onDelete: () => void;
}

export const PropertiesPanel: React.FC<Props> = ({
  selectedCompId,
  selectedWireId,
  components,
  wires,
  onUpdateComponent,
  onUpdateWire,
  onDelete
}) => {
  const selectedComp = components.find(c => c.id === selectedCompId);
  const selectedWire = wires.find(w => w.id === selectedWireId);

  // Helper for Wire Colors
  const renderColorBtn = (color: WireColor, isSelected: boolean, onClick: () => void) => {
      const bgMap: Record<string, string> = {
          brown: '#8B4513', blue: '#0056b3', green: '#22c55e', black: '#111827', grey: '#9ca3af'
      };
      
      return (
        <button
            onClick={onClick}
            className={`w-6 h-6 rounded-full border-2 transition-all relative ${isSelected ? 'border-gray-900 scale-110 shadow-sm' : 'border-transparent hover:scale-105'}`}
            style={{ backgroundColor: bgMap[color] }}
            title={color.charAt(0).toUpperCase() + color.slice(1)}
        >
             {color === 'green' && (
                 <div className="absolute inset-0 rounded-full opacity-50" style={{backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 3px, #eab308 3px, #eab308 6px)'}}></div>
             )}
        </button>
      );
  };

  if (!selectedComp && !selectedWire) {
    return (
      <div className="bg-slate-50 border-t border-gray-200 py-0.5 text-[10px] text-gray-400 text-center select-none uppercase tracking-wider font-semibold">
         No Selection
      </div>
    );
  }

  return (
    <div className="bg-white border-t border-gray-200 px-4 py-2 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40 transition-all duration-200 min-h-[60px] flex items-center">
        <div className="flex items-center gap-4 mx-auto w-full max-w-7xl overflow-x-auto no-scrollbar">
            
            {/* --- WIRE PROPERTIES --- */}
            {selectedWire && (
                <>
                    <div className="flex flex-col gap-1 shrink-0">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <Activity size={10} /> Conductor
                        </span>
                        <div className="flex gap-1.5 bg-gray-50 p-1 rounded-full border border-gray-100">
                            {(['brown', 'black', 'grey', 'blue', 'green'] as WireColor[]).map(c => 
                                renderColorBtn(c, selectedWire.color === c, () => onUpdateWire(selectedWire.id, { color: c }))
                            )}
                        </div>
                    </div>

                    <div className="w-px h-8 bg-gray-200 shrink-0 mx-2"></div>

                    <div className="flex flex-col gap-1 shrink-0">
                         <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <Pipette size={10} /> Sleeving
                        </span>
                        <div className="flex gap-1.5 items-center bg-gray-50 p-1 rounded-full border border-gray-100">
                            <button 
                                onClick={() => onUpdateWire(selectedWire.id, { sleeving: undefined })}
                                className={`w-6 h-6 rounded-full border flex items-center justify-center text-gray-400 bg-white hover:text-red-500 transition-colors ${!selectedWire.sleeving ? 'border-gray-400 bg-gray-100 text-gray-600' : 'border-gray-200'}`}
                                title="No Sleeving"
                            >
                                <X size={12} />
                            </button>
                            {(['brown', 'blue', 'green'] as WireColor[]).map(c => 
                                renderColorBtn(c, selectedWire.sleeving === c, () => onUpdateWire(selectedWire.id, { sleeving: selectedWire.sleeving === c ? undefined : c }))
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* --- COMPONENT PROPERTIES --- */}
            {selectedComp && (
                <>
                    {(() => {
                        const def = COMPONENT_CATALOG[selectedComp.type];
                        const isProtection = def.category === 'protection' || selectedComp.type === 'SWITCH_FUSED';
                        const isLoad = def.category === 'load';
                        const isSupply = selectedComp.type === 'SOURCE_AC' || selectedComp.type === 'SOURCE_3PH';
                        
                        return (
                            <>
                                {/* Identity */}
                                <div className="flex flex-col gap-1 min-w-[140px] shrink-0">
                                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                        <Tag size={10} /> Label
                                    </span>
                                    <input 
                                        type="text" 
                                        value={selectedComp.properties?.label || ''}
                                        onChange={(e) => onUpdateComponent(selectedComp.id, prev => ({
                                            properties: { ...prev.properties, label: e.target.value }
                                        }))}
                                        placeholder={def.name}
                                        className="h-7 text-xs border border-gray-300 rounded px-2 focus:border-blue-500 focus:outline-none bg-gray-50 focus:bg-white transition-colors"
                                    />
                                </div>

                                <div className="w-px h-8 bg-gray-200 shrink-0 mx-2"></div>

                                {/* State Controls */}
                                {(selectedComp.state.isOn !== undefined || selectedComp.state.isTripped !== undefined) && (
                                     <div className="flex flex-col gap-1 shrink-0">
                                         <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                            <Activity size={10} /> State
                                        </span>
                                        <div className="flex items-center gap-2 h-7">
                                            {/* On/Off Switch */}
                                            {selectedComp.state.isOn !== undefined && (
                                                <button 
                                                    onClick={() => onUpdateComponent(selectedComp.id, prev => {
                                                        if (selectedComp.type === 'SWITCH_2W' || selectedComp.type === 'SWITCH_INT') {
                                                            return { state: { ...prev.state, position: prev.state.position === 1 ? 2 : 1 } };
                                                        }
                                                        if (prev.state.isTripped) {
                                                            return { state: { ...prev.state, isTripped: false, isOn: false } };
                                                        }
                                                        return { state: { ...prev.state, isOn: !prev.state.isOn } };
                                                    })}
                                                    className={`px-3 py-1 rounded text-[10px] font-bold border shadow-sm transition-all ${
                                                        selectedComp.state.isOn 
                                                        ? 'bg-green-100 text-green-700 border-green-200 hover:bg-green-200' 
                                                        : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    {selectedComp.type === 'SWITCH_2W' || selectedComp.type === 'SWITCH_INT' 
                                                        ? (selectedComp.state.position === 1 ? 'POS 1' : 'POS 2') 
                                                        : (selectedComp.state.isOn ? 'ON' : 'OFF')}
                                                </button>
                                            )}
                                            
                                            {/* Tripped State */}
                                            {selectedComp.state.isTripped !== undefined && (
                                                <button 
                                                    disabled={!selectedComp.state.isTripped}
                                                    onClick={() => onUpdateComponent(selectedComp.id, { state: { isTripped: false, isOn: false } })}
                                                    className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold border transition-colors ${
                                                        selectedComp.state.isTripped 
                                                        ? 'bg-red-100 text-red-600 border-red-200 animate-pulse hover:bg-red-200 cursor-pointer' 
                                                        : 'bg-gray-50 text-gray-300 border-gray-100 cursor-default'
                                                    }`}
                                                >
                                                    <Disc size={10} /> {selectedComp.state.isTripped ? 'TRIPPED (RESET)' : 'OK'}
                                                </button>
                                            )}
                                        </div>
                                     </div>
                                )}

                                {/* Specs */}
                                {(isProtection || isLoad) && (
                                    <>
                                        <div className="w-px h-8 bg-gray-200 shrink-0 mx-2"></div>
                                        <div className="flex flex-col gap-1 shrink-0">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                                <Zap size={10} /> {isProtection ? 'Rating' : 'Load'}
                                            </span>
                                            <div className="relative">
                                                <input 
                                                    type="number"
                                                    value={selectedComp.properties?.rating ?? (selectedComp.properties?.watts ?? (isProtection ? def.rating : def.loadWatts))}
                                                    onChange={(e) => onUpdateComponent(selectedComp.id, prev => ({
                                                        properties: { 
                                                            ...prev.properties, 
                                                            [isProtection ? 'rating' : 'watts']: Number(e.target.value) 
                                                        }
                                                    }))}
                                                    className="h-7 w-20 pl-2 pr-6 text-xs border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                                                />
                                                <span className="absolute right-2 top-1.5 text-[10px] font-bold text-gray-400">
                                                    {isProtection ? 'A' : 'W'}
                                                </span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Supply Earthing */}
                                {isSupply && (
                                    <>
                                        <div className="w-px h-8 bg-gray-200 shrink-0 mx-2"></div>
                                        <div className="flex flex-col gap-1 shrink-0">
                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                                <Earth size={10} /> Earthing
                                            </span>
                                            <select
                                                value={selectedComp.properties?.earthing || 'TN-C-S'}
                                                onChange={(e) => onUpdateComponent(selectedComp.id, prev => ({
                                                    properties: { ...prev.properties, earthing: e.target.value }
                                                }))}
                                                className="h-7 text-xs border border-gray-300 rounded px-2 focus:border-blue-500 focus:outline-none bg-gray-50 focus:bg-white transition-colors cursor-pointer"
                                            >
                                                <option value="TN-C-S">TN-C-S (PME)</option>
                                                <option value="TN-S">TN-S</option>
                                                <option value="TT">TT</option>
                                                <option value="IT">IT</option>
                                            </select>
                                        </div>
                                    </>
                                )}
                            </>
                        );
                    })()}
                </>
            )}

            {/* Spacer to push Delete to end */}
            <div className="flex-1"></div>

            {/* Delete Action */}
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200 shrink-0">
                <span className="hidden sm:inline-block text-[10px] font-mono text-gray-300">
                    {selectedWireId ? `ID: ${selectedWireId.substring(0,6)}` : `ID: ${selectedCompId?.substring(0,6)}`}
                </span>
                <button 
                    onClick={onDelete} 
                    className="group flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 hover:border-red-200 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded shadow-sm transition-all"
                    title="Delete Selected Item (Del)"
                >
                    <Trash2 size={14} className="group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-bold">Delete</span>
                </button>
            </div>
        </div>
    </div>
  );
};