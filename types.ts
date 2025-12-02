

export type WireColor = 'brown' | 'blue' | 'green' | 'black' | 'grey';

export interface Position {
  x: number;
  y: number;
}

export type ComponentCategory = 'supply' | 'protection' | 'control' | 'load' | 'connection' | 'tester';

export interface TerminalDef {
  id: string;
  label: string;
  x: number; // Relative x (0-100 or pixels)
  y: number; // Relative y
  type: 'L' | 'N' | 'E' | 'Generic';
}

export interface ComponentDef {
  type: string;
  name: string;
  category: ComponentCategory;
  width: number;
  height: number;
  terminals: TerminalDef[];
  // Defines internal connections based on state (e.g., switch closed)
  getInternalConnections?: (state: any) => Array<[string, string]>;
  initialState?: any;
  // Engineering Properties
  rating?: number; // Amps (for Protection devices)
  loadWatts?: number; // Watts (for Loads)
}

export interface ComponentInstance {
  id: string;
  type: string;
  position: Position;
  rotation: number; // 0, 90, 180, 270
  state: any; // e.g., { isOn: boolean, isTripped: boolean }
  status?: {
    energized?: boolean;
    fault?: string;
  };
  // For portable devices with a plug
  plugPosition?: Position; 
  pluggedSocketId?: string; // ID of the socket this device is plugged into
  
  // Instance specific properties (User overrides)
  properties?: {
    label?: string; // Custom Name
    rating?: number; // Override Amps
    watts?: number; // Override Watts
    [key: string]: any;
  };
}

export interface Wire {
  id: string;
  fromCompId: string;
  fromTerminal: string;
  toCompId: string;
  toTerminal: string;
  color: WireColor;
  sleeving?: WireColor; // New property for wire sleeving
  
  // Geometry control
  orientation: 'vertical' | 'horizontal';
  handlePos: number; // If vertical: X coordinate. If horizontal: Y coordinate.

  // Adjustable stub lengths for start/end segments
  startStubLength?: number;
  endStubLength?: number;
}

export interface SimulationResult {
  energizedComponents: Set<string>; // IDs of components receiving proper power
  trippedBreakers: Set<string>; // IDs of breakers that tripped
  errors: string[];
  flowingWires: Map<string, boolean>; // Wire ID -> direction
  nodePotentials: Map<string, string>; // Map of NodeId -> Potential Type ('L1','L2','L3','L','N','E')
}

export interface MultimeterState {
  visible: boolean;
  position: Position;
  mode: 'VOLTAGE' | 'CURRENT';
  redProbeNode: string | null; // NodeID (compId:termId)
  blackProbeNode: string | null; // NodeID
  clampedWireId: string | null; // WireID
  redProbePosition?: Position; // World Coordinates if placed freely
  blackProbePosition?: Position; // World Coordinates if placed freely
}