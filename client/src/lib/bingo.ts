export type BingoCell = number | 'FREE'
export type BingoGrid = BingoCell[][] // 5x5

const COLUMN_RANGES: Array<[number, number]> = [
  [1, 15],
  [16, 30],
  [31, 45],
  [46, 60],
  [61, 75],
]

function generateUniqueNumbersInRange(min: number, max: number, count: number): number[] {
  const available: number[] = []
  for (let n = min; n <= max; n++) available.push(n)
  // Shuffle (Fisher-Yates)
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = available[i]
    available[i] = available[j]
    available[j] = tmp
  }
  return available.slice(0, count)
}

export function generateBingoCard75(): BingoGrid {
  const grid: BingoGrid = Array.from({ length: 5 }, () => Array(5).fill(0)) as unknown as BingoGrid

  for (let col = 0; col < 5; col++) {
    const [min, max] = COLUMN_RANGES[col]
    const nums = generateUniqueNumbersInRange(min, max, 5)
    for (let row = 0; row < 5; row++) {
      grid[row][col] = nums[row]
    }
  }

  // Set center free
  grid[2][2] = 'FREE'
  return grid
}


