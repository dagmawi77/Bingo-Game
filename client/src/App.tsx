import React from 'react'
import { generateBingoCard75, BingoGrid } from './lib/bingo'
import { ManualDraw75 } from './lib/draw'
import { checkByPattern, WinPattern } from './lib/win'
import { Card } from './components/Card'
import './App.css'
import { playCallSound } from './lib/sound'
import { speakAmharicNumber, speakAmharicCall, speakAmharicCallSingle } from './lib/tts'
import { playCallPreferRecorded } from './lib/voiceCall'
import { formatCall, getLetterForNumber } from './lib/caller'

export function App(): JSX.Element {
  const [grids, setGrids] = React.useState<BingoGrid[]>([])
  const [owners, setOwners] = React.useState<string[]>([]) // parallel to grids: 'You' or 'Bot N'
  const [draw] = React.useState(() => new ManualDraw75())
  const [, forceTick] = React.useReducer((x) => x + 1, 0)
  const [marked, setMarked] = React.useState<Set<number>>(new Set())
  const [winText, setWinText] = React.useState<string>('')
  const [pattern, setPattern] = React.useState<WinPattern>('row')
  const [auto, setAuto] = React.useState(false)
  const [intervalMs, setIntervalMs] = React.useState(1000)
  const [winIndices, setWinIndices] = React.useState<Array<[number, number]> | undefined>(undefined)
  const [perCardWinIndices, setPerCardWinIndices] = React.useState<Array<Array<[number, number]> | undefined>>([])
  const [autoDaub, setAutoDaub] = React.useState(true)
  const [manualMarks, setManualMarks] = React.useState<Array<Set<number>>>([])
  const [speakAmharic, setSpeakAmharic] = React.useState(true)
  const [speakDuringAuto, setSpeakDuringAuto] = React.useState(false)

  async function drawNumber(): Promise<void> {
    draw.drawOne()
    forceTick()
    playCallSound()
    const last = draw.getHistory().slice(-1)[0]
    if (speakAmharic && typeof last === 'number') await speakAmharicCallSingle(last, getLetterForNumber(last))
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
      const results = grids.map((g) => checkByPattern(g, new Set(history), pattern))
      setPerCardWinIndices(results.map((r) => r.indices))
      const firstWinIndex = results.findIndex((r) => r.hasWin)
      if (firstWinIndex >= 0) {
        const winnerOwner = owners[firstWinIndex] ?? `Card ${firstWinIndex + 1}`
        setWinText(`WIN: ${results[firstWinIndex].pattern} - ${winnerOwner}`)
        setWinIndices(results[firstWinIndex].indices)
      } else {
        setWinText('')
        setWinIndices(undefined)
      }
    } else {
      setPerCardWinIndices([])
      setWinText('')
      setWinIndices(undefined)
    }
  }, [draw.getHistory().length, pattern, grids])

  React.useEffect(() => {
    if (!auto) return
    const id = setInterval(() => {
      draw.drawOne()
      forceTick()
      playCallSound()
      if (speakDuringAuto) {
        const last = draw.getHistory().slice(-1)[0]
        if (speakAmharic && typeof last === 'number') speakAmharicCallSingle(last, getLetterForNumber(last))
      }
    }, Math.max(250, intervalMs))
    return () => clearInterval(id)
  }, [auto, intervalMs])

  function newCard(): void {
    setGrids([generateBingoCard75()])
    setOwners(['You'])
    setManualMarks([new Set()])
  }

  function addCard(): void {
    setGrids((prev) => [...prev, generateBingoCard75()])
    setOwners((prev) => (prev.length === 0 ? ['You'] : [...prev, `You ${prev.filter(o => o.startsWith('You')).length + 1}`]))
    setManualMarks((prev) => [...prev, new Set()])
  }

  function addBot(): void {
    setGrids((prev) => [...prev, generateBingoCard75()])
    setOwners((prev) => {
      const botCount = prev.filter((o) => o.startsWith('Bot')).length
      return prev.length === 0 ? ['Bot 1'] : [...prev, `Bot ${botCount + 1}`]
    })
    setManualMarks((prev) => [...prev, new Set()])
  }

  function handleManualClick(cardIndex: number, r: number, c: number, value: number | 'FREE'): void {
    if (value === 'FREE') return
    setManualMarks((prev) => {
      const next = [...prev]
      const set = new Set(next[cardIndex] ?? new Set<number>())
      if (set.has(value)) set.delete(value); else set.add(value)
      next[cardIndex] = set
      return next
    })
  }

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 16 }}>
      <h1>Bingo (75-ball) - Local</h1>
      <div className="layout" style={{ marginTop: 12 }}>
        <div className="panel">
          <div className="toolbar" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={newCard}>Generate Card</button>
            <button onClick={addCard}>Add Card</button>
            <button onClick={addBot}>Add Bot</button>
            <button onClick={drawNumber}>Draw Number</button>
            <button onClick={resetDraws}>Reset Draws</button>
          </div>
          <div className="toolbar" style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
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
            <label>
              Auto-daub:
              <input type="checkbox" checked={autoDaub} onChange={(e) => setAutoDaub(e.target.checked)} style={{ marginLeft: 6 }} />
            </label>
            <label>
              Amharic call:
              <input type="checkbox" checked={speakAmharic} onChange={(e) => setSpeakAmharic(e.target.checked)} style={{ marginLeft: 6 }} />
            </label>
            <label>
              Speak in auto:
              <input type="checkbox" checked={speakDuringAuto} onChange={(e) => setSpeakDuringAuto(e.target.checked)} style={{ marginLeft: 6 }} />
            </label>
            <label>
              Quick-pick:
              <select onChange={(e) => {
                const n = Number(e.target.value)
                if (!n) return
                const gs: BingoGrid[] = []
                const os: string[] = []
                const ms: Array<Set<number>> = []
                for (let i = 0; i < n; i++) { gs.push(generateBingoCard75()); os.push(i === 0 ? 'You' : `You ${i+1}`); ms.push(new Set()) }
                setGrids(gs); setOwners(os); setManualMarks(ms)
              }} defaultValue="">
                <option value="">Pick 1–20</option>
                {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </label>
          </div>
          {winText && (
            <div style={{ marginTop: 8, color: '#22d3ee', fontWeight: 700 }}>{winText}</div>
          )}
          <div style={{ marginTop: 12 }}>
            <div style={{ marginBottom: 6, fontWeight: 600 }}>Caller</div>
            <div className="caller__last">{(() => {
              const n = draw.getHistory().slice(-1)[0]
              return typeof n === 'number' ? formatCall(n) : '—'
            })()}</div>
            <div style={{ margin: '8px 0 6px', fontWeight: 600 }}>History</div>
            <div className="draw__history">
              {draw.getHistory().map((n, idx, arr) => (
                <span key={idx} className={`draw__chip${idx === arr.length - 1 ? ' draw__chip--last' : ''}`}>{formatCall(n)}</span>
              ))}
            </div>
            <div style={{ marginTop: 8 }}>
              <button onClick={() => window.print()} className="toolbar">Print Cards</button>
            </div>
          </div>
        </div>
        <div className="cards">
          {grids.map((g, i) => {
            const effectiveMarked = new Set<number>(marked)
            if (!autoDaub) {
              // Only apply manual marks for human-owned cards
              for (const v of manualMarks[i] ?? []) effectiveMarked.add(v)
            }
            const isHuman = (owners[i] ?? '').startsWith('You')
            return (
              <Card
                key={i}
                title={`${owners[i] ?? `Card ${i + 1}`}`}
                grid={g}
                marked={effectiveMarked}
                winIndices={perCardWinIndices[i]}
                allowManual={isHuman && !autoDaub}
                onCellClick={(r, c, val) => handleManualClick(i, r, c, val)}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}


