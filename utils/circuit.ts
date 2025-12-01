

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
  const nodePotentials = new Map<string, 'L' | 'N' | 'E' | 'None'>();

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
        if (socket && socket.state.isOn) { // Only connect if socket switch is ON
             // Connect Socket L/N/E to Fan L/N/E
             // Note: Socket terminals in catalog are Supply side. We assume Socket Switch bridges Supply-L to Output-L.
             // But simplified model: we bridge Socket-Supply-L to Fan-L directly if isOn.
             addEdge(getNodeId(socket.id, 'L'), getNodeId(comp.id, 'L'));
             addEdge(getNodeId(socket.id, 'N'), getNodeId(comp.id, 'N'));
             addEdge(getNodeId(socket.id, 'E'), getNodeId(comp.id, 'E'));
        }
    }
  });

  // 2. Identify Sources
  const source = components.find(c => c.type === 'SOURCE_AC');
  if (!source || !source.state.isOn) {
    return { energizedComponents, trippedBreakers, errors, flowingWires, nodePotentials };
  }

  // 3. Propagate Potentials & Calculate Distance (BFS)
  // We calculate distance from source to determine flow direction.
  
  const explore = (startNode: NodeId): { visited: Set<NodeId>, dist: Map<NodeId, number> } => {
    const visited = new Set<NodeId>();
    const dist = new Map<NodeId, number>();
    const queue = [startNode];
    visited.add(startNode);
    dist.set(startNode, 0);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const d = dist.get(curr)!;
      const neighbors = graph.get(curr) || [];
      for (const next of neighbors) {
        if (!visited.has(next)) {
          visited.add(next);
          dist.set(next, d + 1);
          queue.push(next);
        }
      }
    }
    return { visited, dist };
  };

  const lResult = explore(getNodeId(source.id, 'L'));
  const nResult = explore(getNodeId(source.id, 'N'));
  const eResult = explore(getNodeId(source.id, 'E'));

  const liveNodes = lResult.visited;
  const neutralNodes = nResult.visited;
  const earthNodes = eResult.visited;

  const lDist = lResult.dist;
  const nDist = nResult.dist;

  // Fill Node Potentials
  // Order implies precedence if a node is connected to multiple potentials (Short Circuit)
  // We set Earth, then Neutral, then Live, so Live overwrites others in the map for visualization warning.
  earthNodes.forEach(n => nodePotentials.set(n, 'E'));
  neutralNodes.forEach(n => nodePotentials.set(n, 'N'));
  liveNodes.forEach(n => nodePotentials.set(n, 'L'));

  // 4. Check for Faults (Dead Short L-N or L-E)
  const shortLN = [...liveNodes].some(node => neutralNodes.has(node));
  const shortLE = [...liveNodes].some(node => earthNodes.has(node));

  if (shortLN) {
    errors.push("Short Circuit Detected (L-N)!");
    components.forEach(c => {
      if ((c.type === 'MCB' || c.type === 'RCD' || c.type === 'SWITCH_FUSED') && c.state.isOn) {
        trippedBreakers.add(c.id);
      }
    });
  }

  if (shortLE) {
    errors.push("Earth Fault Detected (L-E)!");
     components.forEach(c => {
      if ((c.type === 'RCD' || c.type === 'MCB') && c.state.isOn) {
        trippedBreakers.add(c.id);
      }
    });
  }

  if (shortLN || shortLE) {
    return { energizedComponents: new Set(), trippedBreakers, errors, flowingWires, nodePotentials };
  }

  // 5. Determine Energized Loads
  components.forEach(comp => {
    let isEnergized = false;
    const lNode = getNodeId(comp.id, 'L');
    const nNode = getNodeId(comp.id, 'N');

    if (comp.type === 'LAMP_PENDANT') {
        if (liveNodes.has(lNode) && neutralNodes.has(nNode)) isEnergized = true;
    } 
    else if (comp.type === 'SOCKET_DOUBLE' || comp.type === 'SOCKET_SINGLE' || comp.type === 'FAN' || comp.type === 'FAN_PLUG') {
        if (liveNodes.has(lNode) && neutralNodes.has(nNode)) isEnergized = true;
    }
    else if (comp.type === 'SOURCE_AC') {
      isEnergized = true;
    }

    if (isEnergized) {
      energizedComponents.add(comp.id);
    }
  });

  // 6. Calculate Flowing Wires
  // We only show flow if there is at least one load active (circuit is drawing current).
  
  if (energizedComponents.size > 1) { // >1 because Source is always "energized"
      wires.forEach(w => {
        const u = getNodeId(w.fromCompId, w.fromTerminal);
        const v = getNodeId(w.toCompId, w.toTerminal);

        // Check if wire is on the LIVE side
        // Flow is away from source (Low Dist -> High Dist)
        if (liveNodes.has(u) && liveNodes.has(v)) {
            const d1 = lDist.get(u);
            const d2 = lDist.get(v);
            if (d1 !== undefined && d2 !== undefined && d1 !== d2) {
                // Flow is Forward (from->to) if from is closer to source (d1 < d2)
                flowingWires.set(w.id, d1 < d2);
            }
        }
        // Check if wire is on the NEUTRAL side
        // Flow is towards Source N (High Dist -> Low Dist)
        else if (neutralNodes.has(u) && neutralNodes.has(v)) {
            const d1 = nDist.get(u);
            const d2 = nDist.get(v);
            if (d1 !== undefined && d2 !== undefined && d1 !== d2) {
                // Flow is Forward (from->to) if from is further from source N (d1 > d2)
                flowingWires.set(w.id, d1 > d2);
            }
        }
      });
  }

  return { energizedComponents, trippedBreakers, errors, flowingWires, nodePotentials };
};
