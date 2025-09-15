export function getLetterForNumber(n: number): 'B' | 'I' | 'N' | 'G' | 'O' {
  if (n >= 1 && n <= 15) return 'B'
  if (n <= 30) return 'I'
  if (n <= 45) return 'N'
  if (n <= 60) return 'G'
  return 'O'
}

export function formatCall(n: number): string {
  const letter = getLetterForNumber(n)
  const numStr = String(n).padStart(2, '0')
  return `${letter}-${numStr}`
}

export function getAmharicLetter(letter: 'B' | 'I' | 'N' | 'G' | 'O'): string {
  // Approximate Amharic pronunciation of Latin letter names
  switch (letter) {
    case 'B': return 'ቢ'
    case 'I': return 'አይ'
    case 'N': return 'ኤን'
    case 'G': return 'ጂ'
    case 'O': return 'ኦ'
  }
}

