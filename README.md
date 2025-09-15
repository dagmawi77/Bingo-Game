# Bingo Game (75-ball)

Modern web Bingo with local play, bots, dark theme, and a Socket.IO backend. Auto-daub, multiple cards, pattern checks, caller history, and Amharic voice calls.

## Features
- 75-ball Bingo cards (B/I/N/G/O ranges), free center
- Multiple cards per player, quick-pick 1–20
- Draw board with last call and history
- Patterns: row/column/diagonal, corners, full house
- Auto-draw timer; auto-daub or manual marking
- Bots (AI) that auto-mark and can win
- Dark theme UI, print-friendly cards
- Amharic caller (Speech Synthesis)
- Minimal Socket.IO backend (rooms, server draw, win verify)

## Getting Started

### Prerequisites
- Node.js 18+

### Client (web)
```bash
cd client
npm install
npm run dev
```
Open the URL shown (e.g. http://localhost:5173).

### Server (optional, for multiplayer)
```bash
cd server
npm install
npm run dev
```
Server listens on port 4000.

## Usage
- Generate Card → creates your first card. Add Card or Add Bot for more.
- Draw Number or enable Auto-draw. Choose Pattern.
- Amharic call toggle enables Amharic TTS for calls. Click once on the page to allow audio.
- Print Cards button prints current cards with clean layout.

## Amharic Caller
- Uses Speech Synthesis API; targets `am-ET` voice if available. Some devices lack Amharic voices and may read in English.
- Implemented single-utterance (letter + number) to improve reliability.

## Screenshots
Home view:

![Home](docs/home.png)

Place additional screenshots in `docs/` and link here:
- docs/screenshot-1.png
- docs/screenshot-2.png

## Project Structure
```
client/           # Vite + React + TS web app
  src/
    components/
    lib/
server/           # Express + Socket.IO backend
```

## Roadmap
- Client lobby + backend rooms integration
- 80/90-ball variants
- Payments & monetization (free vs paid sessions, expiry)
- Optional recorded Amharic audio pack (B-01..O-75)

## Recent Changes
- Amharic caller switched to single-utterance with adjustable voice speed.
- Default auto-draw interval set to 1500 ms; configurable in UI.
- Added three.js rotating 3D bingo ball in Caller.

## License
MIT