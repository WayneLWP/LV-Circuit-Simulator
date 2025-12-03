
import { ComponentInstance, Wire, ComponentDef, SimulationResult } from '../types';
import { COMPONENT_CATALOG } from '../constants';

// A node is uniquely identified by componentId:terminalId
type NodeId = string; 

const getNodeId = (compId: string, termId: string) => `${compId}:${termId}`;

export const runSimulation = (
  components: ComponentInstance[],
  wires: Wire[]
): SimulationResult => {
  const energizedComponents = new Set<string>();
  const trippedBreakers = new Set<string>();
  const errors: string[] = [];
  const flowingWires = new Map<string, boolean>();
  // Updated potential types: 'L' (generic single phase), 'L1', 'L2', 'L3', 'N', 'E'
  const nodePotentials = new Map<string, string>();

  // 1. Build Adjacency Graph
  // Map<NodeId, NodeId[]>
  const graph = new Map<NodeId, NodeId[]>();

  const addEdge = (n1: NodeId, n2: NodeId) => {
    if (!graph.has(n1)) graph.set(n1, []);
    if (!graph.has(n2)) graph.set(n2, []);
    graph.get(n1)!.push(n2);
    graph.get(n2)!.push(n1);
  };

  // Add Wire Connections
  wires.forEach(w => {
    addEdge(getNodeId(w.fromCompId, w.fromTerminal), getNodeId(w.toCompId, w.toTerminal));
  });

  // Add Internal Component Connections
  components.forEach(comp => {
    const def = COMPONENT_CATALOG[comp.type];
    if (def.getInternalConnections) {
      const internals = def.getInternalConnections(comp.state);
      internals.forEach(([t1, t2]) => {
        addEdge(getNodeId(comp.id, t1), getNodeId(comp.id, t2));
      });
    }

    // --- Special Logic for Plugged Connections ---
    if (comp.type === 'FAN_PLUG' && comp.pluggedSocketId) {
        const socket = components.find(c => c.id === comp.pluggedSocketId);
        if (socket) {
             let isSocketActive = false;
             let lTerm = 'L';
             let nTerm = 'N';

             // Different socket types have different internal logic for the plug
             if (socket.type === 'SOCKET_SINGLE' || socket.type === 'SOCKET_DOUBLE') {
                 isSocketActive = socket.state.isOn;
                 // Standard socket has terminals L, N, E
             } else if (socket.type === 'SWITCH_COOKER') {
                 // Cooker Unit Socket taps off the supply input directly, controlled by its own switch
                 isSocketActive = socket.state.isSocketOn;
                 lTerm = 'L_IN'; 
                 nTerm = 'N_IN';
             }

             if (isSocketActive) {
                 // Connect Socket L/N/E to Fan L/N/E
                 addEdge(getNodeId(socket.id, lTerm), getNodeId(comp.id, 'L'));
                 addEdge(getNodeId(socket.id, nTerm), getNodeId(comp.id, 'N'));
                 addEdge(getNodeId(socket.id, 'E'), getNodeId(comp.id, 'E'));
             }
        }
    }
  });

  // 2. Identify Sources
  // Now supports multiple sources (AC or 3PH)
  const activeSources = components.filter(c => 
    (c.type === 'SOURCE_AC' || c.type === 'SOURCE_3PH') && c.state.isOn
  );

  if (activeSources.length === 0) {
    return { energizedComponents, trippedBreakers, errors, flowingWires, nodePotentials };
  }

  // 3. Propagate Potentials & Calculate Distance (BFS)
  
  const explore = (startNodes: NodeId[], potentialType: string): { visited: Set<NodeId>, dist: Map<NodeId, number> } => {
    const visited = new Set<NodeId>();
    const dist = new Map<NodeId, number>();
    const queue: NodeId[] = [];
    
    startNodes.forEach(node => {
        visited.add(node);
        dist.set(node, 0);
        nodePotentials.set(node, potentialType); // Mark potential
        queue.push(node);
    });

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const d = dist.get(curr)!;
      const neighbors = graph.get(curr) || [];
      for (const next of neighbors) {
        if (!visited.has(next)) {
          visited.add(next);
          dist.set(next, d + 1);
          nodePotentials.set(next, potentialType); // Propagate potential
          queue.push(next);
        }
      }
    }
    return { visited, dist };
  };

  // Collect seeds from all active sources
  const liveSeeds: NodeId[] = [];
  const l1Seeds: NodeId[] = [];
  const l2Seeds: NodeId[] = [];
  const l3Seeds: NodeId[] = [];
  const neutralSeeds: NodeId[] = [];
  const earthSeeds: NodeId[] = [];

  activeSources.forEach(src => {
      if (src.type === 'SOURCE_AC') {
          liveSeeds.push(getNodeId(src.id, 'L'));
          neutralSeeds.push(getNodeId(src.id, 'N'));
          earthSeeds.push(getNodeId(src.id, 'E'));
      } else if (src.type === 'SOURCE_3PH') {
          l1Seeds.push(getNodeId(src.id, 'L1'));
          l2Seeds.push(getNodeId(src.id, 'L2'));
          l3Seeds.push(getNodeId(src.id, 'L3'));
          neutralSeeds.push(getNodeId(src.id, 'N'));
          earthSeeds.push(getNodeId(src.id, 'E'));
      }
      // Source itself is energized
      energizedComponents.add(src.id);
  });

  // Explore independent potentials. Order matters for overwriting (though ideally wires shouldn't mix phases without shorts)
  // We explore specific phases first.
  const l1Result = explore(l1Seeds, 'L1');
  const l2Result = explore(l2Seeds, 'L2');
  const l3Result = explore(l3Seeds, 'L3');
  const lResult = explore(liveSeeds, 'L');
  const nResult = explore(neutralSeeds, 'N');
  const eResult = explore(earthSeeds, 'E');

  const neutralNodes = nResult.visited;
  const earthNodes = eResult.visited;
  
  // Combine all Live nodes for generic energized checks
  const allLiveNodes = new Set([...l1Result.visited, ...l2Result.visited, ...l3Result.visited, ...lResult.visited]);

  // Use generic L distance for simple flow calculation (approximation for mixed sources)
  // For precise 3-phase flow, we'd need separate dist maps, but for this sim, we mostly care about Source -> Load direction.
  const combinedLiveDist = new Map([...l1Result.dist, ...l2Result.dist, ...l3Result.dist, ...lResult.dist]);
  const nDist = nResult.dist;

  // 4. Check for Faults (Dead Short L-N or L-E)
  // Check inter-phase shorts
  const shortL1L2 = [...l1Result.visited].some(n => l2Result.visited.has(n));
  const shortL2L3 = [...l2Result.visited].some(n => l3Result.visited.has(n));
  const shortL3L1 = [...l3Result.visited].some(n => l1Result.visited.has(n));
  const shortLN = [...allLiveNodes].some(node => neutralNodes.has(node));
  const shortLE = [...allLiveNodes].some(node => earthNodes.has(node));

  if (shortL1L2 || shortL2L3 || shortL3L1) errors.push("Phase-Phase Short Circuit!");
  if (shortLN) errors.push("Short Circuit Detected (L-N)!");
  if (shortLE) errors.push("Earth Fault Detected (L-E)!");

  if (shortLN || shortLE || shortL1L2 || shortL2L3 || shortL3L1) {
    components.forEach(c => {
        // Simple logic: Trip everything if massive fault
      if ((c.type === 'MCB' || c.type === 'RCD' || c.type === 'SWITCH_FUSED') && c.state.isOn) {
        trippedBreakers.add(c.id);
      }
    });
    // Stop flow calc on fault
    return { energizedComponents: new Set(), trippedBreakers, errors, flowingWires, nodePotentials };
  }

  // 5. Determine Energized Loads
  components.forEach(comp => {
    let isEnergized = false;
    // Check based on Component Type logic
    // Simplified: Needs L (any phase) and N
    // For 3-phase motors (future), would need L1+L2+L3. 
    // Here we support standard single phase loads.

    const checkSinglePhase = (lTerm: string, nTerm: string) => {
        const lNode = getNodeId(comp.id, lTerm);
        const nNode = getNodeId(comp.id, nTerm);
        return allLiveNodes.has(lNode) && neutralNodes.has(nNode);
    };

    if (comp.type === 'LAMP_PENDANT' || comp.type === 'SOCKET_DOUBLE' || comp.type === 'SOCKET_SINGLE' || comp.type === 'FAN' || comp.type === 'FAN_PLUG') {
        if (checkSinglePhase('L', 'N')) isEnergized = true;
    } 
    else if (comp.type === 'SWITCH_COOKER') {
         if (checkSinglePhase('L_IN', 'N_IN')) isEnergized = true;
    }

    if (isEnergized) {
      energizedComponents.add(comp.id);
    }
  });

  // 6. Calculate Flowing Wires
  if (energizedComponents.size > activeSources.length) { 
      wires.forEach(w => {
        const u = getNodeId(w.fromCompId, w.fromTerminal);
        const v = getNodeId(w.toCompId, w.toTerminal);

        // Check if wire is on the LIVE side (Any Phase)
        if (allLiveNodes.has(u) && allLiveNodes.has(v)) {
            const d1 = combinedLiveDist.get(u);
            const d2 = combinedLiveDist.get(v);
            if (d1 !== undefined && d2 !== undefined && d1 !== d2) {
                flowingWires.set(w.id, d1 < d2);
            }
        }
        // Check if wire is on the NEUTRAL side
        else if (neutralNodes.has(u) && neutralNodes.has(v)) {
            const d1 = nDist.get(u);
            const d2 = nDist.get(v);
            if (d1 !== undefined && d2 !== undefined && d1 !== d2) {
                flowingWires.set(w.id, d1 > d2);
            }
        }
      });
  }

  return { energizedComponents, trippedBreakers, errors, flowingWires, nodePotentials };
};
