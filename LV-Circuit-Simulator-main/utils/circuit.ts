
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

  // 1. Build Adjacency Graph (High Impedance / Insulation Resistance View)
  // Loads are OPEN circuits here. Used for Short Circuit detection.
  const graph = new Map<NodeId, NodeId[]>();

  const addEdge = (n1: NodeId, n2: NodeId, targetGraph: Map<NodeId, NodeId[]> = graph) => {
    if (!targetGraph.has(n1)) targetGraph.set(n1, []);
    if (!targetGraph.has(n2)) targetGraph.set(n2, []);
    targetGraph.get(n1)!.push(n2);
    targetGraph.get(n2)!.push(n1);
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

    // --- Special Logic for Supply Earthing Arrangements ---
    if (comp.type === 'SOURCE_AC' || comp.type === 'SOURCE_3PH') {
        const earthing = comp.properties?.earthing || 'TN-C-S';
        
        if (earthing === 'TN-C-S') {
            // TN-C-S (PME): Neutral and Earth are combined (PEN) at the source.
            // Simulating a link between N and E terminals.
            addEdge(getNodeId(comp.id, 'N'), getNodeId(comp.id, 'E'));
        }
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

  // 1b. Build RCD Graph (Low Impedance / Circuit Path View)
  // Loads are CLOSED circuits (Resistors) here. Used for RCD Imbalance detection (Borrowed Neutral, etc).
  const rcdGraph = new Map<NodeId, NodeId[]>();
  
  // Clone basic structure
  for (const [node, neighbors] of graph.entries()) {
      rcdGraph.set(node, [...neighbors]);
  }

  // Helper to add to RCD graph specifically
  const addRcdEdge = (n1: NodeId, n2: NodeId) => {
      addEdge(n1, n2, rcdGraph);
  };

  // Add Internal Load Connections (Bridging L-N)
  components.forEach(comp => {
      const def = COMPONENT_CATALOG[comp.type];
      if (def.category === 'load') {
          // Heuristic: Connect first 'L' type terminal to first 'N' type terminal
          const lTerm = def.terminals.find(t => t.id === 'L' || t.id === 'L_IN' || t.id === 'L1');
          const nTerm = def.terminals.find(t => t.id === 'N' || t.id === 'N_IN');
          
          if (lTerm && nTerm) {
              addRcdEdge(getNodeId(comp.id, lTerm.id), getNodeId(comp.id, nTerm.id));
          }
      }
  });


  // 2. Identify Sources
  const activeSources = components.filter(c => 
    (c.type === 'SOURCE_AC' || c.type === 'SOURCE_3PH') && c.state.isOn
  );

  if (activeSources.length === 0) {
    return { energizedComponents, trippedBreakers, errors, flowingWires, nodePotentials };
  }

  // Identify all Source Terminals (The "Grid" / "Ground")
  const sourceTargets = new Set<string>();
  activeSources.forEach(src => {
      const def = COMPONENT_CATALOG[src.type];
      def.terminals.forEach(t => {
          sourceTargets.add(getNodeId(src.id, t.id));
      });
  });

  // 3. Propagate Potentials & Calculate Distance (BFS)
  // We use the basic 'graph' (Loads Open) to determine energization and shorts.
  
  const explore = (startNodes: NodeId[], potentialType: string): { visited: Set<NodeId>, dist: Map<NodeId, number> } => {
    const visited = new Set<NodeId>();
    const dist = new Map<NodeId, number>();
    const queue: NodeId[] = [];
    
    startNodes.forEach(node => {
        visited.add(node);
        dist.set(node, 0);
        nodePotentials.set(node, potentialType);
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
          nodePotentials.set(next, potentialType);
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
      energizedComponents.add(src.id);
  });

  const l1Result = explore(l1Seeds, 'L1');
  const l2Result = explore(l2Seeds, 'L2');
  const l3Result = explore(l3Seeds, 'L3');
  const lResult = explore(liveSeeds, 'L');
  const nResult = explore(neutralSeeds, 'N');
  const eResult = explore(earthSeeds, 'E');

  const neutralNodes = nResult.visited;
  const earthNodes = eResult.visited;
  const allLiveNodes = new Set([...l1Result.visited, ...l2Result.visited, ...l3Result.visited, ...lResult.visited]);
  const combinedLiveDist = new Map([...l1Result.dist, ...l2Result.dist, ...l3Result.dist, ...lResult.dist]);
  const nDist = nResult.dist;

  // 4. Check for Faults (Dead Short L-N or L-E)
  const shortL1L2 = [...l1Result.visited].some(n => l2Result.visited.has(n));
  const shortL2L3 = [...l2Result.visited].some(n => l3Result.visited.has(n));
  const shortL3L1 = [...l3Result.visited].some(n => l1Result.visited.has(n));
  const shortLN = [...allLiveNodes].some(node => neutralNodes.has(node));
  const shortLE = [...allLiveNodes].some(node => earthNodes.has(node));

  if (shortL1L2 || shortL2L3 || shortL3L1) errors.push("Phase-Phase Short Circuit!");
  if (shortLN) errors.push("Short Circuit Detected (L-N)!");
  if (shortLE) errors.push("Earth Fault Detected (L-E)!");

  // --- Helper: Path finding with avoidance ---
  const hasPathToSource = (startNode: string, avoidNodes: string[], graphToUse: Map<string, string[]>): boolean => {
      const q = [startNode];
      const visited = new Set<string>([startNode, ...avoidNodes]);
      
      while (q.length > 0) {
          const curr = q.shift()!;
          if (sourceTargets.has(curr)) return true;

          const neighbors = graphToUse.get(curr) || [];
          for (const next of neighbors) {
              if (!visited.has(next)) {
                  visited.add(next);
                  q.push(next);
              }
          }
      }
      return false;
  };

  // --- RCD Logic (Residual Current) ---
  // Runs ALWAYS to catch imbalances/leakages/N-E faults, regardless of Short Circuits.
  // Uses rcdGraph which sees through Loads.
  components.filter(c => c.type === 'RCD' && c.state.isOn).forEach(rcd => {
      const lIn = getNodeId(rcd.id, 'L_IN');
      const nIn = getNodeId(rcd.id, 'N_IN');
      const lOut = getNodeId(rcd.id, 'L_OUT');
      const nOut = getNodeId(rcd.id, 'N_OUT');
      
      const avoid = [lIn, nIn];
      
      // Check 1: Leakage from Line side
      // If L_OUT can find a way back to Source that DOESN'T go through L_IN or N_IN...
      // It implies current bypasses the RCD summation.
      if (hasPathToSource(lOut, avoid, rcdGraph)) {
          trippedBreakers.add(rcd.id);
          errors.push("RCD Trip: Imbalance (Line Leakage/Borrowed Neutral)!");
      }
      // Check 2: Imbalance from Neutral side
      // If N_OUT is connected to Source/Earth downstream, or receiving current from another circuit.
      else if (hasPathToSource(nOut, avoid, rcdGraph)) {
          trippedBreakers.add(rcd.id);
          errors.push("RCD Trip: Imbalance (Neutral Fault/Borrowed Neutral)!");
      }
  });

  // --- MCB Logic (Overcurrent) ---
  // Only runs if a global dead short is detected.
  // Uses standard graph (Loads Open) to find the low-impedance path.
  if (shortLN || shortLE || shortL1L2 || shortL2L3 || shortL3L1) {
    components.filter(c => (c.type === 'MCB' || c.type === 'SWITCH_FUSED') && c.state.isOn).forEach(dev => {
        const outTerm = dev.type === 'MCB' ? 'OUT' : 'L_OUT';
        const inTerm = dev.type === 'MCB' ? 'IN' : 'L_IN';
        
        const nodeOut = getNodeId(dev.id, outTerm);
        const nodeIn = getNodeId(dev.id, inTerm);

        // Check L-N Short (Downstream)
        if (hasPathToSource(nodeOut, [nodeIn], graph) && shortLN) {
             trippedBreakers.add(dev.id);
             errors.push(`${dev.type} Trip: Short Circuit!`);
        }
        
        // Check L-E Short
        if (shortLE) {
             if (hasPathToSource(nodeOut, [nodeIn], graph)) {
                 trippedBreakers.add(dev.id);
                 errors.push(`${dev.type} Trip: Earth Fault!`);
             }
        }
    });

    return { energizedComponents: new Set(), trippedBreakers, errors, flowingWires: new Map(), nodePotentials };
  }

  // 5. Determine Energized Loads (for visual feedback)
  components.forEach(comp => {
    let isEnergized = false;
    const checkSinglePhase = (lTerm: string, nTerm: string) => {
        const lNode = getNodeId(comp.id, lTerm);
        const nNode = getNodeId(comp.id, nTerm);
        return allLiveNodes.has(lNode) && neutralNodes.has(nNode);
    };

    if (['LAMP_PENDANT', 'SOCKET_DOUBLE', 'SOCKET_SINGLE', 'FAN', 'FAN_PLUG'].includes(comp.type)) {
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
