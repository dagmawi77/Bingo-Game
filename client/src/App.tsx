import React from 'react'
import { generateBingoCard75, BingoGrid } from './lib/bingo'
import { ManualDraw75 } from './lib/draw'
import { checkByPattern, WinPattern } from './lib/win'
import { Card } from './components/Card'
import './App.css'

export function App(): JSX.Element {
  const [grids, setGrids] = React.useState<BingoGrid[]>([])
  const [draw] = React.useState(() => new ManualDraw75())
  const [, forceTick] = React.useReducer((x) => x + 1, 0)
  const [marked, setMarked] = React.useState<Set<number>>(new Set())
  const [winText, setWinText] = React.useState<string>('')
  const [pattern, setPattern] = React.useState<WinPattern>('row')
  const [auto, setAuto] = React.useState(false)
  const [intervalMs, setIntervalMs] = React.useState(1000)
  const [winIndices, setWinIndices] = React.useState<Array<[number, number]> | undefined>(undefined)

  function drawNumber(): void {
    draw.drawOne()
    forceTick()
  }

  function resetDraws(): void {
    draw.reset()
    setMarked(new Set())
    forceTick()
  }

  React.useEffect(() => {
    // Auto-mark numbers on the card when drawn
    const history = draw.getHistory()
    setMarked(new Set(history))
    if (grids.length > 0) {
      // Evaluate first card for now
      const res = checkByPattern(grids[0], new Set(history), pattern)
      setWinText(res.hasWin ? `WIN: ${res.pattern}` : '')
      setWinIndices(res.indices)
    } else {
      setWinText('')
      setWinIndices(undefined)
    }
  }, [draw.getHistory().length, pattern, grids])

  React.useEffect(() => {
    if (!auto) return
    const id = setInterval(() => {
      draw.drawOne()
      forceTick()
    }, Math.max(250, intervalMs))
    return () => clearInterval(id)
  }, [auto, intervalMs])

  function newCard(): void {
    setGrids([generateBingoCard75()])
  }

  function addCard(): void {
    setGrids((prev) => [...prev, generateBingoCard75()])
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 16 }}>
      <h1>Bingo (75-ball) - Local</h1>
      <div className="layout" style={{ marginTop: 12 }}>
        <div className="panel">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={newCard}>Generate Card</button>
            <button onClick={addCard}>Add Card</button>
            <button onClick={drawNumber}>Draw Number</button>
            <button onClick={resetDraws}>Reset Draws</button>
          </div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span>Remaining: {draw.getRemainingCount()}</span>
            <label>
              Pattern:
              <select value={pattern} onChange={(e) => setPattern(e.target.value as WinPattern)} style={{ marginLeft: 8 }}>
                <option value="row">Row/Column/Diagonal</option>
                <option value="corners">Corners</option>
                <option value="full">Full House</option>
              </select>
            </label>
            <label style={{ marginLeft: 8 }}>
              Auto-draw:
              <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} style={{ marginLeft: 6 }} />
            </label>
            <label>
              Interval (ms):
              <input type="number" value={intervalMs} onChange={(e) => setIntervalMs(Number(e.target.value) || 1000)} min={250} step={250} style={{ width: 90, marginLeft: 6 }} />
            </label>
          </div>
          {winText && (
            <div style={{ marginTop: 8, color: '#065f46', fontWeight: 600 }}>{winText}</div>
          )}
          <div style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 6, fontWeight: 600 }}>Draw History</div>
            <div className="draw__history">
              {draw.getHistory().map((n, idx, arr) => (
                <span key={idx} className={`draw__chip${idx === arr.length - 1 ? ' draw__chip--last' : ''}`}>{n}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="cards">
          {grids.map((g, i) => (
            <Card key={i} title={`Card ${i + 1}`} grid={g} marked={marked} winIndices={i === 0 ? winIndices : undefined} />
          ))}
        </div>
      </div>
    </div>
  )
}


