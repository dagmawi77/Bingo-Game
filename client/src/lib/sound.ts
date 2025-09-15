let audioCtx: AudioContext | null = null

export async function playCallSound(): Promise<void> {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    const ctx = audioCtx
    if (!ctx) return

    const now = ctx.currentTime
    const duration = 0.18

    // Simple two-tone chime
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.2, now + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)
    gain.connect(ctx.destination)

    const osc1 = ctx.createOscillator()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(660, now)
    osc1.connect(gain)
    osc1.start(now)
    osc1.stop(now + duration)

    const osc2 = ctx.createOscillator()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(880, now + 0.06)
    osc2.connect(gain)
    osc2.start(now + 0.06)
    osc2.stop(now + 0.06 + duration * 0.8)
  } catch {
    // ignore audio errors (autoplay restrictions)
  }
}


