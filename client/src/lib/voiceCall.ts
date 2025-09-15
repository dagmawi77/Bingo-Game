import { getLetterForNumber } from './caller'

export async function playRecordedAmharic(letter: 'B'|'I'|'N'|'G'|'O', n: number): Promise<boolean> {
  try {
    const numStr = String(n).padStart(2, '0')
    const src = `/audio/am/${letter}-${numStr}.mp3`
    // Probe existence quickly
    const res = await fetch(src, { method: 'HEAD' })
    if (!res.ok) return false
    const audio = new Audio(src)
    await audio.play()
    return true
  } catch {
    return false
  }
}

export async function playCallPreferRecorded(n: number, opts: { requireAmharicOnly?: boolean }): Promise<'played-recorded'|'not-found'> {
  const letter = getLetterForNumber(n)
  const ok = await playRecordedAmharic(letter, n)
  if (ok) return 'played-recorded'
  return 'not-found'
}


