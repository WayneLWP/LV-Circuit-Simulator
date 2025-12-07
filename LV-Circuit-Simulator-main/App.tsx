

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { COMPONENT_CATALOG } from './constants';
import { ComponentInstance, Wire, Position, WireColor, SimulationResult, MultimeterState, MeggerState } from './types';
import { ComponentNode } from './components/ComponentNode';
import { PropertiesPanel } from './components/PropertiesPanel';
import { Multimeter } from './components/Multimeter';
import { Megger } from './components/Megger';
import { runSimulation } from './utils/circuit';
import { RotateCcw, Zap, ShieldAlert, Trash2, Eye, EyeOff, Pipette, Activity, ChevronDown, ChevronRight, Calculator, Plug, Copy, RotateCw, PenTool, ClipboardCheck } from 'lucide-react';

const SNAP_GRID = 10;
const STUB_LENGTH = 10; // Default stub length

// --- Custom Icons for Sidebar ---
const IconStyle = "w-8 h-8 text-slate-700 mb-2";
const StrokeWidth = 1.5;

const IconAcSupply = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="text-red-600 mb-2">
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12c.5-2 2-2 2.5 0s2 2 2.5 0s2-2 2.5 0" />
    <path d="M12 3v3" strokeOpacity="0.5" />
    <path d="M12 18v3" strokeOpacity="0.5" />
  </svg>
);

const Icon3PhSupply = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="text-red-800 mb-2">
    <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" />
    <path d="M6 10l3 4l3-4" stroke="currentColor" />
    <circle cx="7" cy="8" r="1" fill="currentColor" />
    <circle cx="12" cy="8" r="1" fill="currentColor" />
    <circle cx="17" cy="8" r="1" fill="currentColor" />
  </svg>
);

const IconNeutralBar = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="text-blue-600 mb-2">
    <rect x="2" y="8" width="20" height="8" rx="1" />
    <circle cx="6" cy="12" r="1" fill="currentColor" />
    <circle cx="10" cy="12" r="1" fill="currentColor" />
    <circle cx="14" cy="12" r="1" fill="currentColor" />
    <circle cx="18" cy="12" r="1" fill="currentColor" />
  </svg>
);

const IconEarthBar = () => (
   <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="text-green-600 mb-2">
    <rect x="2" y="8" width="20" height="8" rx="1" />
    <line x1="5" y1="13" x2="5" y2="11" />
    <line x1="9" y1="13" x2="9" y2="11" />
    <line x1="13" y1="13" x2="13" y2="11" />
    <line x1="17" y1="13" x2="17" y2="11" />
    <line x1="3" y1="16" x2="21" y2="16" strokeOpacity="0.2" />
  </svg>
);

const IconConsumerUnit = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={IconStyle}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <rect x="6" y="11" width="3" height="6" rx="0.5" />
    <rect x="11" y="11" width="3" height="6" rx="0.5" />
    <rect x="16" y="11" width="3" height="6" rx="0.5" />
  </svg>
);

const IconMCB = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={IconStyle}>
    <rect x="7" y="3" width="10" height="18" rx="1.5" />
    <path d="M12 13v4" />
    <path d="M12 7v2" />
    <rect x="10" y="9" width="4" height="4" rx="0.5" />
  </svg>
);

const IconRCD = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={IconStyle}>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <line x1="12" y1="3" x2="12" y2="21" opacity="0.3" />
    <rect x="6" y="12" width="4" height="5" rx="0.5" />
    <rect x="14" y="12" width="4" height="5" rx="0.5" />
    <circle cx="16" cy="7" r="1.5" />
  </svg>
);

const IconSwitch = ({ label }: { label?: string }) => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={IconStyle}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <rect x="8" y="8" width="8" height="8" rx="1" />
    <line x1="12" y1="8" x2="12" y2="16" opacity="0.3" />
    {label && <text x="12" y="23" textAnchor="middle" fontSize="7" stroke="none" fill="currentColor" fontWeight="bold">{label}</text>}
  </svg>
);

const IconSwitchFused = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={IconStyle}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <rect x="5" y="8" width="6" height="8" rx="1" />
    <rect x="14" y="9" width="4" height="6" rx="0.5" />
    <line x1="16" y1="10" x2="16" y2="14" />
  </svg>
);

const IconCookerSwitch = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={IconStyle}>
    <rect x="2" y="8" width="20" height="10" rx="1" />
    <line x1="12" y1="8" x2="12" y2="18" strokeOpacity="0.2" />
    <rect x="14" y="10" width="6" height="6" rx="1" fill="currentColor" fillOpacity="0.2" />
    <circle cx="18" cy="11" r="1" fill="currentColor" />
  </svg>
);

const IconRotary = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={IconStyle}>
    <rect x="4" y="4" width="16" height="16" rx="2" className="text-slate-500" />
    <circle cx="12" cy="12" r="6" className="text-yellow-500" fill="currentColor" fillOpacity="0.2" />
    <rect x="11" y="8" width="2" height="8" rx="1" className="text-red-600" fill="currentColor" />
  </svg>
);

const IconLampPendant = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="text-yellow-600 mb-2">
    <path d="M12 2v6" />
    <rect x="10" y="2" width="4" height="3" fill="currentColor" fillOpacity="0.2" rx="0.5" />
    <circle cx="12" cy="14" r="5" />
    <path d="M12 14l-2 2" opacity="0.5" />
    <path d="M12 14l2 2" opacity="0.5" />
  </svg>
);

const IconSocketSingle = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={IconStyle}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M12 8v3" strokeWidth="2" />
    <circle cx="8" cy="14" r="1.5" fill="currentColor" />
    <circle cx="16" cy="14" r="1.5" fill="currentColor" />
    <rect x="15" y="5" width="3" height="4" rx="0.5" />
  </svg>
);

const IconSocketDouble = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={IconStyle}>
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <line x1="12" y1="6" x2="12" y2="18" strokeOpacity="0.2" />
    {/* Left */}
    <path d="M7 10v2" strokeWidth="2" />
    <circle cx="5" cy="14" r="1" fill="currentColor" />
    <circle cx="9" cy="14" r="1" fill="currentColor" />
    {/* Right */}
    <path d="M17 10v2" strokeWidth="2" />
    <circle cx="15" cy="14" r="1" fill="currentColor" />
    <circle cx="19" cy="14" r="1" fill="currentColor" />
  </svg>
);

const IconFan = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={IconStyle}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <circle cx="12" cy="12" r="6" />
    <path d="M12 12L12 8C14 8 15 9 15 10L12 12Z" />
    <path d="M12 12L16 12C16 14 15 15 14 15L12 12Z" />
    <path d="M12 12L12 16C10 16 9 15 9 14L12 12Z" />
    <path d="M12 12L8 12C8 10 9 9 10 9L12 12Z" />
  </svg>
);

const IconFanPortable = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={IconStyle}>
    <circle cx="10" cy="9" r="5" />
    <path d="M10 9v-3" />
    <path d="M10 9h3" />
    <path d="M10 9v3" />
    <path d="M10 9h-3" />
    <path d="M10 14v4" />
    <path d="M7 18h6" />
    <path d="M14 18c2 0 3 0 3-2s0-3 3-3" strokeDasharray="2 2" />
    <rect x="19" y="11" width="3" height="4" rx="0.5" fill="currentColor" fillOpacity="0.2" />
  </svg>
);

const IconJunctionBox = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={IconStyle}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="8" cy="8" r="1" fill="currentColor" />
    <circle cx="16" cy="8" r="1" fill="currentColor" />
    <circle cx="16" cy="16" r="1" fill="currentColor" />
    <circle cx="8" cy="16" r="1" fill="currentColor" />
    <path d="M12 3v2" />
    <path d="M21 12h-2" />
    <path d="M12 21v-2" />
    <path d="M3 12h2" />
  </svg>
);

const IconConnector = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={IconStyle}>
    <rect x="8" y="5" width="8" height="14" rx="1" />
    <line x1="8" y1="9" x2="16" y2="9" />
    <line x1="8" y1="15" x2="16" y2="15" />
    <circle cx="12" cy="7" r="1" fill="currentColor" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <circle cx="12" cy="17" r="1" fill="currentColor" />
  </svg>
);

const IconCookerOutlet = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className={IconStyle}>
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M12 16v4" strokeWidth="2" opacity="0.5"/>
    <path d="M9 16h6v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2z" fill="currentColor" fillOpacity="0.2" />
    <circle cx="8" cy="8" r="1" fill="currentColor" />
    <circle cx="16" cy="8" r="1" fill="currentColor" />
  </svg>
);

const IconMultimeter = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500 mb-2">
    <rect x="6" y="2" width="12" height="20" rx="2" fill="currentColor" fillOpacity="0.1" />
    <rect x="8" y="4" width="8" height="6" rx="1" stroke="currentColor" />
    <circle cx="12" cy="15" r="3" stroke="currentColor" />
    <line x1="12" y1="15" x2="14" y2="13" stroke="currentColor" />
  </svg>
);

const IconMegger = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={StrokeWidth} strokeLinecap="round" strokeLinejoin="round" className="text-orange-500 mb-2">
      <rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor" fillOpacity="0.1" />
      <path d="M8 8h8v6H8z" stroke="currentColor" />
      <circle cx="12" cy="17" r="2" stroke="currentColor" />
      <path d="M12 17l2 -2" stroke="currentColor" />
  </svg>
);


// Helper to generate IDs
const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper for wire colors
const getWireColorHex = (color: WireColor) => {
  switch (color) {
    case 'brown': return '#8B4513';
    case 'blue': return '#0056b3';
    case 'green': return '#22c55e';
    case 'black': return '#111827'; // gray-900
    case 'grey': return '#9ca3af'; // gray-400
    default: return '#8B4513';
  }
};

// --- Collision Detection Helpers ---

const getVisualRect = (comp: ComponentInstance) => {
  const def = COMPONENT_CATALOG[comp.type];
  if (!def) return { x: 0, y: 0, w: 0, h: 0 };
  
  // Visual center is always position + width/2, height/2 (relative to unrotated)
  // Because transform-origin is center center.
  const cx = comp.position.x + def.width / 2;
  const cy = comp.position.y + def.height / 2;
  
  const isRotated = (comp.rotation % 180) === 90;
  const w = isRotated ? def.height : def.width;
  const h = isRotated ? def.width : def.height;
  
  return {
    x: cx - w / 2,
    y: cy - h / 2,
    w,
    h
  };
};

const isOverlapping = (r1: {x:number, y:number, w:number, h:number}, r2: {x:number, y:number, w:number, h:number}) => {
   const buffer = 0; 
   return r1.x < r2.x + r2.w - buffer &&
          r1.x + r1.w > r2.x + buffer &&
          r1.y < r2.y + r2.h - buffer &&
          r1.y + r1.h > r2.y + buffer;
};

// Helper: Get closest point on segment p1-p2
function getClosestPointOnSegment(p: Position, a: Position, b: Position) {
  const atob = { x: b.x - a.x, y: b.y - a.y };
  const atop = { x: p.x - a.x, y: p.y - a.y };
  const lenSq = atob.x * atob.x + atob.y * atob.y;
  let t = 0;
  if (lenSq > 0) {
      t = (atop.x * atob.x + atop.y * atob.y) / lenSq;
  }
  // Clamp t
  t = Math.max(0, Math.min(1, t));
  const closest = {
      x: a.x + t * atob.x,
      y: a.y + t * atob.y
  };
  return closest;
}

interface WireGeometry {
  wire: Wire;
  points: Position[];
  segments: { h: {y: number, minX: number, maxX: number}[], v: {x: number, minY: number, maxY: number}[] };
  trunkStart: Position;
  trunkEnd: Position;
  startStubDir: number;
  endStubDir: number;
}

