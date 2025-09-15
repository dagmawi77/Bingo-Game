import { BingoGrid } from './bingo'

export type WinPattern = 'row' | 'col' | 'diag' | 'corners' | 'full'

export type WinResult = {
  hasWin: boolean
  pattern?: WinPattern
  indices?: Array<[number, number]>
}

export function checkLineWin(grid: BingoGrid, marked: Set<number>): WinResult {
  // Helper to check if a cell is considered marked
  const isMarked = (r: number, c: number): boolean => {
    const cell = grid[r][c]
    return cell === 'FREE' || (typeof cell === 'number' && marked.has(cell))
  }

  // Rows
  for (let r = 0; r < 5; r++) {
    const indices: Array<[number, number]> = []
    let ok = true
    for (let c = 0; c < 5; c++) {
      if (!isMarked(r, c)) {
        ok = false
        break
      }
      indices.push([r, c])
    }
    if (ok) return { hasWin: true, pattern: 'row', indices }
  }

  // Columns
  for (let c = 0; c < 5; c++) {
    const indices: Array<[number, number]> = []
    let ok = true
    for (let r = 0; r < 5; r++) {
      if (!isMarked(r, c)) {
        ok = false
        break
      }
      indices.push([r, c])
    }
    if (ok) return { hasWin: true, pattern: 'col', indices }
  }

  // Diagonals
  {
    const indices: Array<[number, number]> = []
    let ok = true
    for (let i = 0; i < 5; i++) {
      if (!isMarked(i, i)) {
        ok = false
        break
      }
      indices.push([i, i])
    }
    if (ok) return { hasWin: true, pattern: 'diag', indices }
  }

  {
    const indices: Array<[number, number]> = []
    let ok = true
    for (let i = 0; i < 5; i++) {
      const r = i
      const c = 4 - i
      if (!isMarked(r, c)) {
        ok = false
        break
      }
      indices.push([r, c])
    }
    if (ok) return { hasWin: true, pattern: 'diag', indices }
  }

  return { hasWin: false }
}

export function checkCorners(grid: BingoGrid, marked: Set<number>): WinResult {
  const cells: Array<[number, number]> = [
    [0, 0],
    [0, 4],
    [4, 0],
    [4, 4],
  ]
  const isMarked = (r: number, c: number): boolean => {
    const cell = grid[r][c]
    return cell === 'FREE' || (typeof cell === 'number' && marked.has(cell))
  }
  const ok = cells.every(([r, c]) => isMarked(r, c))
  return ok ? { hasWin: true, pattern: 'corners', indices: cells } : { hasWin: false }
}

export function checkFullHouse(grid: BingoGrid, marked: Set<number>): WinResult {
  const indices: Array<[number, number]> = []
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const cell = grid[r][c]
      const isMarked = cell === 'FREE' || (typeof cell === 'number' && marked.has(cell))
      if (!isMarked) return { hasWin: false }
      indices.push([r, c])
    }
  }
  return { hasWin: true, pattern: 'full', indices }
}

export function checkByPattern(
  grid: BingoGrid,
  marked: Set<number>,
  pattern: WinPattern
): WinResult {
  switch (pattern) {
    case 'row':
    case 'col':
    case 'diag':
      return checkLineWin(grid, marked)
    case 'corners':
      return checkCorners(grid, marked)
    case 'full':
      return checkFullHouse(grid, marked)
    default:
      return { hasWin: false }
  }
}


