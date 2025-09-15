export class ManualDraw75 {
  private remaining: number[]
  private history: number[]

  constructor() {
    this.remaining = Array.from({ length: 75 }, (_, i) => i + 1)
    this.history = []
  }

  getHistory(): number[] {
    return [...this.history]
  }

  getRemainingCount(): number {
    return this.remaining.length
  }

  drawOne(): number | null {
    if (this.remaining.length === 0) return null
    const idx = Math.floor(Math.random() * this.remaining.length)
    const [num] = this.remaining.splice(idx, 1)
    this.history.push(num)
    return num
  }

  reset(): void {
    this.remaining = Array.from({ length: 75 }, (_, i) => i + 1)
    this.history = []
  }
}