export default function App() {
  // --- State ---
  const [components, setComponents] = useState<ComponentInstance[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  
  // View State (Pan & Zoom)
  const [viewState, setViewState] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const lastMousePos = useRef({ x: 0, y: 0 }); // Track raw mouse for panning
  const [showLabels, setShowLabels] = useState(false);
  const [showSymbols, setShowSymbols] = useState(false); // New state for symbols
  const [showCurrentFlow, setShowCurrentFlow] = useState(true);
  
  // UI State
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [currentWireColor, setCurrentWireColor] = useState<WireColor>('brown');
  const [simResult, setSimResult] = useState<SimulationResult>({ 
    energizedComponents: new Set(), 
    trippedBreakers: new Set(), 
    errors: [], 
    flowingWires: new Map(),
    nodePotentials: new Map() 
  });
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  // Interaction State
  const [isDraggingComp, setIsDraggingComp] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 }); // Offset in WORLD coordinates
  const [draggingPlug, setDraggingPlug] = useState<string | null>(null); // Component ID whose plug is being dragged
  
  // Multimeter State
  const [multimeter, setMultimeter] = useState<MultimeterState>({
    visible: false,
    position: { x: window.innerWidth - 300, y: 100 }, // Default Screen Coordinates
    mode: 'VOLTAGE',
    redProbeNode: null,
    blackProbeNode: null,
    clampedWireId: null,
    redProbePosition: undefined,
    blackProbePosition: undefined,
    clampPosition: undefined,
    clampRotation: undefined
  });

  // Megger State
  const [megger, setMegger] = useState<MeggerState>({
      visible: false,
      position: { x: window.innerWidth - 300, y: 350 },
      mode: 'OFF',
      isTestActive: false,
      redProbeNode: null,
      blackProbeNode: null,
      redProbePosition: undefined,
      blackProbePosition: undefined
  });

  // Transient state for dragging multimeter/megger probes/clamps (Visual only)
  // Extended type for dragging probes
  const [draggingProbe, setDraggingProbe] = useState<'red' | 'black' | 'clamp' | 'megger-red' | 'megger-black' | null>(null);
  const [probeDragPos, setProbeDragPos] = useState<Position>({ x: 0, y: 0 }); // Mouse Pos during drag (Screen Coords)
  const [potentialSnapTerminal, setPotentialSnapTerminal] = useState<string | null>(null);
  const [potentialSnapWire, setPotentialSnapWire] = useState<string | null>(null);
  const [potentialSnapClamp, setPotentialSnapClamp] = useState<{ position: Position, rotation: number } | null>(null);
  const dragStartTime = useRef<number>(0);

  // Wire Handle Dragging
  const [draggingWireSegment, setDraggingWireSegment] = useState<{ id: string, segment: 'trunk' | 'start' | 'end' } | null>(null);
  
  const [drawingWire, setDrawingWire] = useState<{
    fromCompId: string;
    fromTerminal: string;
    currentPos: Position; // World Coordinates
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // --- Coordinate Helpers ---

  // Convert Screen (Client) coordinates to World (Canvas) coordinates
  const screenToWorld = useCallback((clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return {
        x: (x - viewState.x) / viewState.scale,
        y: (y - viewState.y) / viewState.scale
    };
  }, [viewState]);

  // --- Graph / Connectivity Helpers for Tester Tools ---
  const checkConnectivity = (nodeA: string, nodeB: string): boolean => {
      // Build Adjacency Graph from components and wires
      const graph = new Map<string, string[]>();
      
      const addEdge = (n1: string, n2: string) => {
        if (!graph.has(n1)) graph.set(n1, []);
        if (!graph.has(n2)) graph.set(n2, []);
        graph.get(n1)!.push(n2);
        graph.get(n2)!.push(n1);
      };

      wires.forEach(w => {
        addEdge(`${w.fromCompId}:${w.fromTerminal}`, `${w.toCompId}:${w.toTerminal}`);
      });

      components.forEach(comp => {
        const def = COMPONENT_CATALOG[comp.type];
        if (def && def.getInternalConnections) {
             const internals = def.getInternalConnections(comp.state);
             internals.forEach(([t1, t2]) => {
                addEdge(`${comp.id}:${t1}`, `${comp.id}:${t2}`);
             });
        }
        // Handle Plug Connections
        if (comp.type === 'FAN_PLUG' && comp.pluggedSocketId) {
             const socket = components.find(c => c.id === comp.pluggedSocketId);
             if (socket) {
                 let isActive = false;
                 let lTerm = 'L'; let nTerm = 'N';
                 if (socket.type === 'SWITCH_COOKER') {
                     isActive = socket.state.isSocketOn; lTerm = 'L_IN'; nTerm = 'N_IN';
                 } else {
                     isActive = socket.state.isOn;
                 }
                 if (isActive) {
                     addEdge(`${socket.id}:${lTerm}`, `${comp.id}:L`);
                     addEdge(`${socket.id}:${nTerm}`, `${comp.id}:N`);
                     addEdge(`${socket.id}:E`, `${comp.id}:E`);
                 }
            }
        }
      });

      // BFS
      const queue = [nodeA];
      const visited = new Set<string>();
      visited.add(nodeA);

      while(queue.length > 0) {
          const curr = queue.shift()!;
          if (curr === nodeB) return true;
          
          const neighbors = graph.get(curr) || [];
          for (const next of neighbors) {
              if (!visited.has(next)) {
                  visited.add(next);
                  queue.push(next);
              }
          }
      }
      return false;
  };

  // --- Multimeter Logic ---
  
  const toggleMultimeter = () => {
    setMultimeter(prev => ({
        ...prev,
        visible: !prev.visible,
        redProbeNode: null,
        blackProbeNode: null,
        clampedWireId: null,
        redProbePosition: undefined,
        blackProbePosition: undefined,
        clampPosition: undefined,
        clampRotation: undefined,
        // Reset position to center-ish if showing
        position: !prev.visible ? { x: window.innerWidth - 250, y: 100 } : prev.position
    }));
    // Close Megger to avoid clutter? No, keep both openable.
  };

  const getMultimeterReading = () => {
      if (!multimeter.visible) return '';

      if (multimeter.mode === 'VOLTAGE') {
          if (!multimeter.redProbeNode || !multimeter.blackProbeNode) return '--- V';
          
          const p1 = simResult.nodePotentials.get(multimeter.redProbeNode) || 'None';
          const p2 = simResult.nodePotentials.get(multimeter.blackProbeNode) || 'None';

          // Potential Logic
          // L1, L2, L3, L, N, E, None
          
          if (p1 === 'None' || p2 === 'None') return '0.00 V';
          if (p1 === p2) return '0.00 V'; // Same phase or both N or both E

          const isLive = (p: string) => p.startsWith('L'); // L, L1, L2, L3
          const isNeutralOrEarth = (p: string) => p === 'N' || p === 'E';

          // Phase to Phase (400V)
          if (isLive(p1) && isLive(p2)) return '400.0 V';
          
          // Phase to Neutral/Earth (230V)
          if ((isLive(p1) && isNeutralOrEarth(p2)) || (isNeutralOrEarth(p1) && isLive(p2))) return '230.0 V';

          return '0.00 V';

      } else {
          // CURRENT
          if (!multimeter.clampedWireId) return '--- A';
          
          // Check if current is flowing
          const isFlowing = simResult.flowingWires.has(multimeter.clampedWireId);
          if (!isFlowing) return '0.00 A';
          
          // Estimate current based on load type (Simplified)
          // Ideally trace the wire to the load, but we'll approximate based on what kind of circuit it might be
          // Or check connected component.
          const w = wires.find(w => w.id === multimeter.clampedWireId);
          if (!w) return '0.00 A';

          const targetComp = components.find(c => c.id === w.toCompId);
          const def = targetComp ? COMPONENT_CATALOG[targetComp.type] : null;
          
          if (def && def.category === 'load' && targetComp && simResult.energizedComponents.has(targetComp.id)) {
             // Precise(ish) calculation
             const watts = targetComp.properties?.watts || def.loadWatts || 0;
             const amps = watts / 230;
             return amps.toFixed(2) + ' A';
          }
          
          // Fallback if measuring distribution wire
          return '0.45 A'; // Generic flow
      }
  };

  // --- Megger Logic ---
  const toggleMegger = () => {
       setMegger(prev => ({
           ...prev,
           visible: !prev.visible,
           mode: 'OFF',
           isTestActive: false,
           redProbeNode: null,
           blackProbeNode: null,
           redProbePosition: undefined,
           blackProbePosition: undefined,
           position: !prev.visible ? { x: window.innerWidth - 300, y: 350 } : prev.position
       }));
  };

  const getMeggerReading = () => {
      if (!megger.visible) return '';
      if (megger.mode === 'OFF') return '';
      
      const p1 = megger.redProbeNode ? (simResult.nodePotentials.get(megger.redProbeNode) || 'None') : 'None';
      const p2 = megger.blackProbeNode ? (simResult.nodePotentials.get(megger.blackProbeNode) || 'None') : 'None';
      
      const hasVoltage = (p1 !== 'None' && p1 !== p2) || (p2 !== 'None' && p1 !== p2);
      // Rough voltage check
      const voltagePresent = hasVoltage && (p1.startsWith('L') || p2.startsWith('L'));

      if (megger.mode === 'VOLTAGE') {
           if (voltagePresent) return '230 V';
           return '0 V';
      }

      // For Resistance tests, first check safety
      if (voltagePresent) {
           return 'VOLT!';
      }

      // Check probes connection
      if (!megger.redProbeNode || !megger.blackProbeNode) {
           if (megger.mode === 'CONTINUITY') return '> 99 Ω';
           if (megger.mode === 'IR_250') return '> 200 MΩ';
           if (megger.mode === 'IR_500') return '> 500 MΩ';
           if (megger.mode === 'IR_1000') return '> 999 MΩ';
           return '> 999 MΩ';
      }

      // Connectivity
      const isConnected = checkConnectivity(megger.redProbeNode, megger.blackProbeNode);

      if (megger.mode === 'CONTINUITY') {
          if (isConnected) return '0.05 Ω';
          return '> 99 Ω';
      }

      // IR Tests
      if (megger.mode.startsWith('IR')) {
          if (!megger.isTestActive) return '---';
          if (isConnected) return '0.00 MΩ'; // Short / Leakage
          
          if (megger.mode === 'IR_250') return '> 200 MΩ';
          if (megger.mode === 'IR_500') return '> 500 MΩ';
          if (megger.mode === 'IR_1000') return '> 999 MΩ';
          return '> 500 MΩ';
      }

      return '---';
  };

  // --- Actions ---

  const changeWireColor = (color: WireColor) => {
      setCurrentWireColor(color);
      // If a wire is selected, update its color
      if (selectedWireId) {
          setWires(prev => prev.map(w => w.id === selectedWireId ? { ...w, color } : w));
      }
  };

  const toggleSleeving = (color: WireColor) => {
    if (selectedWireId) {
      setWires(prev => prev.map(w => {
        if (w.id === selectedWireId) {
          // Toggle off if same color, otherwise set new color
          return { ...w, sleeving: w.sleeving === color ? undefined : color };
        }
        return w;
      }));
    }
  };

  const updateComponent = useCallback((id: string, updates: Partial<ComponentInstance> | ((prev: ComponentInstance) => Partial<ComponentInstance>)) => {
    setComponents(prev => prev.map(c => {
      if (c.id !== id) return c;
      const newValues = typeof updates === 'function' ? updates(c) : updates;
      
      // Deep merge for properties to avoid overwriting entire object if only one prop changes
      if (newValues.properties && c.properties) {
          return { ...c, ...newValues, properties: { ...c.properties, ...newValues.properties } };
      }
      // Deep merge for state
      if (newValues.state && c.state) {
          return { ...c, ...newValues, state: { ...c.state, ...newValues.state } };
      }

      return { ...c, ...newValues };
    }));
  }, []);

  const updateWire = useCallback((id: string, updates: Partial<Wire>) => {
    setWires(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  }, []);

  const addComponent = (type: string) => {
    const def = COMPONENT_CATALOG[type];
    if (!def) {
      console.error(`Component definition missing for: ${type}`);
      return;
    }
    // Place in center of current view
    const container = containerRef.current;
    let centerX = 400; 
    let centerY = 300;
    
    if (container) {
        const rect = container.getBoundingClientRect();
        const worldCenter = screenToWorld(rect.left + rect.width/2, rect.top + rect.height/2);
        centerX = worldCenter.x;
        centerY = worldCenter.y;
    }

    let pos = { 
        x: Math.round(centerX / SNAP_GRID) * SNAP_GRID, 
        y: Math.round(centerY / SNAP_GRID) * SNAP_GRID 
    };

    // Find non-overlapping position
    let angle = 0;
    let radius = 0;
    let attempts = 0;
    
    while(attempts < 100) {
       const tempComp = { 
           id: 'temp', type, position: pos, rotation: 0, state: {} 
       } as ComponentInstance;
       
       const r1 = getVisualRect(tempComp);
       const collision = components.some(other => isOverlapping(r1, getVisualRect(other)));
       
       if (!collision) break;

       // Spiral out
       radius += 20; 
       angle += Math.PI / 4; 
       pos.x = Math.round((centerX + Math.cos(angle) * radius) / SNAP_GRID) * SNAP_GRID;
       pos.y = Math.round((centerY + Math.sin(angle) * radius) / SNAP_GRID) * SNAP_GRID;
       attempts++;
    }

    const newComp: ComponentInstance = {
      id: generateId(),
      type,
      position: pos,
      rotation: 0,
      state: def.initialState ? { ...def.initialState } : {},
      // For Fan Plug, initialize plug position relative to body
      plugPosition: type === 'FAN_PLUG' ? { x: pos.x + 100, y: pos.y + 40 } : undefined
    };
    setComponents([...components, newComp]);
    setSelectedCompId(newComp.id); // Auto select new component
  };

  const addConsumerUnit = () => {
    const container = containerRef.current;
    let centerX = 400; 
    let centerY = 300;
    
    if (container) {
        const rect = container.getBoundingClientRect();
        const worldCenter = screenToWorld(rect.left + rect.width/2, rect.top + rect.height/2);
        centerX = worldCenter.x;
        centerY = worldCenter.y;
    }

    // Round to grid
    centerX = Math.round(centerX / SNAP_GRID) * SNAP_GRID;
    centerY = Math.round(centerY / SNAP_GRID) * SNAP_GRID;
    
    const neutralBarId = generateId();
    const earthBarId = generateId();
    const supplyId = generateId();
    const mcbId = generateId();
    const rcdId = generateId();

    const newComps: ComponentInstance[] = [
        // 1. Neutral Bar (Top Left)
        {
            id: neutralBarId,
            type: 'BAR_NEUTRAL',
            position: { x: centerX - 160, y: centerY - 140 },
            rotation: 0,
            state: {}
        },
        // 2. Earth Bar (Top Right)
        {
            id: earthBarId,
            type: 'BAR_EARTH',
            position: { x: centerX + 20, y: centerY - 140 },
            rotation: 0,
            state: {}
        },
        // 3. Supply (Middle)
        {
            id: supplyId,
            type: 'SOURCE_AC',
            position: { x: centerX - 50, y: centerY - 20 },
            rotation: 0,
            state: { isOn: false }
        },
        // 4. MCB (Bottom Left)
        {
            id: mcbId,
            type: 'MCB',
            position: { x: centerX - 80, y: centerY + 100 },
            rotation: 0,
            state: { isOn: true, isTripped: false }
        },
        // 5. RCD (Bottom Right)
        {
            id: rcdId,
            type: 'RCD',
            position: { x: centerX + 20, y: centerY + 100 },
            rotation: 0,
            state: { isOn: true, isTripped: false }
        }
    ];

    const newWires: Wire[] = [
      // Supply L -> RCD L In (Brown)
      {
        id: generateId(),
        fromCompId: supplyId, fromTerminal: 'L',
        toCompId: rcdId, toTerminal: 'L_IN',
        color: 'brown',
        orientation: 'vertical',
        handlePos: centerX - 40 // Route around left
      },
      // Supply N -> RCD N In (Blue)
      {
        id: generateId(),
        fromCompId: supplyId, fromTerminal: 'N',
        toCompId: rcdId, toTerminal: 'N_IN',
        color: 'blue',
        orientation: 'vertical',
        handlePos: centerX + 110 // Route around right
      },
      // Supply E -> Earth Bar T1 (Green)
      {
        id: generateId(),
        fromCompId: supplyId, fromTerminal: 'E',
        toCompId: earthBarId, toTerminal: 'T1',
        color: 'green',
        orientation: 'vertical',
        handlePos: centerX + 35 
      },
      // RCD L Out -> MCB OUT (Brown) - Connected at Bottom
      {
        id: generateId(),
        fromCompId: rcdId, fromTerminal: 'L_OUT',
        toCompId: mcbId, toTerminal: 'OUT',
        color: 'brown',
        orientation: 'horizontal',
        handlePos: centerY + 240 // Loop below components
      },
      // RCD N Out -> Neutral Bar T1 (Blue)
      {
        id: generateId(),
        fromCompId: rcdId, fromTerminal: 'N_OUT',
        toCompId: neutralBarId, toTerminal: 'T1',
        color: 'blue',
        orientation: 'vertical',
        handlePos: centerX - 180 // Loop around far left
      }
    ];
    
    setComponents(prev => [...prev, ...newComps]);
    setWires(prev => [...prev, ...newWires]);
  };

  const deleteComponent = useCallback((id: string) => {
    setComponents(prev => prev.filter(c => c.id !== id));
    setWires(prev => prev.filter(w => w.fromCompId !== id && w.toCompId !== id));
    setSelectedCompId(null);
  }, []);

  const duplicateComponent = useCallback((id: string) => {
     const original = components.find(c => c.id === id);
     if (!original) return;

     let newPos = {
         x: original.position.x + 20,
         y: original.position.y + 20
     };
     
     // Find non-overlapping
     let angle = 0;
     let radius = 0;
     let attempts = 0;
     
     while(attempts < 100) {
        const tempComp = { 
            id: 'temp', type: original.type, position: newPos, rotation: original.rotation, state: {} 
        } as ComponentInstance;
        
        const r1 = getVisualRect(tempComp);
        const collision = components.some(other => isOverlapping(r1, getVisualRect(other)));
        
        if (!collision) break;

        radius += 20; 
        angle += Math.PI / 4; 
        newPos.x = Math.round((original.position.x + Math.cos(angle) * radius) / SNAP_GRID) * SNAP_GRID;
        newPos.y = Math.round((original.position.y + Math.sin(angle) * radius) / SNAP_GRID) * SNAP_GRID;
        attempts++;
     }

     const newComp: ComponentInstance = {
         ...original,
         id: generateId(),
         position: newPos,
         state: { ...original.state }, // Clone state
         plugPosition: original.plugPosition ? {
             x: (original.plugPosition.x - original.position.x) + newPos.x,
             y: (original.plugPosition.y - original.position.y) + newPos.y
         } : undefined,
         pluggedSocketId: undefined // Don't duplicate connection
     };
     setComponents(prev => [...prev, newComp]);
     setSelectedCompId(newComp.id);
  }, [components]);

  const rotateComponent = useCallback((id: string) => {
    setComponents(prev => {
        const c = prev.find(comp => comp.id === id);
        if (!c) return prev;
        if (c.type === 'FAN_PLUG') return prev; 
        
        const newRotation = (c.rotation + 90) % 360;
        const temp = { ...c, rotation: newRotation };
        
        // Check collision
        const r1 = getVisualRect(temp);
        const collision = prev.some(other => other.id !== id && isOverlapping(r1, getVisualRect(other)));
        
        if (collision) return prev; // Block rotation

        return prev.map(comp => comp.id === id ? { ...comp, rotation: newRotation } : comp);
    });
  }, []);

  const deleteWire = useCallback((id: string) => {
    setWires(prev => prev.filter(w => w.id !== id));
    setSelectedWireId(null);
  }, []);

  const clearAll = () => {
    setComponents([]);
    setWires([]);
    setSelectedCompId(null);
    setSelectedWireId(null);
    setSimResult({ 
        energizedComponents: new Set(), 
        trippedBreakers: new Set(), 
        errors: [], 
        flowingWires: new Map(),
        nodePotentials: new Map()
    });
    // Also reset view
    setViewState({ x: 0, y: 0, scale: 1 });
  };

  const toggleComponentState = (id: string, subKey?: string) => {
    setComponents(prev => prev.map(c => {
      if (c.id !== id) return c;
      
      const newState = { ...c.state };
      
      // Logic for different components
      if (c.type === 'SOURCE_AC' || c.type === 'SOURCE_3PH') {
        newState.isOn = !newState.isOn;
      } else if (c.type === 'MCB' || c.type === 'SWITCH_FUSED') {
        if (newState.isTripped) {
            newState.isTripped = false; // Reset
            newState.isOn = false;
        } else {
            newState.isOn = !newState.isOn;
        }
      } else if (c.type === 'RCD') {
        if (subKey === 'test') {
             newState.isTripped = true;
             newState.isOn = false;
        } else {
             if (newState.isTripped) {
                 newState.isTripped = false;
                 newState.isOn = false;
             } else {
                 newState.isOn = !newState.isOn;
             }
        }
      } else if (c.type === 'SWITCH_1G') {
        newState.isOn = !newState.isOn;
      } else if (c.type === 'SWITCH_COOKER') {
        if (subKey === 'socket') {
             newState.isSocketOn = !newState.isSocketOn;
        } else {
             newState.isOn = !newState.isOn;
        }
      } else if (c.type === 'SWITCH_2W' || c.type === 'SWITCH_INT') {
        newState.position = newState.position === 1 ? 2 : 1;
      } else if (c.type === 'SWITCH_2G_2W') {
        // Toggle individual switches based on subKey
        if (subKey === 'sw2') {
             newState.sw2 = newState.sw2 === 1 ? 2 : 1;
        } else {
             // Default to sw1
             newState.sw1 = newState.sw1 === 1 ? 2 : 1;
        }
      } else if (c.type === 'SWITCH_ROTARY') {
        newState.isOn = !newState.isOn;
      } else if (c.type === 'SOCKET_SINGLE' || c.type === 'SOCKET_DOUBLE') {
        newState.isOn = !newState.isOn;
      }
      return { ...c, state: newState };
    }));
  };

  // --- Keyboard Handling ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Deletion
      if (e.key === 'Delete' || e.key === 'Backspace') {
        // Only delete if NOT typing in an input (Properties Panel)
        if (document.activeElement?.tagName !== 'INPUT') {
            if (selectedCompId) deleteComponent(selectedCompId);
            if (selectedWireId) deleteWire(selectedWireId);
        }
      }
      
      // Rotation
      if (e.key.toLowerCase() === 'r' && selectedCompId && document.activeElement?.tagName !== 'INPUT') {
          rotateComponent(selectedCompId);
      }

      // Duplication (Ctrl+D)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
          e.preventDefault();
          if (selectedCompId) duplicateComponent(selectedCompId);
      }

      // Wire Colors
      if (document.activeElement?.tagName !== 'INPUT') {
          if (e.key === '1') changeWireColor('brown');
          if (e.key === '2') changeWireColor('blue');
          if (e.key === '3') changeWireColor('green');
          if (e.key === '4') changeWireColor('black');
          if (e.key === '5') changeWireColor('grey');
      }

      // Cancel
      if (e.key === 'Escape') {
          setDrawingWire(null);
          setSelectedCompId(null);
          setSelectedWireId(null);
          setDraggingProbe(null);
          setPotentialSnapTerminal(null);
          setPotentialSnapWire(null);
          setPotentialSnapClamp(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCompId, selectedWireId, deleteComponent, deleteWire, rotateComponent, duplicateComponent, currentWireColor]); 

  // --- Rendering Helpers ---

  const getTerminalPos = useCallback((compId: string, termId: string): Position | null => {
    const comp = components.find(c => c.id === compId);
    if (!comp) return null;
    const def = COMPONENT_CATALOG[comp.type];
    if (!def) return null;
    const term = def.terminals.find(t => t.id === termId);
    if (!term) return null;
    
    // Rotate Logic
    const cx = def.width / 2;
    const cy = def.height / 2;
    const dx = term.x - cx;
    const dy = term.y - cy;
    
    let rdx = dx;
    let rdy = dy;
    
    const r = comp.rotation || 0;
    // Clockwise Rotation
    if (r === 90) { rdx = -dy; rdy = dx; }
    else if (r === 180) { rdx = -dx; rdy = -dy; }
    else if (r === 270) { rdx = dy; rdy = -dx; }

    return {
      x: comp.position.x + cx + rdx,
      y: comp.position.y + cy + rdy
    };
  }, [components]);

  // Calculate all terminal positions for collision detection and Overlay rendering
  const allTerminals = useMemo(() => {
    const terms: { x: number; y: number; id: string; compId: string; termId: string; label: string; type: string }[] = [];
    components.forEach((c) => {
      // Skip invisible terminals
      if (c.type === 'FAN_PLUG') return;

      const def = COMPONENT_CATALOG[c.type];
      if (!def) return;
      def.terminals.forEach((t) => {
        const pos = getTerminalPos(c.id, t.id);
        if (pos) terms.push({ ...pos, id: `${c.id}:${t.id}`, compId: c.id, termId: t.id, label: t.label, type: t.type });
      });
    });
    return terms;
  }, [components, getTerminalPos]);

  // --- Wire Geometry Calculation (With Fanning) ---
  const terminalsMap = useMemo(() => {
    const map = new Map<string, string[]>(); // TermID -> WireID[]
    wires.forEach(w => {
        const from = `${w.fromCompId}:${w.fromTerminal}`;
        const to = `${w.toCompId}:${w.toTerminal}`;
        if (!map.has(from)) map.set(from, []);
        if (!map.has(to)) map.set(to, []);
        map.get(from)!.push(w.id);
        map.get(to)!.push(w.id);
    });
    map.forEach(list => list.sort());
    return map;
  }, [wires]);

  const getTerminalOffset = useCallback((wireId: string, termId: string) => {
    const list = terminalsMap.get(termId);
    if (!list || list.length <= 1) return 0;
    const index = list.indexOf(wireId);
    if (index === -1) return 0;
    const count = list.length;
    const spacing = 6; 
    return (index - (count - 1) / 2) * spacing;
  }, [terminalsMap]);

  const wireGeometries = useMemo((): WireGeometry[] => {
    return wires.map(wire => {
        const start = getTerminalPos(wire.fromCompId, wire.fromTerminal);
        const end = getTerminalPos(wire.toCompId, wire.toTerminal);
        if (!start || !end) return null;

        const startOffset = getTerminalOffset(wire.id, `${wire.fromCompId}:${wire.fromTerminal}`);
        const endOffset = getTerminalOffset(wire.id, `${wire.toCompId}:${wire.toTerminal}`);

        const points: Position[] = [];
        const segments = { h: [] as any[], v: [] as any[] };

        const startComp = components.find(c => c.id === wire.fromCompId);
        const endComp = components.find(c => c.id === wire.toCompId);
        const startDef = startComp ? COMPONENT_CATALOG[startComp.type] : null;
        const endDef = endComp ? COMPONENT_CATALOG[endComp.type] : null;
        
        // Simple stub direction based on absolute position relative to center of component space
        const startCenterY = (startComp?.position.y || 0) + (startDef?.height || 100) / 2;
        const endCenterY = (endComp?.position.y || 0) + (endDef?.height || 100) / 2;
        const startCenterX = (startComp?.position.x || 0) + (startDef?.width || 100) / 2;
        const endCenterX = (endComp?.position.x || 0) + (endDef?.width || 100) / 2;
        
        // Stub directions
        const startStubDirY = start.y < startCenterY ? -1 : 1;
        const endStubDirY = end.y < endCenterY ? -1 : 1;
        const startStubDirX = start.x < startCenterX ? -1 : 1;
        const endStubDirX = end.x < endCenterX ? -1 : 1;

        let trunkStart: Position;
        let trunkEnd: Position;
        let startStubDir: number;
        let endStubDir: number;

        const startLen = wire.startStubLength ?? STUB_LENGTH;
        const endLen = wire.endStubLength ?? STUB_LENGTH;

        if (wire.orientation === 'vertical') {
            startStubDir = startStubDirY;
            endStubDir = endStubDirY;

            const p0 = start;
            const p1 = { x: start.x + startOffset, y: start.y + (startStubDirY * startLen) };
            const p2 = { x: wire.handlePos, y: p1.y };
            const p3 = { x: wire.handlePos, y: end.y + (endStubDirY * endLen) };
            const p4 = { x: end.x + endOffset, y: p3.y };
            const p5 = end;

            points.push(p0, p1, p2, p3, p4, p5);

            trunkStart = p2;
            trunkEnd = p3;

            segments.h.push({ y: p1.y, minX: Math.min(p1.x, p2.x), maxX: Math.max(p1.x, p2.x) }); 
            segments.h.push({ y: p3.y, minX: Math.min(p3.x, p4.x), maxX: Math.max(p3.x, p4.x) }); 
            segments.v.push({ x: p2.x, minY: Math.min(p2.y, p3.y), maxY: Math.max(p2.y, p3.y) }); 

        } else {
            // Horizontal
            startStubDir = startStubDirX;
            endStubDir = endStubDirX;

            const p0 = start;
            const p1 = { x: start.x + (startStubDirX * startLen), y: start.y + startOffset };
            const p2 = { x: p1.x, y: wire.handlePos }; 
            const p3 = { x: end.x + (endStubDirX * endLen), y: wire.handlePos }; 
            const p4 = { x: p3.x, y: end.y + endOffset };
            const p5 = end;

            points.push(p0, p1, p2, p3, p4, p5);

            trunkStart = p2;
            trunkEnd = p3;

            segments.h.push({ y: wire.handlePos, minX: Math.min(p2.x, p3.x), maxX: Math.max(p2.x, p3.x) }); 
            segments.v.push({ x: p2.x, minY: Math.min(p1.y, p2.y), maxY: Math.max(p1.y, p2.y) }); 
            segments.v.push({ x: p3.x, minY: Math.min(p4.y, p3.y), maxY: Math.max(p4.y, p3.y) }); 
        }

        return { wire, points, segments, trunkStart, trunkEnd, startStubDir, endStubDir };

    }).filter(Boolean) as WireGeometry[];
  }, [wires, getTerminalPos, components, getTerminalOffset]);


  // --- Interaction Handlers ---

  const handleWheel = (e: React.WheelEvent) => {
      const zoomSensitivity = 0.001;
      const minScale = 0.2;
      const maxScale = 5;
      let newScale = viewState.scale - e.deltaY * zoomSensitivity * viewState.scale;
      newScale = Math.min(Math.max(newScale, minScale), maxScale);
      
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const newX = mouseX - (mouseX - viewState.x) * (newScale / viewState.scale);
      const newY = mouseY - (mouseY - viewState.y) * (newScale / viewState.scale);

      setViewState({
          scale: newScale,
          x: newX,
          y: newY
      });
  };

  const commitProbeDrop = (e: React.MouseEvent | MouseEvent) => {
      const worldPos = screenToWorld(e.clientX, e.clientY);
      
      if (draggingProbe === 'red' || draggingProbe === 'black') {
          if (potentialSnapTerminal) {
              setMultimeter(prev => ({
                  ...prev,
                  [draggingProbe === 'red' ? 'redProbeNode' : 'blackProbeNode']: potentialSnapTerminal,
                  [draggingProbe === 'red' ? 'redProbePosition' : 'blackProbePosition']: undefined
              }));
          } else {
              setMultimeter(prev => ({
                  ...prev,
                  [draggingProbe === 'red' ? 'redProbeNode' : 'blackProbeNode']: null,
                  [draggingProbe === 'red' ? 'redProbePosition' : 'blackProbePosition']: worldPos
              }));
          }
      } else if (draggingProbe === 'megger-red' || draggingProbe === 'megger-black') {
           const probeType = draggingProbe === 'megger-red' ? 'red' : 'black';
           if (potentialSnapTerminal) {
              setMegger(prev => ({
                  ...prev,
                  [probeType === 'red' ? 'redProbeNode' : 'blackProbeNode']: potentialSnapTerminal,
                  [probeType === 'red' ? 'redProbePosition' : 'blackProbePosition']: undefined
              }));
          } else {
              setMegger(prev => ({
                  ...prev,
                  [probeType === 'red' ? 'redProbeNode' : 'blackProbeNode']: null,
                  [probeType === 'red' ? 'redProbePosition' : 'blackProbePosition']: worldPos
              }));
          }
      } else if (draggingProbe === 'clamp') {
           if (potentialSnapWire && potentialSnapClamp) {
               setMultimeter(prev => ({ 
                   ...prev, 
                   clampedWireId: potentialSnapWire,
                   clampPosition: potentialSnapClamp.position,
                   clampRotation: potentialSnapClamp.rotation
               }));
           } else {
               setMultimeter(prev => ({ ...prev, clampedWireId: null, clampPosition: undefined, clampRotation: undefined }));
           }
      }
      
      setDraggingProbe(null);
      setPotentialSnapTerminal(null);
      setPotentialSnapWire(null);
      setPotentialSnapClamp(null);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
      // Handle Placing Carried Probe (Click-Move-Click flow)
      if (draggingProbe) {
          commitProbeDrop(e);
          return;
      }

      if (e.button === 0) { // Left click
        setIsPanning(true);
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        setSelectedCompId(null);
        setSelectedWireId(null);
      }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    // 1. Panning
    if (isPanning) {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        setViewState(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        return;
    }

    const worldPos = screenToWorld(e.clientX, e.clientY);
    
    // 2. Dragging Probe (Multimeter or Megger) - With Magnetic Snap
    if (draggingProbe) {
        setProbeDragPos({ x: e.clientX, y: e.clientY }); 

        if (draggingProbe === 'red' || draggingProbe === 'black' || draggingProbe === 'megger-red' || draggingProbe === 'megger-black') {
            // Find closest terminal for snap
            let closestTerm: string | null = null;
            let minD = 40; // Snap Radius

            allTerminals.forEach(t => {
                 const dist = Math.sqrt(Math.pow(worldPos.x - t.x, 2) + Math.pow(worldPos.y - t.y, 2));
                 if (dist < minD) {
                     minD = dist;
                     closestTerm = t.id;
                 }
            });
            setPotentialSnapTerminal(closestTerm);
            setPotentialSnapWire(null); // Clear wire snap
        } else if (draggingProbe === 'clamp') {
            // Find closest wire segment
            let bestWireId: string | null = null;
            let bestPos: Position | null = null;
            let bestRot = 0;
            let minD = 40; // Snap threshold

            wireGeometries.forEach(geo => {
                const points = geo.points;
                for (let i = 0; i < points.length - 1; i++) {
                    const p1 = points[i];
                    const p2 = points[i+1];
                    const closest = getClosestPointOnSegment(worldPos, p1, p2);
                    const dist = Math.sqrt(Math.pow(worldPos.x - closest.x, 2) + Math.pow(worldPos.y - closest.y, 2));
                    
                    if (dist < minD) {
                        minD = dist;
                        bestWireId = geo.wire.id;
                        bestPos = closest;
                        // Determine rotation based on segment
                        if (Math.abs(p1.x - p2.x) < 0.1) bestRot = 90; // Vertical segment
                        else bestRot = 0; // Horizontal
                    }
                }
            });
            
            setPotentialSnapWire(bestWireId);
            if (bestWireId && bestPos) {
                setPotentialSnapClamp({ position: bestPos, rotation: bestRot });
            } else {
                setPotentialSnapClamp(null);
            }
        }

        return; // Consume event
    }

    // 3. Dragging Component (With Collision Detection)
    if (isDraggingComp) {
      setComponents(prev => prev.map(c => {
        if (c.id !== isDraggingComp) return c;
        
        const rawX = worldPos.x - dragOffset.x;
        const rawY = worldPos.y - dragOffset.y;
        const targetX = Math.round(rawX / SNAP_GRID) * SNAP_GRID;
        const targetY = Math.round(rawY / SNAP_GRID) * SNAP_GRID;

        // Collision Check Logic
        const check = (x: number, y: number) => {
            const temp = { ...c, position: { x, y } };
            const r1 = getVisualRect(temp);
            return prev.some(other => {
                if (other.id === c.id) return false;
                return isOverlapping(r1, getVisualRect(other));
            });
        };

        let finalX = c.position.x;
        let finalY = c.position.y;

        // Try moving to target
        if (!check(targetX, targetY)) {
            finalX = targetX;
            finalY = targetY;
        } else if (!check(targetX, c.position.y)) {
            // Try horizontal slide
            finalX = targetX;
        } else if (!check(c.position.x, targetY)) {
            // Try vertical slide
            finalY = targetY;
        }
        // else blocked

        // If this component has a plug, we need to move the plug along with it unless plugged in
        let newPlugPos = c.plugPosition;
        if (c.plugPosition && !c.pluggedSocketId) {
            const dx = finalX - c.position.x;
            const dy = finalY - c.position.y;
            newPlugPos = { x: c.plugPosition.x + dx, y: c.plugPosition.y + dy };
        }

        return {
          ...c,
          position: { x: finalX, y: finalY },
          plugPosition: newPlugPos
        };
      }));
    }

    // 4. Dragging Plug
    if (draggingPlug) {
        setComponents(prev => prev.map(c => {
            if (c.id !== draggingPlug) return c;
            // Immediate update of plug position to follow mouse
            // If plugged, unplug it on drag start (implicit)
            return {
                ...c,
                plugPosition: { x: worldPos.x, y: worldPos.y },
                pluggedSocketId: undefined // Unplug
            };
        }));
    }

    // 5. Dragging Wire Segments
    if (draggingWireSegment) {
        const { id, segment } = draggingWireSegment;
        
        // Find geometry to get stub directions
        const geo = wireGeometries.find(g => g.wire.id === id);
        
        if (geo) {
            setWires(prev => prev.map(w => {
                if (w.id === id) {
                    if (segment === 'trunk') {
                         if (w.orientation === 'vertical') {
                            return { ...w, handlePos: Math.round(worldPos.x / SNAP_GRID) * SNAP_GRID };
                        } else {
                            return { ...w, handlePos: Math.round(worldPos.y / SNAP_GRID) * SNAP_GRID };
                        }
                    } else if (segment === 'start') {
                        // Calculate new length based on mouse pos
                        const termPos = geo.points[0]; // Start terminal is p0
                        let newLen = STUB_LENGTH;
                        
                        if (w.orientation === 'vertical') {
                            const delta = worldPos.y - termPos.y;
                            newLen = delta / geo.startStubDir;
                        } else {
                            const delta = worldPos.x - termPos.x;
                            newLen = delta / geo.startStubDir;
                        }
                        
                        // Snap to grid-ish
                        newLen = Math.round(newLen / SNAP_GRID) * SNAP_GRID;
                        if (Math.abs(newLen) < SNAP_GRID) newLen = SNAP_GRID * (newLen < 0 ? -1 : 1);
                        
                        return { ...w, startStubLength: newLen };

                    } else if (segment === 'end') {
                         const termPos = geo.points[5]; // End terminal is p5
                         let newLen = STUB_LENGTH;
                         
                         if (w.orientation === 'vertical') {
                            const delta = worldPos.y - termPos.y;
                            newLen = delta / geo.endStubDir;
                         } else {
                            const delta = worldPos.x - termPos.x;
                            newLen = delta / geo.endStubDir;
                         }

                         newLen = Math.round(newLen / SNAP_GRID) * SNAP_GRID;
                         if (Math.abs(newLen) < SNAP_GRID) newLen = SNAP_GRID * (newLen < 0 ? -1 : 1);

                         return { ...w, endStubLength: newLen };
                    }
                }
                return w;
            }));
        }
    }

    // 6. Drawing Wire Preview
    if (drawingWire) {
      setDrawingWire(prev => prev ? { ...prev, currentPos: { x: worldPos.x, y: worldPos.y } } : null);
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    // Handle Probe Drop
    if (draggingProbe) {
        const duration = Date.now() - dragStartTime.current;
        // If short click (< 200ms), assume "Click to Carry" mode. Don't drop yet.
        if (duration < 200) {
            return;
        }
        // Else it was a drag (held button). Drop.
        commitProbeDrop(e);
        return;
    }

    // Handle Plug Drop (Snapping)
    if (draggingPlug) {
        setComponents(prev => prev.map(c => {
            if (c.id !== draggingPlug || !c.plugPosition) return c;
            
            // Check collision with Sockets
            let snapped = false;
            let pluggedId: string | undefined = undefined;
            let newPos = c.plugPosition;

            for (const other of prev) {
                if (other.type === 'SOCKET_SINGLE' || other.type === 'SOCKET_DOUBLE' || other.type === 'SWITCH_COOKER') {
                    // Define Snap Points relative to socket
                    const def = COMPONENT_CATALOG[other.type];
                    if (!def) continue;

                    const snapPoints: Position[] = [];
                    
                    if (other.type === 'SOCKET_SINGLE') {
                        snapPoints.push({ x: other.position.x + def.width/2, y: other.position.y + def.height/2 });
                    } else if (other.type === 'SOCKET_DOUBLE') {
                         snapPoints.push({ x: other.position.x + 35, y: other.position.y + 40 }); // Left
                         snapPoints.push({ x: other.position.x + 105, y: other.position.y + 40 }); // Right
                    } else if (other.type === 'SWITCH_COOKER') {
                         // Snap to left side (Socket) center
                         snapPoints.push({ x: other.position.x + 35, y: other.position.y + 40 }); 
                    }

                    for (const pt of snapPoints) {
                        const dist = Math.sqrt(Math.pow(c.plugPosition.x - pt.x, 2) + Math.pow(c.plugPosition.y - pt.y, 2));
                        if (dist < 30) { // Snap radius
                            newPos = pt;
                            pluggedId = other.id;
                            snapped = true;
                            break;
                        }
                    }
                }
                if (snapped) break;
            }

            return {
                ...c,
                plugPosition: newPos,
                pluggedSocketId: pluggedId
            };
        }));
    }

    setIsPanning(false);
    setIsDraggingComp(null);
    setDraggingWireSegment(null);
    setDrawingWire(null); 
    setDraggingPlug(null);
  };

  const handleCompMouseDown = (e: React.MouseEvent, id: string) => {
    // If carrying probe, clicking a component body can drop it (floating)
    if (draggingProbe) {
        commitProbeDrop(e);
        return;
    }

    e.stopPropagation();
    setSelectedCompId(id);
    setSelectedWireId(null);
    const comp = components.find(c => c.id === id);
    if (!comp) return;
    const worldPos = screenToWorld(e.clientX, e.clientY);
    setDragOffset({
      x: worldPos.x - comp.position.x,
      y: worldPos.y - comp.position.y
    });
    setIsDraggingComp(id);
  };

  const handlePlugMouseDown = (e: React.MouseEvent, compId: string) => {
      e.preventDefault(); // Prevent text selection etc
      setDraggingPlug(compId);
      setSelectedCompId(compId);
  };

  const handleTerminalMouseDown = (e: React.MouseEvent, compId: string, termId: string) => {
    e.stopPropagation();
    e.preventDefault();

    // If carrying a probe, click terminal to Connect
    if (draggingProbe) {
        const termIdFull = `${compId}:${termId}`;
        if (draggingProbe === 'red' || draggingProbe === 'black') {
             setMultimeter(prev => ({
                ...prev,
                [draggingProbe === 'red' ? 'redProbeNode' : 'blackProbeNode']: termIdFull,
                [draggingProbe === 'red' ? 'redProbePosition' : 'blackProbePosition']: undefined
            }));
        } else if (draggingProbe === 'megger-red' || draggingProbe === 'megger-black') {
             const probeType = draggingProbe === 'megger-red' ? 'red' : 'black';
             setMegger(prev => ({
                 ...prev,
                 [probeType === 'red' ? 'redProbeNode' : 'blackProbeNode']: termIdFull,
                 [probeType === 'red' ? 'redProbePosition' : 'blackProbePosition']: undefined
             }));
        }
        setDraggingProbe(null);
        setPotentialSnapTerminal(null);
        return;
    }

    const worldPos = screenToWorld(e.clientX, e.clientY);
    setDrawingWire({
      fromCompId: compId,
      fromTerminal: termId,
      currentPos: worldPos
    });
  };

  const handleTerminalMouseUp = (e: React.MouseEvent, toCompId: string, toTermId: string) => {
    e.stopPropagation();
    if (!drawingWire) return;

    if (drawingWire.fromCompId === toCompId && drawingWire.fromTerminal === toTermId) {
      setDrawingWire(null);
      return;
    }

    const startComp = components.find(c => c.id === drawingWire.fromCompId);
    const endComp = components.find(c => c.id === toCompId);
    
    if (startComp && endComp) {
        const start = getTerminalPos(drawingWire.fromCompId, drawingWire.fromTerminal);
        const end = getTerminalPos(toCompId, toTermId);
        
        let orientation: 'vertical' | 'horizontal' = 'vertical';
        let initialHandlePos = 0;
        
        const dx = Math.abs((start?.x || 0) - (end?.x || 0));
        const dy = Math.abs((start?.y || 0) - (end?.y || 0));

        if (dx > dy) {
            orientation = 'horizontal';
            initialHandlePos = Math.round(((start?.y || 0) + (end?.y || 0)) / 2 / SNAP_GRID) * SNAP_GRID;
        } else {
            orientation = 'vertical';
            initialHandlePos = Math.round(((start?.x || 0) + (end?.x || 0)) / 2 / SNAP_GRID) * SNAP_GRID;
        }

        // --- Smart Placement: Avoid Overlap ---
        const findFreeLane = (basePos: number) => {
            const range = 100; // Increased range to find free lanes
            const newMin = orientation === 'vertical' ? Math.min(start?.y||0, end?.y||0) : Math.min(start?.x||0, end?.x||0);
            const newMax = orientation === 'vertical' ? Math.max(start?.y||0, end?.y||0) : Math.max(start?.x||0, end?.x||0);

            const offsets = [0];
            for(let i=10; i<=range; i+=10) { offsets.push(i); offsets.push(-i); }

            for (const offset of offsets) {
                const candidate = basePos + offset;
                const collision = wires.some(w => {
                    if (w.orientation !== orientation) return false;
                    if (Math.abs(w.handlePos - candidate) >= SNAP_GRID) return false; 
                    const interval = getWireInterval(w);
                    if (!interval) return false;
                    return Math.max(newMin, interval.min) < Math.min(newMax, interval.max);
                });
                if (!collision) return candidate;
            }
            return basePos; 
        };

        const finalHandlePos = findFreeLane(initialHandlePos);

        const newWire: Wire = {
          id: generateId(),
          fromCompId: drawingWire.fromCompId,
          fromTerminal: drawingWire.fromTerminal,
          toCompId: toCompId,
          toTerminal: toTermId,
          color: currentWireColor,
          orientation,
          handlePos: finalHandlePos
        };

        setWires([...wires, newWire]);
        setSelectedWireId(newWire.id); 
        setSelectedCompId(null);
    }
    setDrawingWire(null);
  };

  const getWireInterval = (wire: Wire) => {
     const start = getTerminalPos(wire.fromCompId, wire.fromTerminal);
     const end = getTerminalPos(wire.toCompId, wire.toTerminal);
     if (!start || !end) return null;
     const min = wire.orientation === 'vertical' ? Math.min(start.y, end.y) : Math.min(start.x, end.y);
     const max = wire.orientation === 'vertical' ? Math.max(start.y, end.y) : Math.max(start.x, end.y);
     return { min, max };
  };

  const handleWireSegmentMouseDown = (e: React.MouseEvent, wireId: string, segment: 'trunk' | 'start' | 'end') => {
      // If carrying clamp, drop it on wire
      if (draggingProbe === 'clamp') {
          commitProbeDrop(e);
          return;
      }
      e.stopPropagation();
      setSelectedWireId(wireId);
      setSelectedCompId(null);
      setDraggingWireSegment({ id: wireId, segment });
  }

  const handleWireHandleDoubleClick = (e: React.MouseEvent, wire: Wire, currentGeometry: any) => {
      e.stopPropagation();
      const start = currentGeometry.points[0];
      const end = currentGeometry.points[currentGeometry.points.length - 1];

      setWires(wires.map(w => {
          if (w.id === wire.id) {
              const newOrientation = w.orientation === 'vertical' ? 'horizontal' : 'vertical';
              const newHandlePos = newOrientation === 'vertical' 
                ? Math.round((start.x + end.x) / 2 / SNAP_GRID) * SNAP_GRID
                : Math.round((start.y + end.y) / 2 / SNAP_GRID) * SNAP_GRID;
              
              // Reset stubs when flipping orientation to prevent confusion
              return { 
                  ...w, 
                  orientation: newOrientation, 
                  handlePos: newHandlePos,
                  startStubLength: STUB_LENGTH,
                  endStubLength: STUB_LENGTH
              };
          }
          return w;
      }));
  }

  const getPathWithJumps = (geo: WireGeometry) => {
    const { points, wire } = geo;
    const path: string[] = [];
    
    // 1. Get Obstacles
    const verticalWireSegments: { x: number, minY: number, maxY: number }[] = [];
    wireGeometries.forEach(g => {
        if (g.wire.id === wire.id) return; 
        verticalWireSegments.push(...g.segments.v);
    });

    const myStartNode = `${wire.fromCompId}:${wire.fromTerminal}`;
    const myEndNode = `${wire.toCompId}:${wire.toTerminal}`;
    const terminalObstacles = allTerminals.filter(t => t.id !== myStartNode && t.id !== myEndNode);

    const drawLine = (pStart: Position, pEnd: Position) => {
        const isVertical = Math.abs(pStart.x - pEnd.x) < 0.1;
        const isHorizontal = Math.abs(pStart.y - pEnd.y) < 0.1;
        
        if (!isVertical && !isHorizontal) {
             path.push(`L ${pEnd.x} ${pEnd.y}`);
             return;
        }

        const startVal = isVertical ? pStart.y : pStart.x;
        const endVal = isVertical ? pEnd.y : pEnd.x;
        const fixedVal = isVertical ? pStart.x : pStart.y;

        const minVal = Math.min(startVal, endVal);
        const maxVal = Math.max(startVal, endVal);
        const direction = endVal > startVal ? 1 : -1;

        const jumps: number[] = [];
        const r = 8;
        const hitThreshold = 7;

        if (isHorizontal) {
            verticalWireSegments.forEach(v => {
                if (fixedVal > v.minY && fixedVal < v.maxY && v.x > minVal + r && v.x < maxVal - r) {
                    jumps.push(v.x);
                }
            });
            terminalObstacles.forEach(t => {
                 if (Math.abs(t.y - fixedVal) < hitThreshold && t.x > minVal + r && t.x < maxVal - r) {
                     jumps.push(t.x);
                 }
            });
        } else {
             terminalObstacles.forEach(t => {
                 if (Math.abs(t.x - fixedVal) < hitThreshold && t.y > minVal + r && t.y < maxVal - r) {
                     jumps.push(t.y);
                 }
            });
        }

        jumps.sort((a, b) => direction === 1 ? a - b : b - a);

        const uniqueJumps: number[] = [];
        jumps.forEach(j => {
            if (uniqueJumps.length === 0 || Math.abs(j - uniqueJumps[uniqueJumps.length - 1]) > 2) {
                uniqueJumps.push(j);
            }
        });

        let currentVal = startVal;

        uniqueJumps.forEach(jumpVal => {
             if ((direction === 1 && currentVal >= jumpVal - r) || (direction === -1 && currentVal <= jumpVal + r)) return;
             
             const approachVal = jumpVal - (r * direction);
             const afterVal = jumpVal + (r * direction);
             
             if (isVertical) path.push(`L ${fixedVal} ${approachVal}`);
             else path.push(`L ${approachVal} ${fixedVal}`);

             if (isHorizontal) {
                 path.push(`A ${r} ${r} 0 0 1 ${afterVal} ${fixedVal}`);
             } else {
                 path.push(`A ${r} ${r} 0 0 1 ${fixedVal} ${afterVal}`);
             }
             
             currentVal = afterVal;
        });
        
        if (isVertical) path.push(`L ${fixedVal} ${endVal}`);
        else path.push(`L ${endVal} ${fixedVal}`);
    };

    path.push(`M ${points[0].x} ${points[0].y}`);
    for (let i = 0; i < points.length - 1; i++) {
        drawLine(points[i], points[i+1]);
    }

    return path.join(' ');
  };

  // --- Simulation Loop ---
  useEffect(() => {
    const result = runSimulation(components, wires);
    
    if (result.trippedBreakers.size > 0) {
       let stateChanged = false;
       const newComponents = components.map(c => {
         if (result.trippedBreakers.has(c.id) && !c.state.isTripped) {
           stateChanged = true;
           return { ...c, state: { ...c.state, isTripped: true, isOn: false } };
         }
         return c;
       });
       if (stateChanged) {
         setComponents(newComponents);
       }
    }
    setSimResult(result);
  }, [components, wires]);

  // --- Multimeter Visual Helper ---
  // Calculates World Coordinates for probe visual elements
  const getMultimeterRenderData = () => {
    if (!multimeter.visible) return null;
    
    // Screen coords of the Meter's socket area
    const socketRedScreen = { x: multimeter.position.x + 48, y: multimeter.position.y + 175 }; 
    const socketBlackScreen = { x: multimeter.position.x + 96, y: multimeter.position.y + 175 };

    // Convert to World for SVG line start
    const socketRedWorld = screenToWorld(socketRedScreen.x, socketRedScreen.y);
    const socketBlackWorld = screenToWorld(socketBlackScreen.x, socketBlackScreen.y);

    let redPosWorld: Position | null = null;
    let blackPosWorld: Position | null = null;

    // Red Probe Position
    if (draggingProbe === 'red') {
        if (potentialSnapTerminal) {
             const [cId, tId] = potentialSnapTerminal.split(':');
             redPosWorld = getTerminalPos(cId, tId);
        } else {
             redPosWorld = screenToWorld(probeDragPos.x, probeDragPos.y);
        }
    } else if (multimeter.redProbeNode) {
        const [cId, tId] = multimeter.redProbeNode.split(':');
        redPosWorld = getTerminalPos(cId, tId);
    } else if (multimeter.redProbePosition) {
        redPosWorld = multimeter.redProbePosition;
    }

    // Black Probe Position
    if (draggingProbe === 'black') {
         if (potentialSnapTerminal) {
             const [cId, tId] = potentialSnapTerminal.split(':');
             blackPosWorld = getTerminalPos(cId, tId);
        } else {
             blackPosWorld = screenToWorld(probeDragPos.x, probeDragPos.y);
        }
    } else if (multimeter.blackProbeNode) {
        const [cId, tId] = multimeter.blackProbeNode.split(':');
        blackPosWorld = getTerminalPos(cId, tId);
    } else if (multimeter.blackProbePosition) {
        blackPosWorld = multimeter.blackProbePosition;
    }

    // Clamp Position
    let clampPosWorld: Position | null = null;
    let clampRotation = 0;
    
    if (draggingProbe === 'clamp') {
        if (potentialSnapWire && potentialSnapClamp) {
             // Snapped during drag
             clampPosWorld = potentialSnapClamp.position;
             clampRotation = potentialSnapClamp.rotation;
        } else {
             // Free drag
             clampPosWorld = screenToWorld(probeDragPos.x, probeDragPos.y);
             clampRotation = 0; // Default or could infer from movement
        }
    } else if (multimeter.clampedWireId) {
        if (multimeter.clampPosition) {
            // Use stored position
            clampPosWorld = multimeter.clampPosition;
            clampRotation = multimeter.clampRotation || 0;
        } else {
            // Fallback (e.g. if loaded from old state)
            const geo = wireGeometries.find(g => g.wire.id === multimeter.clampedWireId);
            if (geo) {
                clampPosWorld = {
                    x: (geo.trunkStart.x + geo.trunkEnd.x) / 2,
                    y: (geo.trunkStart.y + geo.trunkEnd.y) / 2
                };
                clampRotation = geo.wire.orientation === 'vertical' ? 90 : 0;
            }
        }
    }

    return { socketRedWorld, socketBlackWorld, redPosWorld, blackPosWorld, clampPosWorld, clampRotation };
  };

  const meterRender = getMultimeterRenderData();

  // --- Megger Visual Helper ---
  const getMeggerRenderData = () => {
    if (!megger.visible) return null;
    
    // Screen coords of the Megger's socket area (Approx based on width 56 = 224px)
    // Megger width 224px. Terminals near bottom.
    // Red: 50% left. Black: 80% left? Based on JSX in Megger.tsx
    // The Megger component is w-56 (224px).
    // Terminals are in a flex justify-between px-8. 
    // Left terminal (Red) is approx 40px from left.
    // Right terminal (Black) is approx 40px from right.
    const x = megger.position.x;
    const y = megger.position.y;
    // Megger Height roughly: 4(bumper)+40(header)+96(screen)+140(controls)+60(terminals) ~ 340px?
    // Let's approximate bottom terminals relative to top-left of component.
    const termY = y + 360; 
    const redTermX = x + 50; 
    const blackTermX = x + 174; 

    const socketRedWorld = screenToWorld(redTermX, termY);
    const socketBlackWorld = screenToWorld(blackTermX, termY);

    let redPosWorld: Position | null = null;
    let blackPosWorld: Position | null = null;

    // Red Probe
    if (draggingProbe === 'megger-red') {
         if (potentialSnapTerminal) {
             const [cId, tId] = potentialSnapTerminal.split(':');
             redPosWorld = getTerminalPos(cId, tId);
        } else {
             redPosWorld = screenToWorld(probeDragPos.x, probeDragPos.y);
        }
    } else if (megger.redProbeNode) {
        const [cId, tId] = megger.redProbeNode.split(':');
        redPosWorld = getTerminalPos(cId, tId);
    } else if (megger.redProbePosition) {
        redPosWorld = megger.redProbePosition;
    }

    // Black Probe
    if (draggingProbe === 'megger-black') {
         if (potentialSnapTerminal) {
             const [cId, tId] = potentialSnapTerminal.split(':');
             blackPosWorld = getTerminalPos(cId, tId);
        } else {
             blackPosWorld = screenToWorld(probeDragPos.x, probeDragPos.y);
        }
    } else if (megger.blackProbeNode) {
        const [cId, tId] = megger.blackProbeNode.split(':');
        blackPosWorld = getTerminalPos(cId, tId);
    } else if (megger.blackProbePosition) {
        blackPosWorld = megger.blackProbePosition;
    }

    return { socketRedWorld, socketBlackWorld, redPosWorld, blackPosWorld };
  };

  const meggerRender = getMeggerRenderData();


  // Helper for wire cursor
  const getWireCursor = (orientation: 'vertical' | 'horizontal') => {
      if (draggingProbe === 'clamp') return 'crosshair'; // Specific for clamp
      if (draggingProbe) return 'default'; 
      return orientation === 'vertical' ? 'ns-resize' : 'ew-resize';
  };

  return (
    <div className="flex flex-col h-full font-sans select-none">
       <style>{`
        @keyframes flowAnimation {
          from { stroke-dashoffset: 20; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes flowAnimationReverse {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: 20; }
        }
        @keyframes ping {
            75%, 100% {
                transform: scale(1.6);
                opacity: 0;
            }
        }
        .animate-ping-slow {
            animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>

      {/* Header / Toolbar */}
      <header className="bg-slate-800 text-white p-4 shadow-md flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2">
          <Zap className="text-yellow-400" />
          <div>
            <h1 className="text-xl font-bold leading-none">LV Circuit Simulator</h1>
            <p className="text-xs text-slate-400">By Wayne Fix LTD</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
            {/* Wire Color Controls */}
            <div className="flex items-center gap-4 bg-slate-700 p-2 rounded-lg">
                <span className="text-sm font-medium">Wire Colour:</span>
                <div className="flex gap-2">
                    <button 
                    className={`w-6 h-6 rounded-full border-2 transition-transform relative ${currentWireColor === 'brown' ? 'scale-125 border-white shadow-lg' : 'border-transparent opacity-80'} ${!selectedWireId ? '' : 'hover:scale-110 hover:opacity-100'}`}
                    style={{ backgroundColor: '#8B4513' }}
                    onClick={() => changeWireColor('brown')}
                    title="Line 1 (Brown) [Key: 1]"
                    />
                    <button 
                    className={`w-6 h-6 rounded-full border-2 transition-transform relative ${currentWireColor === 'black' ? 'scale-125 border-white shadow-lg' : 'border-transparent opacity-80'} ${!selectedWireId ? '' : 'hover:scale-110 hover:opacity-100'}`}
                    style={{ backgroundColor: '#111827' }}
                    onClick={() => changeWireColor('black')}
                    title="Line 2 (Black) [Key: 4]"
                    />
                    <button 
                    className={`w-6 h-6 rounded-full border-2 transition-transform relative ${currentWireColor === 'grey' ? 'scale-125 border-white shadow-lg' : 'border-transparent opacity-80'} ${!selectedWireId ? '' : 'hover:scale-110 hover:opacity-100'}`}
                    style={{ backgroundColor: '#9ca3af' }}
                    onClick={() => changeWireColor('grey')}
                    title="Line 3 (Grey) [Key: 5]"
                    />
                    <button 
                    className={`w-6 h-6 rounded-full border-2 transition-transform relative ${currentWireColor === 'blue' ? 'scale-125 border-white shadow-lg' : 'border-transparent opacity-80'} ${!selectedWireId ? '' : 'hover:scale-110 hover:opacity-100'}`}
                    style={{ backgroundColor: '#0056b3' }}
                    onClick={() => changeWireColor('blue')}
                    title="Neutral (Blue) [Key: 2]"
                    />
                    <button 
                    className={`w-6 h-6 rounded-full border-2 transition-transform relative ${currentWireColor === 'green' ? 'scale-125 border-white shadow-lg' : 'border-transparent opacity-80'} ${!selectedWireId ? '' : 'hover:scale-110 hover:opacity-100'}`}
                    style={{ backgroundColor: '#22c55e', backgroundImage: 'repeating-linear-gradient(45deg, #22c55e, #22c55e 5px, #eab308 5px, #eab308 10px)' }}
                    onClick={() => changeWireColor('green')}
                    title="Earth (Green/Yellow) [Key: 3]"
                    />
                </div>
            </div>

            {/* Sleeving Controls */}
            <div className="flex items-center gap-4 bg-slate-700 p-2 rounded-lg relative">
                <div className="flex items-center gap-2 border-r border-slate-500 pr-3 mr-1">
                     <Pipette size={14} className="text-slate-400" />
                     <span className="text-sm font-medium">Sleeving:</span>
                </div>
                {/* Removed grayscale to keep colors visible */}
                <div className="flex gap-2">
                    <button 
                        className={`w-6 h-6 rounded-full border-2 transition-transform relative ${selectedWireId && wires.find(w => w.id === selectedWireId)?.sleeving === 'brown' ? 'scale-125 border-white shadow-lg' : 'border-transparent opacity-80'} ${!selectedWireId ? 'cursor-not-allowed opacity-50' : 'hover:scale-110 hover:opacity-100'}`}
                        style={{ backgroundColor: '#8B4513' }}
                        onClick={() => selectedWireId && toggleSleeving('brown')}
                        title={selectedWireId ? "Apply Brown Sleeving" : "Select a wire first"}
                        disabled={!selectedWireId}
                    >
                        {selectedWireId && wires.find(w => w.id === selectedWireId)?.sleeving === 'brown' && <div className="absolute inset-0 border-2 border-white rounded-full"></div>}
                    </button>
                    <button 
                        className={`w-6 h-6 rounded-full border-2 transition-transform relative ${selectedWireId && wires.find(w => w.id === selectedWireId)?.sleeving === 'blue' ? 'scale-125 border-white shadow-lg' : 'border-transparent opacity-80'} ${!selectedWireId ? 'cursor-not-allowed opacity-50' : 'hover:scale-110 hover:opacity-100'}`}
                        style={{ backgroundColor: '#0056b3' }}
                        onClick={() => selectedWireId && toggleSleeving('blue')}
                        title={selectedWireId ? "Apply Blue Sleeving" : "Select a wire first"}
                        disabled={!selectedWireId}
                    >
                        {selectedWireId && wires.find(w => w.id === selectedWireId)?.sleeving === 'blue' && <div className="absolute inset-0 border-2 border-white rounded-full"></div>}
                    </button>
                    <button 
                        className={`w-6 h-6 rounded-full border-2 transition-transform relative ${selectedWireId && wires.find(w => w.id === selectedWireId)?.sleeving === 'green' ? 'scale-125 border-white shadow-lg' : 'border-transparent opacity-80'} ${!selectedWireId ? 'cursor-not-allowed opacity-50' : 'hover:scale-110 hover:opacity-100'}`}
                        style={{ backgroundColor: '#22c55e', backgroundImage: 'repeating-linear-gradient(45deg, #22c55e, #22c55e 5px, #eab308 5px, #eab308 10px)' }}
                        onClick={() => selectedWireId && toggleSleeving('green')}
                        title={selectedWireId ? "Apply Earth Sleeving" : "Select a wire first"}
                        disabled={!selectedWireId}
                    >
                        {selectedWireId && wires.find(w => w.id === selectedWireId)?.sleeving === 'green' && <div className="absolute inset-0 border-2 border-white rounded-full"></div>}
                    </button>
                </div>
            </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setShowCurrentFlow(!showCurrentFlow)}
            className="flex items-center gap-2 px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-sm transition-colors"
          >
             <Activity size={16} className={showCurrentFlow ? "text-yellow-400" : "text-gray-400"} />
             {showCurrentFlow ? 'Hide Flow' : 'Show Flow'}
          </button>
          <button 
            onClick={() => setShowLabels(!showLabels)}
            className="flex items-center gap-2 px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-sm transition-colors"
          >
             {showLabels ? <Eye size={16} /> : <EyeOff size={16} />}
             {showLabels ? 'Hide Labels' : 'Show Labels'}
          </button>
          <button 
            onClick={() => setShowSymbols(!showSymbols)}
            className="flex items-center gap-2 px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-sm transition-colors"
          >
             <PenTool size={16} />
             {showSymbols ? 'Hide Symbol' : 'Show Symbol'}
          </button>
          <button 
            onClick={clearAll}
            className="flex items-center gap-2 px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors"
          >
            <RotateCw size={16} /> Reset All
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Palette */}
        <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto flex flex-col p-4 shadow-inner z-10 shrink-0">
          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Supply</h3>
            <div className="grid grid-cols-2 gap-2 mb-2">
               <button onClick={() => addComponent('SOURCE_AC')} className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded hover:bg-gray-50 hover:border-blue-300 transition-all bg-white shadow-sm h-24">
                  <IconAcSupply />
                  <span className="text-xs text-center font-medium">1-Phase 230V</span>
               </button>
                <button onClick={() => addComponent('SOURCE_3PH')} className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded hover:bg-gray-50 hover:border-blue-300 transition-all bg-white shadow-sm h-24">
                  <Icon3PhSupply />
                  <span className="text-xs text-center font-medium">3-Phase 400V</span>
               </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2 mb-2">
                 <button onClick={() => addComponent('BAR_NEUTRAL')} className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded hover:bg-gray-50 hover:border-blue-300 transition-all bg-white shadow-sm h-24">
                    <IconNeutralBar />
                    <span className="text-xs text-center">Neutral Bar</span>
                 </button>
                 <button onClick={() => addComponent('BAR_EARTH')} className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded hover:bg-gray-50 hover:border-blue-300 transition-all bg-white shadow-sm h-24">
                    <IconEarthBar />
                    <span className="text-xs text-center">Earth Bar</span>
                 </button>
            </div>

            <div className="grid grid-cols-1 gap-2">
               <button onClick={addConsumerUnit} className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded hover:bg-gray-50 hover:border-blue-300 transition-all bg-white shadow-sm h-24">
                  <IconConsumerUnit />
                  <span className="text-xs text-center">Consumer Unit</span>
               </button>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Protection</h3>
            <div className="grid grid-cols-2 gap-2">
               <button onClick={() => addComponent('MCB')} className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded hover:bg-gray-50 hover:border-blue-300 transition-all bg-white shadow-sm h-24">
                  <IconMCB />
                  <span className="text-xs text-center">MCB (Breaker)</span>
               </button>
               <button onClick={() => addComponent('RCD')} className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded hover:bg-gray-50 hover:border-blue-300 transition-all bg-white shadow-sm h-24">
                  <IconRCD />
                  <span className="text-xs text-center">RCD (Main Switch)</span>
               </button>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Control</h3>
            <div className="grid grid-cols-2 gap-2">
               <button onClick={() => addComponent('SWITCH_1G')} className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded hover:bg-gray-50 hover:border-blue-300 transition-all bg-white shadow-sm h-24">
                  <IconSwitch />
                  <span className="text-xs text-center">1-Way Switch</span>
               </button>
               <button onClick={() => addComponent('SWITCH_2W')} className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded hover:bg-gray-50 hover:border-blue-300 transition-all bg-white shadow-sm h-24">
                  <IconSwitch label="2W" />
                  <span className="text-xs text-center">2-Way Switch</span>
               </button>
               <button onClick={() => addComponent('SWITCH_2G_2W')} className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded hover:bg-gray-50 hover:border-blue-300 transition-all bg-white shadow-sm h-24">
                  <IconSwitch label="2G" />
                  <span className="text-xs text-center">2-Gang Switch</span>
               </button>
                <button onClick={() => addComponent('SWITCH_INT')} className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded hover:bg-gray-50 hover:border-blue-300 transition-all bg-white shadow-sm h-24">
                  <IconSwitch label="INT" />
                  <span className="text-xs text-center">Intermediate Switch</span>
               </button>
               <button onClick={() => addComponent('SWITCH_ROTARY')} className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded hover:bg-gray-50 hover:border-blue-300 transition-all bg-white shadow-sm h-24">
                  <IconRotary />
                  <span className="text-xs text-center">Rotary Isolator</span>
               </button>
               <button onClick={() => addComponent('SWITCH_FUSED')} className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded hover:bg-gray-50 hover:border-blue-300 transition-all bg-white shadow-sm h-24">
                  <IconSwitchFused />
                  <span className="text-xs text-center">Fused Switch (FCU)</span>
               </button>
               <button onClick={() => addComponent('SWITCH_COOKER')} className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded hover:bg-gray-50 hover:border-blue-300 transition-all bg-white shadow-sm h-24">
                  <IconCookerSwitch />
                  <span className="text-xs text-center">Cooker Switch</span>
               </button>
            </div>
          </div>

          <div className="mb-6">
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Load</h3>
             <div className="grid grid-cols-2 gap-2">
                <button onClick={() => addComponent('LAMP_PENDANT')} className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded hover:bg-gray-50 hover:border-blue-300 transition-all bg-white shadow-sm h-24">
                  <IconLampPendant />
                  <span className="text-xs text-center">Pendant Set (Rose)</span>
               </button>
               <button onClick={() => addComponent('SOCKET_DOUBLE')} className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded hover:bg-gray-50 hover:border-blue-300 transition-all bg-white shadow-sm h-24">
                  <IconSocketDouble />
                  <span className="text-xs text-center">Double Socket</span>
               </button>
               <button onClick={() => addComponent('SOCKET_SINGLE')} className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded hover:bg-gray-50 hover:border-blue-300 transition-all bg-white shadow-sm h-24">
                    <IconSocketSingle />
                  <span className="text-xs text-center">Single Socket</span>
               </button>
               <button onClick={() => addComponent('FAN')} className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded hover:bg-gray-50 hover:border-blue-300 transition-all bg-white shadow-sm h-24">
                  <IconFan />
                  <span className="text-xs text-center">Extractor Fan</span>
               </button>
               <button onClick={() => addComponent('FAN_PLUG')} className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded hover:bg-gray-50 hover:border-blue-300 transition-all bg-white shadow-sm h-24">
                  <IconFanPortable />
                  <span className="text-xs text-center">Portable Fan</span>
               </button>
             </div>
          </div>

          <div className="mb-6">
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Connection</h3>
             <div className="grid grid-cols-2 gap-2">
                <button onClick={() => addComponent('JUNCTION_BOX')} className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded hover:bg-gray-50 hover:border-blue-300 transition-all bg-white shadow-sm h-24">
                  <IconJunctionBox />
                  <span className="text-xs text-center">Junction Box (4T)</span>
               </button>
               <button onClick={() => addComponent('CONNECTOR_BLOCK')} className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded hover:bg-gray-50 hover:border-blue-300 transition-all bg-white shadow-sm h-24">
                  <IconConnector />
                  <span className="text-xs text-center">Connector Block</span>
               </button>
               <button onClick={() => addComponent('OUTLET_COOKER')} className="flex flex-col items-center justify-center p-2 border border-gray-200 rounded hover:bg-gray-50 hover:border-blue-300 transition-all bg-white shadow-sm h-24">
                  <IconCookerOutlet />
                  <span className="text-xs text-center">Cooker Outlet</span>
               </button>
             </div>
          </div>

          <div className="mb-6">
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Tester</h3>
             <div className="grid grid-cols-2 gap-2">
                <button onClick={toggleMultimeter} className={`flex flex-col items-center justify-center p-2 border rounded transition-all bg-white shadow-sm h-24 ${multimeter.visible ? 'border-yellow-500 ring-2 ring-yellow-200' : 'border-gray-200 hover:bg-gray-50 hover:border-blue-300'}`}>
                  <IconMultimeter />
                  <span className="text-xs text-center">Multimeter</span>
               </button>
                <button onClick={toggleMegger} className={`flex flex-col items-center justify-center p-2 border rounded transition-all bg-white shadow-sm h-24 ${megger.visible ? 'border-orange-500 ring-2 ring-orange-200' : 'border-gray-200 hover:bg-gray-50 hover:border-blue-300'}`}>
                  <IconMegger />
                  <span className="text-xs text-center">Megger</span>
               </button>
             </div>
          </div>
        </aside>

        {/* Main Canvas + Properties Wrapper */}
        <div 
          className="flex-1 flex flex-col relative overflow-hidden"
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
        >
          {/* Main Canvas Container */}
          <main 
            ref={containerRef}
            className={`flex-1 relative bg-gray-100 overflow-hidden ${isPanning ? 'cursor-grabbing' : 'cursor-default'}`}
            onMouseDown={handleCanvasMouseDown}
            onWheel={handleWheel}
          >
            {/* Fault Warning Banner */}
            {simResult.errors.length > 0 && (
              <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 bg-red-100 border border-red-400 text-red-800 px-6 py-3 rounded shadow-xl flex items-center gap-3 pointer-events-none select-none">
                  <ShieldAlert className="w-6 h-6 shrink-0" />
                  <div className="flex flex-col">
                      <span className="font-bold text-sm uppercase">Circuit Fault Detected</span>
                      {simResult.errors.map((err, i) => (
                          <span key={i} className="text-xs font-medium">{err}</span>
                      ))}
                  </div>
              </div>
            )}

            {/* Status Overlay */}
            <div className="absolute top-4 right-4 bg-white/90 p-4 rounded shadow backdrop-blur-sm z-50 w-64">
              <h3 className="font-bold text-sm mb-2">Status Panel</h3>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${simResult.energizedComponents.has(components.find(c => c.type === 'SOURCE_AC' || c.type === 'SOURCE_3PH')?.id || '') ? 'bg-red-500 animate-pulse' : 'bg-gray-400'}`}></div>
                <span className="text-xs">Main Supply: {simResult.energizedComponents.has(components.find(c => c.type === 'SOURCE_AC' || c.type === 'SOURCE_3PH')?.id || '') ? 'ON' : 'OFF'}</span>
              </div>
              {simResult.trippedBreakers.size > 0 && (
                <div className="mt-2 text-xs text-orange-600 font-bold">
                  ⚠️ Breaker Tripped! Check circuit.
                </div>
              )}
              
              <div className="mt-4 pt-2 border-t border-gray-200">
                <button 
                  onClick={() => setShowShortcuts(!showShortcuts)}
                  className="flex items-center justify-between w-full text-xs font-bold text-gray-700 hover:text-blue-600 focus:outline-none"
                >
                  <span>Shortcuts & Info</span>
                  {showShortcuts ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                
                {showShortcuts && (
                  <div className="mt-3 text-[10px] text-gray-500 animate-in slide-in-from-top-1 fade-in duration-200">
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 mb-2">
                        <span>Rotate:</span><kbd className="font-mono bg-gray-200 px-1 rounded">R</kbd>
                        <span>Duplicate:</span><kbd className="font-mono bg-gray-200 px-1 rounded">Ctrl+D</kbd>
                        <span>Delete:</span><kbd className="font-mono bg-gray-200 px-1 rounded">Del</kbd>
                        <span>Line (Brn):</span><kbd className="font-mono bg-gray-200 px-1 rounded">1</kbd>
                        <span>Neutral:</span><kbd className="font-mono bg-gray-200 px-1 rounded">2</kbd>
                        <span>Earth:</span><kbd className="font-mono bg-gray-200 px-1 rounded">3</kbd>
                      </div>
                  </div>
                )}
              </div>
            </div>

            <div 
              className="origin-top-left absolute top-0 left-0 w-full h-full"
              style={{ 
                  transform: `translate(${viewState.x}px, ${viewState.y}px) scale(${viewState.scale})`,
              }}
            >
              <div 
                  className="absolute -top-[5000px] -left-[5000px] w-[10000px] h-[10000px] bg-grid opacity-100 pointer-events-none"
              ></div>

              {components.map(comp => (
                <ComponentNode 
                  key={comp.id}
                  data={comp}
                  isSelected={selectedCompId === comp.id}
                  isEnergized={simResult.energizedComponents.has(comp.id)}
                  onMouseDown={(e) => handleCompMouseDown(e, comp.id)}
                  onTerminalMouseDown={(e, termId) => handleTerminalMouseDown(e, comp.id, termId)}
                  onTerminalMouseUp={(e, termId) => handleTerminalMouseUp(e, comp.id, termId)}
                  onDelete={() => deleteComponent(comp.id)}
                  onRotate={() => rotateComponent(comp.id)}
                  onToggleState={(subKey) => toggleComponentState(comp.id, subKey)}
                  showLabels={showLabels}
                  showSymbols={showSymbols}
                  onDuplicate={() => duplicateComponent(comp.id)}
                  onPlugMouseDown={(e) => handlePlugMouseDown(e, comp.id)} // Pass dragging handler
                />
              ))}

              {/* Wires (z-20) - Placed AFTER components (z-10) to appear ON TOP visually */}
              <svg className="overflow-visible absolute top-0 left-0 z-20 pointer-events-none">
                {wireGeometries.map(geo => {
                    const isSelected = selectedWireId === geo.wire.id;
                    const pathD = getPathWithJumps(geo);
                    
                    // Hit Areas
                    // Start Arm: p1 -> p2
                    const p1 = geo.points[1];
                    const p2 = geo.points[2];
                    // Trunk: p2 -> p3
                    const p3 = geo.points[3];
                    // End Arm: p3 -> p4
                    const p4 = geo.points[4];
                    const p5 = geo.points[5]; // Terminal

                    // Animation for flowing wires
                    const isFlowing = simResult.flowingWires.has(geo.wire.id);
                    const isForward = simResult.flowingWires.get(geo.wire.id) || false;

                    const isClamped = multimeter.clampedWireId === geo.wire.id;

                    return (
                      <g key={geo.wire.id} className="pointer-events-auto">
                          {/* Selection Halo */}
                          {isSelected && (
                              <path
                                  d={pathD}
                                  stroke="#3b82f6"
                                  strokeWidth="8"
                                  fill="none"
                                  opacity="0.4"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                              />
                          )}

                          {/* Visual Wire */}
                          {geo.wire.color === 'green' ? (
                              <>
                                  <path 
                                      d={pathD}
                                      stroke="#22c55e"
                                      strokeWidth="4"
                                      fill="none"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                  />
                                  <path 
                                      d={pathD}
                                      stroke="#eab308"
                                      strokeWidth="2"
                                      strokeDasharray="6, 6"
                                      fill="none"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                  />
                              </>
                          ) : (
                              <path 
                                  d={pathD}
                                  stroke={getWireColorHex(geo.wire.color)}
                                  strokeWidth="3"
                                  fill="none"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                              />
                          )}

                          {/* Flow Animation */}
                          {isFlowing && showCurrentFlow && (
                            <path
                                d={pathD}
                                stroke="#fbbf24" 
                                strokeWidth="2"
                                fill="none"
                                strokeDasharray="10, 10"
                                strokeLinecap="round"
                                style={{
                                    animation: `${isForward ? 'flowAnimation' : 'flowAnimationReverse'} 1s linear infinite`
                                }}
                            />
                          )}

                          {/* Sleeving Visuals using PathLength and DashArray */}
                          {geo.wire.sleeving && (
                              <>
                                  {/* Start Sleeving (16% length) */}
                                  <path
                                      d={pathD}
                                      pathLength="100"
                                      strokeDasharray="16 100"
                                      stroke={getWireColorHex(geo.wire.sleeving)}
                                      strokeWidth="6"
                                      fill="none"
                                      strokeLinecap="butt" // Butt cap to make start sharp or round if desired
                                      opacity="0.5"
                                  />
                                  {/* End Sleeving (16% length) */}
                                  <path
                                      d={pathD}
                                      pathLength="100"
                                      strokeDasharray="0 84 16 0" // Wait 84, Draw 16
                                      stroke={getWireColorHex(geo.wire.sleeving)}
                                      strokeWidth="6"
                                      fill="none"
                                      strokeLinecap="butt"
                                      opacity="0.5"
                                  />
                                  
                                  {/* Yellow Stripe for Green Earth Sleeving */}
                                  {geo.wire.sleeving === 'green' && (
                                      <>
                                          <path
                                              d={pathD}
                                              pathLength="100"
                                              strokeDasharray="16 100"
                                              stroke="#eab308"
                                              strokeWidth="3"
                                              fill="none"
                                              strokeLinecap="butt"
                                              opacity="0.5" // Match transparency
                                          />
                                          <path
                                              d={pathD}
                                              pathLength="100"
                                              strokeDasharray="0 84 16 0"
                                              stroke="#eab308"
                                              strokeWidth="3"
                                              fill="none"
                                              strokeLinecap="butt"
                                              opacity="0.5"
                                          />
                                      </>
                                  )}
                              </>
                          )}
                          
                          {/* Hit Area & Drag Handlers - Segments */}
                          {/* Start Segment */}
                          <line
                            x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                            stroke="transparent"
                            strokeWidth="20"
                            cursor={getWireCursor(geo.wire.orientation)}
                            onMouseDown={(e) => handleWireSegmentMouseDown(e, geo.wire.id, 'start')}
                          />
                          {/* Trunk Segment */}
                          <line
                            x1={p2.x} y1={p2.y} x2={p3.x} y2={p3.y}
                            stroke="transparent"
                            strokeWidth="20"
                            cursor={getWireCursor(geo.wire.orientation === 'vertical' ? 'horizontal' : 'vertical')}
                            onMouseDown={(e) => handleWireSegmentMouseDown(e, geo.wire.id, 'trunk')}
                            onDoubleClick={(e) => handleWireHandleDoubleClick(e, geo.wire, geo)}
                          />
                          {/* End Segment */}
                          <line
                            x1={p3.x} y1={p3.y} x2={p4.x} y2={p4.y}
                            stroke="transparent"
                            strokeWidth="20"
                            cursor={getWireCursor(geo.wire.orientation)}
                            onMouseDown={(e) => handleWireSegmentMouseDown(e, geo.wire.id, 'end')}
                          />

                          {/* General selection hit area for non-segment parts (stubs) */}
                          <path 
                            d={pathD}
                            stroke="transparent"
                            strokeWidth="10"
                            fill="none"
                            cursor={draggingProbe === 'clamp' ? 'crosshair' : 'pointer'}
                            onMouseDown={(e) => {
                              if (!draggingWireSegment) handleWireSegmentMouseDown(e, geo.wire.id, 'trunk');
                            }}
                          />

                          {/* Drag Handles (Visible only when selected) */}
                          {isSelected && (
                              <>
                                  {/* Start Handle */}
                                  <circle
                                      cx={(p1.x + p2.x)/2}
                                      cy={(p1.y + p2.y)/2}
                                      r={4}
                                      fill="#fff" stroke="#666" strokeWidth="1"
                                      className="pointer-events-none" 
                                  />
                                  {/* Trunk Handle */}
                                  <circle
                                      cx={(p2.x + p3.x)/2}
                                      cy={(p2.y + p3.y)/2}
                                      r={6}
                                      fill="#3b82f6" stroke="#fff" strokeWidth="2"
                                      className="pointer-events-none" 
                                  />
                                  {/* End Handle */}
                                  <circle
                                      cx={(p3.x + p4.x)/2}
                                      cy={(p3.y + p4.y)/2}
                                      r={4}
                                      fill="#fff" stroke="#666" strokeWidth="1"
                                      className="pointer-events-none" 
                                  />

                                  {/* Trash Button */}
                                  <foreignObject
                                      x={(p2.x + p3.x)/2 + 10}
                                      y={(p2.y + p3.y)/2 - 12}
                                      width="24"
                                      height="24"
                                      className="overflow-visible"
                                  >
                                      <div className="flex gap-1">
                                          <div 
                                              className="bg-red-500 text-white rounded-full p-1 cursor-pointer shadow-md hover:bg-red-600 flex items-center justify-center w-6 h-6"
                                              onMouseDown={(e) => { e.stopPropagation(); deleteWire(geo.wire.id); }}
                                              title="Delete Wire"
                                          >
                                              <Trash2 size={12} />
                                          </div>
                                      </div>
                                  </foreignObject>
                              </>
                          )}
                      </g>
                    );
                })}

                {/* Drawing Wire Preview */}
                {drawingWire && (
                  <>
                      <line 
                        x1={getTerminalPos(drawingWire.fromCompId, drawingWire.fromTerminal)?.x} 
                        y1={getTerminalPos(drawingWire.fromCompId, drawingWire.fromTerminal)?.y} 
                        x2={drawingWire.currentPos.x} 
                        y2={drawingWire.currentPos.y}
                        stroke={getWireColorHex(currentWireColor)}
                        strokeWidth="2" 
                        strokeDasharray="5,5"
                      />
                  </>
                )}
                
                {/* Multimeter Cables (Bezier Curves) */}
                {meterRender && (
                  <>
                      {meterRender.redPosWorld && (
                         <path 
                           d={`M ${meterRender.socketRedWorld.x} ${meterRender.socketRedWorld.y} Q ${meterRender.socketRedWorld.x} ${meterRender.redPosWorld.y + 100} ${meterRender.redPosWorld.x} ${meterRender.redPosWorld.y}`} 
                           fill="none" 
                           stroke="#b91c1c" 
                           strokeWidth="4" 
                           strokeLinecap="round"
                           className="drop-shadow-sm opacity-90"
                         />
                      )}
                      {meterRender.blackPosWorld && (
                         <path 
                           d={`M ${meterRender.socketBlackWorld.x} ${meterRender.socketBlackWorld.y} Q ${meterRender.socketBlackWorld.x} ${meterRender.blackPosWorld.y + 100} ${meterRender.blackPosWorld.x} ${meterRender.blackPosWorld.y}`} 
                           fill="none" 
                           stroke="#1f2937" 
                           strokeWidth="4" 
                           strokeLinecap="round"
                           className="drop-shadow-sm opacity-90"
                         />
                      )}
                  </>
                )}

                 {/* Megger Cables */}
                {meggerRender && (
                  <>
                      {meggerRender.redPosWorld && (
                         <path 
                           d={`M ${meggerRender.socketRedWorld.x} ${meggerRender.socketRedWorld.y} Q ${meggerRender.socketRedWorld.x} ${meggerRender.redPosWorld.y + 100} ${meggerRender.redPosWorld.x} ${meggerRender.redPosWorld.y}`} 
                           fill="none" 
                           stroke="#dc2626" // Red 600
                           strokeWidth="4" 
                           strokeLinecap="round"
                           className="drop-shadow-sm opacity-90"
                         />
                      )}
                      {meggerRender.blackPosWorld && (
                         <path 
                           d={`M ${meggerRender.socketBlackWorld.x} ${meggerRender.socketBlackWorld.y} Q ${meggerRender.socketBlackWorld.x} ${meggerRender.blackPosWorld.y + 100} ${meggerRender.blackPosWorld.x} ${meggerRender.blackPosWorld.y}`} 
                           fill="none" 
                           stroke="#1f2937" 
                           strokeWidth="4" 
                           strokeLinecap="round"
                           className="drop-shadow-sm opacity-90"
                         />
                      )}
                  </>
                )}

              </svg>

              {/* GLOBAL TERMINAL OVERLAYS (z-40) */}
              {allTerminals.map(t => {
                  // Visual Feedback for Snap Target
                  const isSnapTarget = potentialSnapTerminal === t.id;
                  
                  return (
                    <div
                        key={t.id}
                        className="absolute z-40 group cursor-crosshair flex items-center justify-center pointer-events-auto"
                        style={{ 
                            left: t.x - 6, 
                            top: t.y - 6, 
                            width: 12, 
                            height: 12 
                        }}
                        onMouseDown={(e) => handleTerminalMouseDown(e, t.compId, t.termId)}
                        onMouseUp={(e) => handleTerminalMouseUp(e, t.compId, t.termId)}
                    >
                        {/* Magnetic Snap Ring Effect */}
                        {isSnapTarget && (
                            <div className="absolute inset-0 rounded-full border-2 border-yellow-400 bg-yellow-400/20 animate-ping-slow pointer-events-none"></div>
                        )}
                        {isSnapTarget && (
                            <div className="absolute inset-0 rounded-full border-2 border-yellow-500 opacity-80 pointer-events-none"></div>
                        )}

                        {/* Tooltip on Hover */}
                        <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-white border border-gray-200 shadow-md px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-700 whitespace-nowrap z-50 pointer-events-none">
                            {t.label}
                        </div>
                    </div>
                  );
              })}

              {/* Multimeter Probe Heads (In World Space) - Visuals for Attached/Dragging Probes */}
              {meterRender && (
                  <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-50">
                      {meterRender.redPosWorld && (
                          <div 
                              className={`absolute w-4 h-24 origin-bottom flex flex-col items-center justify-end ${draggingProbe === 'red' ? 'pointer-events-none' : 'pointer-events-auto cursor-grab active:cursor-grabbing hover:scale-105'} transition-transform`}
                              style={{ left: meterRender.redPosWorld.x - 8, top: meterRender.redPosWorld.y - 96 }}
                              onMouseDown={(e) => {
                                  e.stopPropagation();
                                  setDraggingProbe('red');
                                  setProbeDragPos({ x: e.clientX, y: e.clientY });
                                  dragStartTime.current = Date.now();
                                  setMultimeter(p => ({ ...p, redProbeNode: null }));
                              }}
                          >
                              {/* Grip */}
                              <div className="w-4 h-16 bg-red-600 rounded-full border border-red-800 shadow-md flex flex-col items-center">
                                  <div className="mt-2 w-3 h-8 border-t border-b border-red-800/30"></div>
                              </div>
                              {/* Metal Tip */}
                              <div className="w-1 h-8 bg-gray-300 border-x border-gray-400 -mt-1 z-[-1]"></div>
                          </div>
                      )}
                      {meterRender.blackPosWorld && (
                          <div 
                              className={`absolute w-4 h-24 origin-bottom flex flex-col items-center justify-end ${draggingProbe === 'black' ? 'pointer-events-none' : 'pointer-events-auto cursor-grab active:cursor-grabbing hover:scale-105'} transition-transform`}
                              style={{ left: meterRender.blackPosWorld.x - 8, top: meterRender.blackPosWorld.y - 96 }}
                              onMouseDown={(e) => {
                                  e.stopPropagation();
                                  setDraggingProbe('black');
                                  setProbeDragPos({ x: e.clientX, y: e.clientY });
                                  dragStartTime.current = Date.now();
                                  setMultimeter(p => ({ ...p, blackProbeNode: null }));
                              }}
                          >
                               {/* Grip */}
                               <div className="w-4 h-16 bg-gray-800 rounded-full border border-black shadow-md flex flex-col items-center">
                                  <div className="mt-2 w-3 h-8 border-t border-b border-gray-600/30"></div>
                              </div>
                              {/* Metal Tip */}
                              <div className="w-1 h-8 bg-gray-300 border-x border-gray-400 -mt-1 z-[-1]"></div>
                          </div>
                      )}

                      {/* Clamp Head */}
                      {meterRender.clampPosWorld && (
                          <div 
                             className={`absolute ${draggingProbe === 'clamp' ? 'pointer-events-none' : 'pointer-events-auto cursor-grab active:cursor-grabbing'}`}
                             style={{ 
                                 left: meterRender.clampPosWorld.x, 
                                 top: meterRender.clampPosWorld.y,
                                 transform: `translate(-50%, -50%) rotate(${meterRender.clampRotation}deg)` 
                             }}
                             onMouseDown={(e) => {
                                 e.stopPropagation();
                                 setDraggingProbe('clamp');
                                 setProbeDragPos({ x: e.clientX, y: e.clientY });
                                 dragStartTime.current = Date.now();
                                 setMultimeter(p => ({ ...p, clampedWireId: null }));
                              }}
                          >
                              {/* Clamp Jaw - U Shape */}
                              <div className="relative flex items-center justify-center">
                                  <svg width="50" height="80" viewBox="0 0 50 80" className="drop-shadow-md overflow-visible">
                                      {/* Handle connection */}
                                      <path d="M 20 80 L 30 80 L 25 60 Z" fill="#333" />
                                      
                                      {/* U Body */}
                                      {/* A thick U shape path */}
                                      <path 
                                        d="M 10 10 L 10 50 A 15 15 0 0 0 40 50 L 40 10"
                                        fill="none"
                                        stroke="#EAB308" // Yellow
                                        strokeWidth="12"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                      {/* Inner Dark Stroke for definition */}
                                      <path 
                                        d="M 10 10 L 10 50 A 15 15 0 0 0 40 50 L 40 10"
                                        fill="none"
                                        stroke="#1f2937" // Dark Gray
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        className="opacity-40"
                                      />
                                       {/* Red tips */}
                                      <rect x="4" y="8" width="12" height="4" fill="#ef4444" rx="1" />
                                      <rect x="34" y="8" width="12" height="4" fill="#ef4444" rx="1" />
                                  </svg>
                              </div>
                          </div>
                      )}
                  </div>
              )}

              {/* Megger Probe Heads */}
              {meggerRender && (
                  <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-50">
                      {meggerRender.redPosWorld && (
                          <div 
                              className={`absolute w-4 h-24 origin-bottom flex flex-col items-center justify-end ${draggingProbe === 'megger-red' ? 'pointer-events-none' : 'pointer-events-auto cursor-grab active:cursor-grabbing hover:scale-105'} transition-transform`}
                              style={{ left: meggerRender.redPosWorld.x - 8, top: meggerRender.redPosWorld.y - 96 }}
                              onMouseDown={(e) => {
                                  e.stopPropagation();
                                  setDraggingProbe('megger-red');
                                  setProbeDragPos({ x: e.clientX, y: e.clientY });
                                  dragStartTime.current = Date.now();
                                  setMegger(p => ({ ...p, redProbeNode: null }));
                              }}
                          >
                              {/* Grip */}
                              <div className="w-4 h-16 bg-red-600 rounded-full border border-red-800 shadow-md flex flex-col items-center">
                                  {/* Distinctive Megger Probe grip */}
                                  <div className="mt-1 w-full h-1 bg-red-900"></div>
                                  <div className="mt-2 w-3 h-8 border-t border-b border-red-800/30"></div>
                              </div>
                              {/* Metal Tip */}
                              <div className="w-1 h-8 bg-gray-300 border-x border-gray-400 -mt-1 z-[-1]"></div>
                          </div>
                      )}
                      {meggerRender.blackPosWorld && (
                          <div 
                              className={`absolute w-4 h-24 origin-bottom flex flex-col items-center justify-end ${draggingProbe === 'megger-black' ? 'pointer-events-none' : 'pointer-events-auto cursor-grab active:cursor-grabbing hover:scale-105'} transition-transform`}
                              style={{ left: meggerRender.blackPosWorld.x - 8, top: meggerRender.blackPosWorld.y - 96 }}
                              onMouseDown={(e) => {
                                  e.stopPropagation();
                                  setDraggingProbe('megger-black');
                                  setProbeDragPos({ x: e.clientX, y: e.clientY });
                                  dragStartTime.current = Date.now();
                                  setMegger(p => ({ ...p, blackProbeNode: null }));
                              }}
                          >
                               {/* Grip */}
                               <div className="w-4 h-16 bg-gray-800 rounded-full border border-black shadow-md flex flex-col items-center">
                                  <div className="mt-1 w-full h-1 bg-black"></div>
                                  <div className="mt-2 w-3 h-8 border-t border-b border-gray-600/30"></div>
                              </div>
                              {/* Metal Tip */}
                              <div className="w-1 h-8 bg-gray-300 border-x border-gray-400 -mt-1 z-[-1]"></div>
                          </div>
                      )}
                  </div>
              )}

            </div>
          </main>

          {/* Properties Panel */}
          <PropertiesPanel
             selectedCompId={selectedCompId}
             selectedWireId={selectedWireId}
             components={components}
             wires={wires}
             onUpdateComponent={updateComponent}
             onUpdateWire={updateWire}
             onDelete={() => {
                if (selectedCompId) deleteComponent(selectedCompId);
                if (selectedWireId) deleteWire(selectedWireId);
             }}
          />
        </div>

        {/* Multimeter UI Overlay */}
        {multimeter.visible && (
            <Multimeter 
                state={multimeter}
                reading={getMultimeterReading()}
                onPositionChange={(pos) => setMultimeter(p => ({ ...p, position: pos }))}
                onProbeDragStart={(e, type) => {
                    setDraggingProbe(type);
                    setProbeDragPos({ x: e.clientX, y: e.clientY });
                    dragStartTime.current = Date.now();
                    // Disconnect probe on drag start
                    setMultimeter(p => ({ ...p, [type === 'red' ? 'redProbeNode' : 'blackProbeNode']: null }));
                }}
                onModeChange={(mode) => setMultimeter(p => ({ ...p, mode }))}
                onClose={() => setMultimeter(p => ({ ...p, visible: false }))}
                onClampDragStart={(e) => {
                     setDraggingProbe('clamp');
                     setProbeDragPos({ x: e.clientX, y: e.clientY });
                     dragStartTime.current = Date.now();
                     setMultimeter(p => ({ ...p, clampedWireId: null, clampPosition: undefined, clampRotation: undefined }));
                }}
            />
        )}

        {/* Megger UI Overlay */}
        {megger.visible && (
            <Megger 
                state={megger}
                reading={getMeggerReading()}
                onPositionChange={(pos) => setMegger(p => ({ ...p, position: pos }))}
                onProbeDragStart={(e, type) => {
                    setDraggingProbe(type);
                    setProbeDragPos({ x: e.clientX, y: e.clientY });
                    dragStartTime.current = Date.now();
                    setMegger(p => ({ ...p, [type === 'megger-red' ? 'redProbeNode' : 'blackProbeNode']: null }));
                }}
                onModeChange={(mode) => setMegger(p => ({ ...p, mode }))}
                onTestStart={() => setMegger(p => ({ ...p, isTestActive: true }))}
                onTestEnd={() => setMegger(p => ({ ...p, isTestActive: false }))}
                onClose={() => setMegger(p => ({ ...p, visible: false }))}
            />
        )}
      </div>
    </div>
  );
}
