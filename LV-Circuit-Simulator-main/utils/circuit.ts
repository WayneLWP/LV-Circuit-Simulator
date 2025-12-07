
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
  const uniqueErrors = new Set<string>(); // Use Set to prevent duplicate messages
  const flowingWires = new Map<string, boolean>();
  const nodePotentials = new Map<string, string>();

  // 1. Build Adjacency Graph
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

  // 2. Identify Sources and Root Nodes
  const activeSources = components.filter(c => 
    (c.type === 'SOURCE_AC' || c.type === 'SOURCE_3PH') && c.state.isOn
  );

  if (activeSources.length === 0) {
    return { energizedComponents, trippedBreakers, errors: [], flowingWires, nodePotentials };
  }

  const liveSeeds: NodeId[] = [];
  const neutralSeeds: NodeId[] = [];
  const earthSeeds: NodeId[] = [];

  // Helper to trace connectivity from roots
  const findConnectedSet = (roots: NodeId[]): Set<NodeId> => {
      const visited = new Set<NodeId>();
      const queue = [...roots];
      roots.forEach(r => visited.add(r));
      
      while(queue.length > 0) {
          const curr = queue.shift()!;
          const neighbors = graph.get(curr) || [];
          for (const next of neighbors) {
              if (!visited.has(next)) {
                  visited.add(next);
                  queue.push(next);
              }
          }
      }
      return visited;
  };

  // Collect Source Roots
  activeSources.forEach(src => {
      if (src.type === 'SOURCE_AC') {
          liveSeeds.push(getNodeId(src.id, 'L'));
          neutralSeeds.push(getNodeId(src.id, 'N'));
          earthSeeds.push(getNodeId(src.id, 'E'));
      } else if (src.type === 'SOURCE_3PH') {
          liveSeeds.push(getNodeId(src.id, 'L1'), getNodeId(src.id, 'L2'), getNodeId(src.id, 'L3'));
          neutralSeeds.push(getNodeId(src.id, 'N'));
          earthSeeds.push(getNodeId(src.id, 'E'));
      }
      energizedComponents.add(src.id);
  });

  // Also include Earthing Bars as roots for "Grounded" check
  components.filter(c => c.type === 'BAR_EARTH').forEach(c => {
      // Treat entire bar as grounded if connected to source (handled by graph), 
      // but for "Short to Earth", anything connected to any earth terminal is relevant.
      // However, we strictly care about return paths to source earth.
      // So we stick to propagation from Source E.
  });

  // 3. Propagate Potentials
  const groundedNodes = findConnectedSet(earthSeeds);
  const neutralReturnNodes = findConnectedSet(neutralSeeds);
  // Note: 'liveNodes' in a global sense is messy with breakers. We calculate potential locally below.

  // 4. Check Breaker Faults (Downstream Checks)
  
  // Helper: BFS from a start node, BUT refuse to cross a specific 'blocked' node.
  // Returns true if targetSet is reached.
  const checksDownstreamConnection = (startNode: NodeId, blockedNode: NodeId, targetSet: Set<NodeId>): boolean => {
      const queue = [startNode];
      const visited = new Set<NodeId>([startNode]);
      
      while(queue.length > 0) {
          const curr = queue.shift()!;
          if (targetSet.has(curr)) return true;
          
          const neighbors = graph.get(curr) || [];
          for (const next of neighbors) {
              if (next !== blockedNode && !visited.has(next)) {
                  visited.add(next);
                  queue.push(next);
              }
          }
      }
      return false;
  };

  components.forEach(c => {
      if (c.state.isOn) {
          // --- RCD Logic (Earth Leakage & Short Circuit) ---
          if (c.type === 'RCD') {
              const lOut = getNodeId(c.id, 'L_OUT');
              const lIn = getNodeId(c.id, 'L_IN');
              const nOut = getNodeId(c.id, 'N_OUT');
              const nIn = getNodeId(c.id, 'N_IN');

              // 1. Earth Fault Check (Leakage to Earth)
              // We block the path back to supply to ensure we are checking the downstream circuit.
              const leakageL = checksDownstreamConnection(lOut, lIn, groundedNodes);
              const leakageN = checksDownstreamConnection(nOut, nIn, groundedNodes);

              if (leakageL || leakageN) {
                  trippedBreakers.add(c.id);
                  uniqueErrors.add("Earth Fault");
              }

              // 2. Short Circuit Check (L to N)
              // Even though RCDs primarily detect earth faults, in this sim (and RCBOs) they trip on shorts.
              // Check if L_OUT connects to Neutral Return Nodes (which includes N_IN -> Source N).
              // We block L_IN to ensure the path is downstream (L_OUT -> Load -> N_OUT -> N_IN).
              const shortLN = checksDownstreamConnection(lOut, lIn, neutralReturnNodes);
              if (shortLN) {
                  trippedBreakers.add(c.id);
                  uniqueErrors.add("Short Circuit");
              }
          }
          
          // --- MCB / Fused Switch Logic (Short Circuit) ---
          if (c.type === 'MCB' || c.type === 'SWITCH_FUSED') {
              let outTerm = 'OUT'; 
              let inTerm = 'IN';
              if (c.type === 'SWITCH_FUSED') { outTerm = 'L_OUT'; inTerm = 'L_IN'; }

              const outNode = getNodeId(c.id, outTerm);
              const inNode = getNodeId(c.id, inTerm);

              // Check Short to Neutral (L-N Short)
              const shortToNeutral = checksDownstreamConnection(outNode, inNode, neutralReturnNodes);
              // Check Short to Earth (L-E Short - also an overcurrent condition)
              const shortToEarth = checksDownstreamConnection(outNode, inNode, groundedNodes);

              if (shortToNeutral || shortToEarth) {
                  trippedBreakers.add(c.id);
                  uniqueErrors.add("Short Circuit");
              }
          }
      }
  });

  // Stop simulation if breakers tripped
  if (trippedBreakers.size > 0) {
      return { energizedComponents: new Set(), trippedBreakers, errors: Array.from(uniqueErrors), flowingWires: new Map(), nodePotentials: new Map() };
  }

  // 5. Determine Energized Loads & Flow (Standard Simulation)
  
  // Re-run simple potential propagation for visualization
  // Use generic potential tags
  const potentialMap = new Map<string, string>();
  groundedNodes.forEach(n => potentialMap.set(n, 'E'));
  neutralReturnNodes.forEach(n => potentialMap.set(n, 'N'));
  
  // For Live, we need to propagate through closed switches from Source L
  // We can't just use a global set because breakers might be OFF (handled by graph), 
  // but we want to know specific phases if possible.
  
  // Simple L propagation
  const lQueue = [...liveSeeds];
  const lVisited = new Set<NodeId>();
  lQueue.forEach(n => {
      lVisited.add(n);
      potentialMap.set(n, 'L');
  });
  
  // Calculate distance for flow animation direction
  const distMap = new Map<NodeId, number>();
  lQueue.forEach(n => distMap.set(n, 0));

  while(lQueue.length > 0) {
      const curr = lQueue.shift()!;
      const d = distMap.get(curr)!;
      const neighbors = graph.get(curr) || [];
      for(const next of neighbors) {
          if (!lVisited.has(next)) {
              lVisited.add(next);
              potentialMap.set(next, 'L'); // Simplified single phase L
              distMap.set(next, d + 1);
              lQueue.push(next);
          }
      }
  }

  // Neutral distance for return flow
  const nQueue = [...neutralSeeds];
  const nVisited = new Set<NodeId>();
  const nDistMap = new Map<NodeId, number>();
  nQueue.forEach(n => {
      nVisited.add(n);
      nDistMap.set(n, 0);
  });
  
  while(nQueue.length > 0) {
      const curr = nQueue.shift()!;
      const d = nDistMap.get(curr)!;
      const neighbors = graph.get(curr) || [];
      for(const next of neighbors) {
          if (!nVisited.has(next)) {
              nVisited.add(next);
              nDistMap.set(next, d + 1);
              nQueue.push(next);
          }
      }
  }

  // Check Component Energization
  // We only enable flow for wires that supply an ACTIVELY ENERGIZED LOAD.
  // This avoids showing flow in open circuits (which have potential but no current).
  const loadLNodes = new Set<NodeId>();
  const loadNNodes = new Set<NodeId>();

  components.forEach(comp => {
    let isEnergized = false;
    const checkPhases = (lTerm: string, nTerm: string) => {
        const lNode = getNodeId(comp.id, lTerm);
        const nNode = getNodeId(comp.id, nTerm);
        return lVisited.has(lNode) && nVisited.has(nNode);
    };

    const def = COMPONENT_CATALOG[comp.type];
    
    // Only loads consume power
    if (def.category === 'load' || comp.type === 'SWITCH_COOKER') {
        if (comp.type === 'SWITCH_COOKER') {
             if (checkPhases('L_IN', 'N_IN')) {
                 isEnergized = true;
                 loadLNodes.add(getNodeId(comp.id, 'L_IN'));
                 loadNNodes.add(getNodeId(comp.id, 'N_IN'));
             }
        } else {
             if (checkPhases('L', 'N')) {
                 isEnergized = true;
                 loadLNodes.add(getNodeId(comp.id, 'L'));
                 loadNNodes.add(getNodeId(comp.id, 'N'));
             }
        }
    }

    if (isEnergized) {
      energizedComponents.add(comp.id);
    }
  });

  // --- Trace Flow Backwards from Loads to Source to mark ACTIVE wires ---
  // If a wire is voltage-live but not feeding a load, it shouldn't show flow animation.
  
  const lFlowVisited = new Set<NodeId>(loadLNodes);
  const lFlowQueue = Array.from(loadLNodes);

  while(lFlowQueue.length > 0) {
      const curr = lFlowQueue.shift()!;
      const d = distMap.get(curr)!;
      const neighbors = graph.get(curr) || [];
      
      neighbors.forEach(next => {
          // Go "upstream" (lower distance to source)
          if (lVisited.has(next)) {
              const nd = distMap.get(next)!;
              if (nd < d && !lFlowVisited.has(next)) {
                  lFlowVisited.add(next);
                  lFlowQueue.push(next);
              }
          }
      });
  }

  const nFlowVisited = new Set<NodeId>(loadNNodes);
  const nFlowQueue = Array.from(loadNNodes);

  while(nFlowQueue.length > 0) {
      const curr = nFlowQueue.shift()!;
      const d = nDistMap.get(curr)!;
      const neighbors = graph.get(curr) || [];
      
      neighbors.forEach(next => {
          // Go "upstream" (lower distance to source N)
          if (nVisited.has(next)) {
              const nd = nDistMap.get(next)!;
              if (nd < d && !nFlowVisited.has(next)) {
                  nFlowVisited.add(next);
                  nFlowQueue.push(next);
              }
          }
      });
  }

  // Determine Flowing Wires based on Active Trace
  wires.forEach(w => {
      const u = getNodeId(w.fromCompId, w.fromTerminal);
      const v = getNodeId(w.toCompId, w.toTerminal);
      
      // Live Flow (only if on active path)
      if (lFlowVisited.has(u) && lFlowVisited.has(v)) {
          const d1 = distMap.get(u);
          const d2 = distMap.get(v);
          if (d1 !== undefined && d2 !== undefined && d1 !== d2) {
              flowingWires.set(w.id, d1 < d2);
          }
      }
      // Neutral Return Flow (only if on active path)
      else if (nFlowVisited.has(u) && nFlowVisited.has(v)) {
          const d1 = nDistMap.get(u);
          const d2 = nDistMap.get(v);
          if (d1 !== undefined && d2 !== undefined && d1 !== d2) {
              flowingWires.set(w.id, d1 > d2); // Flow towards source (smaller dist)
          }
      }
  });

  return { energizedComponents, trippedBreakers, errors: Array.from(uniqueErrors), flowingWires, nodePotentials: potentialMap };
};
