function numberToAmharic(n: number): string {
  const units = [
    '', 'አንድ', 'ሁለት', 'ሶስት', 'አራት', 'አምስት', 'ስድስት', 'ሰባት', 'ስምንት', 'ዘጠኝ'
  ]
  const tensNames: Record<number, string> = {
    10: 'አስር',
    20: 'ሃያ',
    30: 'ሰላሳ',
    40: 'አርባ',
    50: 'ሃምሳ',
    60: 'ስልሳ',
    70: 'ሰባ',
  }
  if (n <= 9) return units[n]
  if (n === 10) return tensNames[10]
  if (n < 20) return `አስራ ${units[n - 10]}`
  if (n % 10 === 0) return tensNames[n] || `${n}`
  const t = Math.floor(n / 10) * 10
  const u = n % 10
  const tens = tensNames[t] || `${t}`
  return `${tens} ${units[u]}`
}

function numberToAmharicLatin(n: number): string {
  const units = ['', 'and', 'hulet', 'sost', 'arat', 'amist', 'sidist', 'sebat', 'siment', 'zetegn']
  const tens = {
    10: 'asra',
    20: 'haya',
    30: 'selasa',
    40: 'arba',
    50: 'hamsa',
    60: 'silisa',
    70: 'seba',
  } as Record<number,string>
  if (n <= 9) return units[n]
  if (n === 10) return tens[10]
  if (n < 20) return `asra ${units[n - 10]}`
  if (n % 10 === 0) return tens[n] || `${n}`
  const t = Math.floor(n / 10) * 10
  const u = n % 10
  return `${tens[t] || t} ${units[u]}`
}

export function speakAmharicNumber(n: number, opts?: { prefix?: string }): void {
  try {
    const text = `${opts?.prefix ?? ''}${opts?.prefix ? ' ' : ''}${numberToAmharic(n)}`

    const speakNow = () => {
      const utter = new SpeechSynthesisUtterance(text)
      utter.lang = 'am-ET'
      utter.rate = 0.95
      utter.pitch = 1
      const voices = speechSynthesis.getVoices()
      const amVoice = voices.find(v => (v.lang || '').toLowerCase().startsWith('am'))
      if (amVoice) utter.voice = amVoice
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(utter)
    }

    const voices = speechSynthesis.getVoices()
    if (!voices || voices.length === 0) {
      const handler = () => {
        speechSynthesis.removeEventListener('voiceschanged', handler)
        // slight delay lets voices fully populate across browsers
        setTimeout(speakNow, 0)
      }
      speechSynthesis.addEventListener('voiceschanged', handler)
      // fallback timeout if event never fires
      setTimeout(speakNow, 500)
    } else {
      speakNow()
    }
  } catch {
    // ignore
  }
}

import { getAmharicLetter } from './caller'

function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
	return new Promise((resolve) => {
		const voices = speechSynthesis.getVoices()
		if (voices && voices.length > 0) return resolve(voices)
		const handler = () => {
			speechSynthesis.removeEventListener('voiceschanged', handler)
			resolve(speechSynthesis.getVoices())
		}
		speechSynthesis.addEventListener('voiceschanged', handler)
		// Fallback in case event never fires
		setTimeout(() => resolve(speechSynthesis.getVoices()), 700)
	})
}

export async function speakAmharicCall(n: number, letter?: 'B'|'I'|'N'|'G'|'O'): Promise<void> {
	try {
		const letterText = letter ? getAmharicLetter(letter) : ''
		const numberText = numberToAmharic(n)

		// Some browsers pause synthesis; resume just in case
		try { (window.speechSynthesis as any).resume?.() } catch {}

		const voices = await waitForVoices()
		const amVoice = voices.find(v => (v.lang || '').toLowerCase().startsWith('am'))

		// Don't cancel queue here; avoid stutter and slowdown in auto mode

		// If no Amharic voice available, fallback to a clear English call like "B 12"
		if (!amVoice) {
			const fallback = new SpeechSynthesisUtterance(`${letter ?? ''} ${n}`.trim())
			fallback.rate = 1
			fallback.pitch = 1
			window.speechSynthesis.speak(fallback)
			return
		}

		const first = new SpeechSynthesisUtterance(letterText)
		first.lang = 'am-ET'
		first.rate = 0.95
		first.pitch = 1
		if (amVoice) first.voice = amVoice

		const second = new SpeechSynthesisUtterance(numberText)
		second.lang = 'am-ET'
		second.rate = 0.95
		second.pitch = 1
		if (amVoice) second.voice = amVoice

		first.onend = () => {
			window.speechSynthesis.speak(second)
		}
		window.speechSynthesis.speak(first)
	} catch {}
}

export async function speakAmharicCallSingle(n: number, letter?: 'B'|'I'|'N'|'G'|'O', rate: number = 0.8): Promise<void> {
	try {
		const letterText = letter ? getAmharicLetter(letter) : ''
		const numberText = numberToAmharic(n)
		const text = `${letterText} ${numberText}`.trim()

		try { (window.speechSynthesis as any).resume?.() } catch {}
		const voices = await waitForVoices()
		const amVoice = voices.find(v => (v.lang || '').toLowerCase().startsWith('am'))

		if (amVoice) {
			const utter = new SpeechSynthesisUtterance(text)
			utter.lang = 'am-ET'
			utter.rate = rate
			utter.pitch = 1
			utter.voice = amVoice
			window.speechSynthesis.speak(utter)
		} else {
			// Fallback: speak transliterated Amharic with default voice so the call is audible
			const latin = numberToAmharicLatin(n)
			const utter = new SpeechSynthesisUtterance(`${letter ?? ''} ${latin}`.trim())
			utter.rate = rate
			utter.pitch = 1
			window.speechSynthesis.speak(utter)
		}
	} catch {}
}


