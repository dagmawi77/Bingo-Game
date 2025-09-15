import React from 'react'
import { BingoGrid } from '../lib/bingo'

type Props = {
  title: string
  grid: BingoGrid
  marked: Set<number>
  winIndices?: Array<[number, number]>
  onCellClick?: (row: number, col: number, value: number | 'FREE') => void
  allowManual?: boolean
}

export function Card({ title, grid, marked, winIndices, onCellClick, allowManual }: Props): JSX.Element {
  const winSet = new Set((winIndices ?? []).map(([r, c]) => `${r}:${c}`))

  return (
    <div className="card">
      <div className="card__title">{title}</div>
      <table className="card__table">
        <thead>
          <tr>
            {['B', 'I', 'N', 'G', 'O'].map((h) => (
              <th key={h} className="card__th">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.map((row, rIdx) => (
            <tr key={rIdx}>
              {row.map((cell, cIdx) => {
                const isMarked = cell === 'FREE' || (typeof cell === 'number' && marked.has(cell))
                const isWinCell = winSet.has(`${rIdx}:${cIdx}`)
                const className = `card__td${isMarked ? ' card__td--marked' : ''}${isWinCell ? ' card__td--win' : ''}`
                return (
                  <td
                    key={cIdx}
                    className={className}
                    onClick={() => {
                      if (!allowManual) return
                      if (onCellClick) onCellClick(rIdx, cIdx, cell)
                    }}
                    style={{ cursor: allowManual ? 'pointer' : 'default' }}
                  >
                    {cell === 'FREE' ? 'FREE' : cell}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


