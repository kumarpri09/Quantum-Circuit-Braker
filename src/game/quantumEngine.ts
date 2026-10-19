// Quantum Circuit Breaker Game Engine & Resonance Routing Algorithm

export type NodeType = 'empty' | 'emitter' | 'receiver' | 'mirror' | 'splitter' | 'phase' | 'barrier';
export type Direction = 0 | 1 | 2 | 3; // 0: Up, 1: Right, 2: Down, 3: Left

export interface CircuitNode {
  x: number;
  y: number;
  type: NodeType;
  rotation: Direction; // 0, 1, 2, 3
  color?: string; // For phase/frequency matching
  fixed?: boolean;
  energized?: boolean;
}

export interface LevelConfig {
  id: number;
  levelName: string;
  briefing: string;
  gridSize: number;
  timeLimit: number; // seconds
  targetResonance: number; // percentage of receivers needed
  nodes: CircuitNode[];
}

export const CAMPAIGN_LEVELS: LevelConfig[] = [
  {
    id: 1,
    levelName: "01. First Light Matrix",
    briefing: "Calibrate the quantum emitter and align the reflective mirror to energize the primary receiver core.",
    gridSize: 5,
    timeLimit: 60,
    targetResonance: 100,
    nodes: [
      { x: 0, y: 2, type: 'emitter', rotation: 1, fixed: true },
      { x: 3, y: 2, type: 'mirror', rotation: 3 },
      { x: 3, y: 4, type: 'receiver', rotation: 0, fixed: true }
    ]
  },
  {
    id: 2,
    levelName: "02. Dual Refraction",
    briefing: "Use dual mirrors to navigate around quantum containment barriers and reach the upper receiver.",
    gridSize: 5,
    timeLimit: 75,
    targetResonance: 100,
    nodes: [
      { x: 0, y: 4, type: 'emitter', rotation: 0, fixed: true },
      { x: 0, y: 1, type: 'mirror', rotation: 1 },
      { x: 4, y: 1, type: 'mirror', rotation: 2 },
      { x: 4, y: 4, type: 'receiver', rotation: 0, fixed: true },
      { x: 2, y: 2, type: 'barrier', rotation: 0, fixed: true }
    ]
  },
  {
    id: 3,
    levelName: "03. Quantum Splitter Array",
    briefing: "Deploy a beam splitter to divide the quantum flux into two concurrent pathways and activate dual receivers.",
    gridSize: 6,
    timeLimit: 90,
    targetResonance: 100,
    nodes: [
      { x: 2, y: 5, type: 'emitter', rotation: 0, fixed: true },
      { x: 2, y: 3, type: 'splitter', rotation: 0 },
      { x: 0, y: 3, type: 'receiver', rotation: 0, fixed: true },
      { x: 5, y: 3, type: 'receiver', rotation: 0, fixed: true },
      { x: 2, y: 1, type: 'barrier', rotation: 0, fixed: true }
    ]
  },
  {
    id: 4,
    levelName: "04. Phase Shifter Resonance",
    briefing: "Pass the quantum beam through a phase shifter to match the frequency required by the encrypted receiver core.",
    gridSize: 6,
    timeLimit: 90,
    targetResonance: 100,
    nodes: [
      { x: 0, y: 0, type: 'emitter', rotation: 1, fixed: true },
      { x: 3, y: 0, type: 'phase', rotation: 0 },
      { x: 5, y: 0, type: 'mirror', rotation: 2 },
      { x: 5, y: 3, type: 'receiver', rotation: 0, fixed: true }
    ]
  },
  {
    id: 5,
    levelName: "05. Singularity Grid",
    briefing: "Expert level quantum routing. Coordinate splitters, mirrors, and phase shifters under strict temporal decay.",
    gridSize: 7,
    timeLimit: 120,
    targetResonance: 100,
    nodes: [
      { x: 0, y: 3, type: 'emitter', rotation: 1, fixed: true },
      { x: 3, y: 3, type: 'splitter', rotation: 0 },
      { x: 3, y: 1, type: 'mirror', rotation: 1 },
      { x: 6, y: 1, type: 'receiver', rotation: 0, fixed: true },
      { x: 3, y: 5, type: 'mirror', rotation: 2 },
      { x: 6, y: 5, type: 'receiver', rotation: 0, fixed: true },
      { x: 3, y: 3, type: 'phase', rotation: 0, fixed: false }
    ]
  }
];

export interface BeamSegment {
  x: number;
  y: number;
  dir: Direction;
}

export class QuantumEngine {
  gridSize: number;
  nodes: Map<string, CircuitNode> = new Map();
  activeBeams: BeamSegment[] = [];
  energizedReceivers: Set<string> = new Set();
  totalReceivers: number = 0;

  constructor(level: LevelConfig) {
    this.gridSize = level.gridSize;
    this.loadLevel(level);
  }

