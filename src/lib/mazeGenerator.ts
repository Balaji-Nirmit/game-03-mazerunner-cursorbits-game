export type Cell = {
  x: number;
  z: number;
  walls: { north: boolean; south: boolean; east: boolean; west: boolean };
  visited: boolean;
};

export type MazeGrid = Cell[][];

export function generateMaze(width: number, height: number): MazeGrid {
  const grid: MazeGrid = [];

  for (let x = 0; x < width; x++) {
    grid[x] = [];
    for (let z = 0; z < height; z++) {
      grid[x][z] = {
        x,
        z,
        walls: { north: true, south: true, east: true, west: true },
        visited: false,
      };
    }
  }

  const stack: Cell[] = [];
  const start = grid[0][0];
  start.visited = true;
  stack.push(start);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(current, grid, width, height);

    if (neighbors.length === 0) {
      stack.pop();
    } else {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      removeWall(current, next);
      next.visited = true;
      stack.push(next);
    }
  }

  return grid;
}

function getUnvisitedNeighbors(cell: Cell, grid: MazeGrid, w: number, h: number): Cell[] {
  const { x, z } = cell;
  const neighbors: Cell[] = [];
  if (z > 0 && !grid[x][z - 1].visited) neighbors.push(grid[x][z - 1]);
  if (z < h - 1 && !grid[x][z + 1].visited) neighbors.push(grid[x][z + 1]);
  if (x > 0 && !grid[x - 1][z].visited) neighbors.push(grid[x - 1][z]);
  if (x < w - 1 && !grid[x + 1][z].visited) neighbors.push(grid[x + 1][z]);
  return neighbors;
}

function removeWall(a: Cell, b: Cell) {
  const dx = a.x - b.x;
  const dz = a.z - b.z;
  if (dx === 1) { a.walls.west = false; b.walls.east = false; }
  if (dx === -1) { a.walls.east = false; b.walls.west = false; }
  if (dz === 1) { a.walls.north = false; b.walls.south = false; }
  if (dz === -1) { a.walls.south = false; b.walls.north = false; }
}

export type WallSegment = {
  id: string;
  x: number;
  z: number;
  rotationY: number;
};

export function getWallSegments(grid: MazeGrid, cellSize: number): WallSegment[] {
  const walls: WallSegment[] = [];
  const width = grid.length;
  const height = grid[0].length;

  for (let x = 0; x < width; x++) {
    for (let z = 0; z < height; z++) {
      const cell = grid[x][z];
      const cx = x * cellSize;
      const cz = z * cellSize;
      const half = cellSize / 2;

      if (cell.walls.north) {
        walls.push({ id: `${x}-${z}-n`, x: cx, z: cz - half, rotationY: 0 });
      }
      if (cell.walls.south) {
        walls.push({ id: `${x}-${z}-s`, x: cx, z: cz + half, rotationY: 0 });
      }
      if (cell.walls.east) {
        walls.push({ id: `${x}-${z}-e`, x: cx + half, z: cz, rotationY: Math.PI / 2 });
      }
      if (cell.walls.west) {
        walls.push({ id: `${x}-${z}-w`, x: cx - half, z: cz, rotationY: Math.PI / 2 });
      }
    }
  }

  // Deduplicate walls at same position+rotation
  const seen = new Set<string>();
  return walls.filter((w) => {
    const key = `${w.x.toFixed(1)}_${w.z.toFixed(1)}_${w.rotationY.toFixed(2)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
