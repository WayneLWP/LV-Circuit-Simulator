

import { ComponentDef, TerminalDef } from './types';

// --- Terminal Layout Helpers ---
// Simplified coordinate system: Component is usually 120x120 or similar.
// Terminals are placed relatively.

export const COMPONENT_CATALOG: Record<string, ComponentDef> = {
  SOURCE_AC: {
    type: 'SOURCE_AC',
    name: '230V AC Supply',
    category: 'supply',
    width: 100,
    height: 100,
    terminals: [
      { id: 'L', label: 'L', x: 20, y: 80, type: 'L' },
      { id: 'N', label: 'N', x: 50, y: 80, type: 'N' },
      { id: 'E', label: 'E', x: 80, y: 80, type: 'E' },
    ],
    initialState: { isOn: false },
    // Internal: The source doesn't connect terminals together, it provides potential.
  },
  SOURCE_3PH: {
    type: 'SOURCE_3PH',
    name: '3-Phase Supply (400V)',
    category: 'supply',
    width: 140,
    height: 100,
    terminals: [
      { id: 'L1', label: 'L1', x: 20, y: 80, type: 'L' },
      { id: 'L2', label: 'L2', x: 45, y: 80, type: 'L' },
      { id: 'L3', label: 'L3', x: 70, y: 80, type: 'L' },
      { id: 'N', label: 'N', x: 95, y: 80, type: 'N' },
      { id: 'E', label: 'E', x: 120, y: 80, type: 'E' },
    ],
    initialState: { isOn: false },
  },
  MCB: {
    type: 'MCB',
    name: 'MCB (6A)',
    category: 'protection',
    width: 60,
    height: 120,
    terminals: [
      { id: 'IN', label: 'In', x: 30, y: 10, type: 'L' },
      { id: 'OUT', label: 'Out', x: 30, y: 110, type: 'L' },
    ],
    initialState: { isOn: true, isTripped: false },
    getInternalConnections: (state) => state.isOn && !state.isTripped ? [['IN', 'OUT']] : [],
    rating: 6, // 6 Amps (Lighting)
  },
  RCD: {
    type: 'RCD',
    name: 'RCD (Main Switch)',
    category: 'protection',
    width: 80,
    height: 120,
    terminals: [
      { id: 'L_IN', label: 'L In', x: 20, y: 10, type: 'L' },
      { id: 'N_IN', label: 'N In', x: 60, y: 10, type: 'N' },
      { id: 'L_OUT', label: 'L Out', x: 20, y: 110, type: 'L' },
      { id: 'N_OUT', label: 'N Out', x: 60, y: 110, type: 'N' },
    ],
    initialState: { isOn: true, isTripped: false },
    getInternalConnections: (state) => state.isOn && !state.isTripped ? [['L_IN', 'L_OUT'], ['N_IN', 'N_OUT']] : [],
    rating: 63, // 63 Amps
  },
  SWITCH_1G: {
    type: 'SWITCH_1G',
    name: '1-Way Switch',
    category: 'control',
    width: 80,
    height: 80,
    terminals: [
      { id: 'COM', label: 'COM', x: 40, y: 20, type: 'Generic' },
      { id: 'L1', label: 'L1', x: 40, y: 70, type: 'Generic' },
      { id: 'E', label: 'E', x: 65, y: 65, type: 'E' }, // Moved to bottom right
    ],
    initialState: { isOn: false },
    getInternalConnections: (state) => state.isOn ? [['COM', 'L1']] : [],
  },
  SWITCH_2W: {
    type: 'SWITCH_2W',
    name: '2-Way Switch',
    category: 'control',
    width: 80,
    height: 80,
    terminals: [
      { id: 'COM', label: 'COM', x: 40, y: 15, type: 'Generic' },
      { id: 'L1', label: 'L1', x: 20, y: 65, type: 'Generic' },
      { id: 'L2', label: 'L2', x: 60, y: 65, type: 'Generic' }, 
      { id: 'E', label: 'E', x: 75, y: 75, type: 'E' },
    ],
    initialState: { position: 1 }, // 1 or 2
    getInternalConnections: (state) => state.position === 1 ? [['COM', 'L1']] : [['COM', 'L2']],
  },
  SWITCH_2G_2W: {
    type: 'SWITCH_2G_2W',
    name: '2-Gang 2-Way Switch',
    category: 'control',
    width: 80,
    height: 80,
    terminals: [
      // Switch 1
      { id: 'COM1', label: 'C1', x: 20, y: 12, type: 'Generic' },
      { id: 'L1_1', label: '1_1', x: 12, y: 64, type: 'Generic' },
      { id: 'L2_1', label: '2_1', x: 28, y: 64, type: 'Generic' },
      // Switch 2
      { id: 'COM2', label: 'C2', x: 60, y: 12, type: 'Generic' },
      { id: 'L1_2', label: '1_2', x: 52, y: 64, type: 'Generic' },
      { id: 'L2_2', label: '2_2', x: 68, y: 64, type: 'Generic' },
      // Earth
      { id: 'E', label: 'E', x: 72, y: 76, type: 'E' },
    ],
    initialState: { sw1: 1, sw2: 1 }, // Both switches in position 1
    getInternalConnections: (state) => {
        const conns: [string, string][] = [];
        // Switch 1 logic
        if (state.sw1 === 1) conns.push(['COM1', 'L1_1']); else conns.push(['COM1', 'L2_1']);
        // Switch 2 logic
        if (state.sw2 === 1) conns.push(['COM2', 'L1_2']); else conns.push(['COM2', 'L2_2']);
        return conns;
    },
  },
  SWITCH_INT: {
    type: 'SWITCH_INT',
    name: 'Intermediate Switch',
    category: 'control',
    width: 80,
    height: 80,
    terminals: [
      { id: 'L1', label: 'L1', x: 20, y: 15, type: 'Generic' },
      { id: 'L2', label: 'L2', x: 60, y: 15, type: 'Generic' },
      { id: 'L3', label: 'L3', x: 20, y: 65, type: 'Generic' },
      { id: 'L4', label: 'L4', x: 60, y: 65, type: 'Generic' },
      { id: 'E', label: 'E', x: 75, y: 75, type: 'E' },
    ],
    initialState: { position: 1 }, // 1 = Straight (L1-L3, L2-L4), 2 = Cross (L1-L4, L2-L3)
    getInternalConnections: (state) => state.position === 1 
      ? [['L1', 'L3'], ['L2', 'L4']] 
      : [['L1', 'L4'], ['L2', 'L3']],
  },
  SWITCH_ROTARY: {
    type: 'SWITCH_ROTARY',
    name: '3P+N Isolator 32A',
    category: 'control',
    width: 140,
    height: 140,
    terminals: [
      // Inputs (Top)
      { id: 'L1_IN', label: 'L1 In', x: 25, y: 15, type: 'L' },
      { id: 'L2_IN', label: 'L2 In', x: 55, y: 15, type: 'L' },
      { id: 'L3_IN', label: 'L3 In', x: 85, y: 15, type: 'L' },
      { id: 'N_IN', label: 'N In', x: 115, y: 15, type: 'N' },
      // Outputs (Bottom)
      { id: 'L1_OUT', label: 'L1 Out', x: 25, y: 125, type: 'L' },
      { id: 'L2_OUT', label: 'L2 Out', x: 55, y: 125, type: 'L' },
      { id: 'L3_OUT', label: 'L3 Out', x: 85, y: 125, type: 'L' },
      { id: 'N_OUT', label: 'N Out', x: 115, y: 125, type: 'N' },
      // Earth - Moved to bottom right corner
      { id: 'E', label: 'E', x: 130, y: 130, type: 'E' },
    ],
    initialState: { isOn: false },
    getInternalConnections: (state) => state.isOn ? [
        ['L1_IN', 'L1_OUT'],
        ['L2_IN', 'L2_OUT'],
        ['L3_IN', 'L3_OUT'],
        ['N_IN', 'N_OUT']
    ] : [],
  },
  SWITCH_FUSED: {
    type: 'SWITCH_FUSED',
    name: 'Fused Switch (FCU)',
    category: 'control',
    width: 80,
    height: 80,
    terminals: [
      { id: 'L_IN', label: 'L In', x: 15, y: 10, type: 'L' },
      { id: 'N_IN', label: 'N In', x: 65, y: 10, type: 'N' },
      { id: 'L_OUT', label: 'L Out', x: 15, y: 70, type: 'L' },
      { id: 'N_OUT', label: 'N Out', x: 50, y: 70, type: 'N' },
      { id: 'E', label: 'E', x: 70, y: 70, type: 'E' },
    ],
    initialState: { isOn: false },
    getInternalConnections: (state) => state.isOn ? [['L_IN', 'L_OUT'], ['N_IN', 'N_OUT']] : [],
    rating: 13, // 13A Fuse
  },
  SWITCH_COOKER: {
    type: 'SWITCH_COOKER',
    name: 'Cooker Control Unit',
    category: 'control',
    width: 140, // Horizontal unit, matching double socket
    height: 80,
    terminals: [
      // Terminals concentrated on the right (Switch side)
      { id: 'L_IN', label: 'L In', x: 90, y: 10, type: 'L' },
      { id: 'N_IN', label: 'N In', x: 120, y: 10, type: 'N' },
      { id: 'L_OUT', label: 'L Out', x: 90, y: 70, type: 'L' },
      { id: 'N_OUT', label: 'N Out', x: 120, y: 70, type: 'N' },
      { id: 'E', label: 'E', x: 70, y: 70, type: 'E' },
    ],
    // isOn controls main switch, isSocketOn controls the socket
    initialState: { isOn: false, isSocketOn: false },
    getInternalConnections: (state) => state.isOn ? [['L_IN', 'L_OUT'], ['N_IN', 'N_OUT']] : [],
    rating: 45, // 45A Isolator
  },
  LAMP_PENDANT: {
    type: 'LAMP_PENDANT',
    name: 'Pendant Set (Rose)',
    category: 'load',
    width: 100,
    height: 150,
    terminals: [
      { id: 'L', label: 'L', x: 20, y: 120, type: 'L' }, // Switched Line
      { id: 'LOOP', label: 'Loop', x: 50, y: 120, type: 'L' }, // Permanent Live Loop
      { id: 'N', label: 'N', x: 80, y: 120, type: 'N' }, // Neutral
      { id: 'E', label: 'E', x: 85, y: 140, type: 'E' }, // Earth
    ],
    initialState: { isOn: false },
    getInternalConnections: () => [],
    loadWatts: 100, // 100W Bulb
  },
  SOCKET_SINGLE: {
    type: 'SOCKET_SINGLE',
    name: 'Single Socket',
    category: 'load',
    width: 80,
    height: 80,
    terminals: [
      { id: 'L', label: 'L', x: 20, y: 60, type: 'L' },
      { id: 'N', label: 'N', x: 60, y: 60, type: 'N' },
      { id: 'E', label: 'E', x: 40, y: 20, type: 'E' },
    ],
    initialState: { energized: false, isOn: true }, // isOn represents the switch
    getInternalConnections: () => [],
    loadWatts: 2300, 
  },
  SOCKET_DOUBLE: {
    type: 'SOCKET_DOUBLE',
    name: 'Double Socket',
    category: 'load',
    width: 140,
    height: 80,
    terminals: [
      { id: 'L', label: 'L', x: 30, y: 60, type: 'L' },
      { id: 'N', label: 'N', x: 70, y: 60, type: 'N' },
      { id: 'E', label: 'E', x: 110, y: 60, type: 'E' },
    ],
    initialState: { energized: false, isOn: true },
    getInternalConnections: () => [], 
    loadWatts: 3000, 
  },
  FAN: {
    type: 'FAN',
    name: 'Extractor Fan (Hardwired)',
    category: 'load',
    width: 80,
    height: 80,
    terminals: [
      { id: 'L', label: 'L', x: 20, y: 70, type: 'L' },
      { id: 'N', label: 'N', x: 40, y: 70, type: 'N' },
      { id: 'E', label: 'E', x: 60, y: 70, type: 'E' },
    ],
    initialState: { isOn: false }, 
    getInternalConnections: () => [],
    loadWatts: 60,
  },
  FAN_PLUG: {
    type: 'FAN_PLUG',
    name: 'Portable Fan (Plug)',
    category: 'load',
    width: 80,
    height: 80,
    // Hidden terminals for circuit logic mapping
    terminals: [
      { id: 'L', label: 'L', x: 40, y: 40, type: 'L' },
      { id: 'N', label: 'N', x: 40, y: 40, type: 'N' },
      { id: 'E', label: 'E', x: 40, y: 40, type: 'E' },
    ],
    initialState: { isOn: false },
    getInternalConnections: () => [],
    loadWatts: 60,
  },
  JUNCTION_BOX: {
    type: 'JUNCTION_BOX',
    name: 'Junction Box (4T)',
    category: 'connection',
    width: 100,
    height: 100,
    terminals: [
      { id: 'T1', label: 'T1', x: 25, y: 25, type: 'Generic' },
      { id: 'T2', label: 'T2', x: 75, y: 25, type: 'Generic' },
      { id: 'T3', label: 'T3', x: 75, y: 75, type: 'Generic' },
      { id: 'T4', label: 'T4', x: 25, y: 75, type: 'Generic' },
    ],
    initialState: {},
    getInternalConnections: () => [], 
  },
  OUTLET_COOKER: {
    type: 'OUTLET_COOKER',
    name: 'Cooker Outlet Plate',
    category: 'connection',
    width: 80,
    height: 100, // Increased height for top/bottom separation
    terminals: [
        // Input Terminals (Top)
        { id: 'L_IN', label: 'L In', x: 20, y: 10, type: 'L' },
        { id: 'E_IN', label: 'E In', x: 40, y: 10, type: 'E' },
        { id: 'N_IN', label: 'N In', x: 60, y: 10, type: 'N' },
        
        // Output Terminals (Bottom)
        { id: 'L_OUT', label: 'L Out', x: 20, y: 90, type: 'L' },
        { id: 'E_OUT', label: 'E Out', x: 40, y: 90, type: 'E' },
        { id: 'N_OUT', label: 'N Out', x: 60, y: 90, type: 'N' },
    ],
    initialState: {},
    getInternalConnections: () => [['L_IN', 'L_OUT'], ['N_IN', 'N_OUT'], ['E_IN', 'E_OUT']],
  },
  CONNECTOR_BLOCK: {
    type: 'CONNECTOR_BLOCK',
    name: 'Connector Block',
    category: 'connection',
    width: 16,
    height: 40,
    terminals: [
      { id: 'T1', label: '1', x: 8, y: 0, type: 'Generic' },
      { id: 'T2', label: '2', x: 8, y: 40, type: 'Generic' },
    ],
    initialState: {},
    getInternalConnections: () => [['T1', 'T2']],
  },
  BAR_NEUTRAL: {
    type: 'BAR_NEUTRAL',
    name: 'Neutral Bar (5T)',
    category: 'connection',
    width: 140,
    height: 40,
    terminals: [
      { id: 'T1', label: '1', x: 20, y: 20, type: 'N' },
      { id: 'T2', label: '2', x: 45, y: 20, type: 'N' },
      { id: 'T3', label: '3', x: 70, y: 20, type: 'N' },
      { id: 'T4', label: '4', x: 95, y: 20, type: 'N' },
      { id: 'T5', label: '5', x: 120, y: 20, type: 'N' },
    ],
    initialState: {},
    getInternalConnections: () => [['T1', 'T2'], ['T2', 'T3'], ['T3', 'T4'], ['T4', 'T5']],
  },
  BAR_EARTH: {
    type: 'BAR_EARTH',
    name: 'Earth Bar (5T)',
    category: 'connection',
    width: 140,
    height: 40,
    terminals: [
      { id: 'T1', label: '1', x: 20, y: 20, type: 'E' },
      { id: 'T2', label: '2', x: 45, y: 20, type: 'E' },
      { id: 'T3', label: '3', x: 70, y: 20, type: 'E' },
      { id: 'T4', label: '4', x: 95, y: 20, type: 'E' },
      { id: 'T5', label: '5', x: 120, y: 20, type: 'E' },
    ],
    initialState: {},
    getInternalConnections: () => [['T1', 'T2'], ['T2', 'T3'], ['T3', 'T4'], ['T4', 'T5']],
  },
};