  loadLevel(level: LevelConfig) {
    this.nodes.clear();
    this.totalReceivers = 0;
    for (let node of level.nodes) {
      this.nodes.set(`${node.x},${node.y}`, { ...node });
      if (node.type === 'receiver') {
        this.totalReceivers++;
      }
    }
  }

  rotateNode(x: number, y: number): boolean {
    const key = `${x},${y}`;
    const node = this.nodes.get(key);
    if (node && !node.fixed && node.type !== 'empty') {
      node.rotation = ((node.rotation + 1) % 4) as Direction;
      this.nodes.set(key, node);
      this.simulate();
      return true;
    }
    return false;
  }

  simulate() {
    this.activeBeams = [];
    this.energizedReceivers.clear();

    // Reset all node energized states
    this.nodes.forEach((node) => {
      node.energized = false;
    });

    // Find all emitters
    const emitters: CircuitNode[] = [];
    this.nodes.forEach((node) => {
      if (node.type === 'emitter') {
        emitters.push(node);
      }
    });

    // Trace beams from each emitter
    for (const emitter of emitters) {
      this.traceBeam(emitter.x, emitter.y, emitter.rotation, new Set());
    }
  }

  private traceBeam(startX: number, startY: number, startDir: Direction, visitedPaths: Set<string>) {
    let cx = startX;
    let cy = startY;
    let cdir = startDir;

    // Direction vectors: 0: Up (0,-1), 1: Right (1,0), 2: Down (0,1), 3: Left (-1,0)
    const dx = [0, 1, 0, -1];
    const dy = [-1, 0, 1, 0];

    // Move one step forward from emitter or previous node
    cx += dx[cdir];
    cy += dy[cdir];

    let maxSteps = this.gridSize * 3;
    let steps = 0;

    while (cx >= 0 && cx < this.gridSize && cy >= 0 && cy < this.gridSize && steps < maxSteps) {
      steps++;
      const pathKey = `${cx},${cy},${cdir}`;
      if (visitedPaths.has(pathKey)) break; // Prevent infinite loops
      visitedPaths.add(pathKey);

      this.activeBeams.push({ x: cx, y: cy, dir: cdir });

      const nodeKey = `${cx},${cy}`;
      const node = this.nodes.get(nodeKey);

      if (!node) {
        // Empty space, continue straight
        cx += dx[cdir];
        cy += dy[cdir];
        continue;
      }

      // Hit a node
      node.energized = true;

      if (node.type === 'receiver') {
        this.energizedReceivers.add(nodeKey);
        break; // Beam stops at receiver
      }

      if (node.type === 'barrier') {
        break; // Barrier blocks beam
      }

      if (node.type === 'mirror') {
        // Mirror reflection logic based on rotation
        // Rotation 0: reflects UP/RIGHT -> let's map standard 4-way reflections
        // Let's implement intuitive mirror deflection:
        // If coming from Down (2) and mirror rotation 0 (diag \), deflects to Right (1).
        // Standard reflection rule: exitDir = (3 - cdir + 2 * node.rotation) % 4 (or similar optics formula)
        // Let's use standard angle reflection:
        // rot 0 (\): Up->Left, Left->Up, Down->Right, Right->Down
        // rot 1 (/): Up->Right, Right->Up, Down->Left, Left->Down
        // Let's make it robust:
        let newDir = cdir;
        if (node.rotation === 0) {
          // \ mirror
          if (cdir === 0) newDir = 3; // Up -> Left
          else if (cdir === 1) newDir = 2; // Right -> Down
          else if (cdir === 2) newDir = 1; // Down -> Right
          else if (cdir === 3) newDir = 0; // Left -> Up
        } else if (node.rotation === 1) {
          // / mirror
          if (cdir === 0) newDir = 1; // Up -> Right
          else if (cdir === 1) newDir = 0; // Right -> Up
          else if (cdir === 2) newDir = 3; // Down -> Left
          else if (cdir === 3) newDir = 2; // Left -> Down
        } else if (node.rotation === 2) {
          // curved mirror or corner
          newDir = (cdir + 1) % 4;
        } else {
          newDir = (cdir + 3) % 4;
        }
        cdir = newDir as Direction;
        cx += dx[cdir];
        cy += dy[cdir];
        continue;
      }

      if (node.type === 'splitter') {
        // Splitter sends beam straight through AND perpendicular
        const perp1 = (cdir + 1) % 4;
        const perp2 = (cdir + 3) % 4;
        this.traceBeam(cx, cy, perp1 as Direction, new Set(visitedPaths));
        this.traceBeam(cx, cy, perp2 as Direction, new Set(visitedPaths));
        // Also continue straight
        cx += dx[cdir];
        cy += dy[cdir];
        continue;
      }

      if (node.type === 'phase') {
        // Phase shifter passes beam straight through with boosted energy
        cx += dx[cdir];
        cy += dy[cdir];
        continue;
      }

      // Default step
      cx += dx[cdir];
      cy += dy[cdir];
    }
  }

  isWon(): boolean {
    if (this.totalReceivers === 0) return false;
    return this.energizedReceivers.size >= this.totalReceivers;
  }
}
