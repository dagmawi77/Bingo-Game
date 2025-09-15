import express from 'express'
import http from 'http'
import cors from 'cors'
import { Server } from 'socket.io'
import crypto from 'crypto'

const app = express()
app.use(cors())

const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

// Utility: 75-ball card generation
function generateCard75() {
  const ranges = [ [1,15], [16,30], [31,45], [46,60], [61,75] ]
  const grid = Array.from({ length: 5 }, () => Array(5).fill(0))
  for (let c = 0; c < 5; c++) {
    const nums = []
    for (let n = ranges[c][0]; n <= ranges[c][1]; n++) nums.push(n)
    for (let i = nums.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[nums[i], nums[j]] = [nums[j], nums[i]]
    }
    for (let r = 0; r < 5; r++) grid[r][c] = nums[r]
  }
  grid[2][2] = 'FREE'
  return grid
}

// Win validation helpers (row/col/diag/corners/full)
function isMarked(grid, markedSet, r, c) {
  const cell = grid[r][c]
  return cell === 'FREE' || (typeof cell === 'number' && markedSet.has(cell))
}
function checkLines(grid, markedSet) {
  for (let r = 0; r < 5; r++) {
    let ok = true
    for (let c = 0; c < 5; c++) if (!isMarked(grid, markedSet, r, c)) { ok = false; break }
    if (ok) return { hasWin: true, pattern: 'row' }
  }
  for (let c = 0; c < 5; c++) {
    let ok = true
    for (let r = 0; r < 5; r++) if (!isMarked(grid, markedSet, r, c)) { ok = false; break }
    if (ok) return { hasWin: true, pattern: 'col' }
  }
  {
    let ok = true
    for (let i = 0; i < 5; i++) if (!isMarked(grid, markedSet, i, i)) { ok = false; break }
    if (ok) return { hasWin: true, pattern: 'diag' }
  }
  {
    let ok = true
    for (let i = 0; i < 5; i++) if (!isMarked(grid, markedSet, i, 4 - i)) { ok = false; break }
    if (ok) return { hasWin: true, pattern: 'diag' }
  }
  return { hasWin: false }
}
function checkCorners(grid, markedSet) {
  const cells = [ [0,0],[0,4],[4,0],[4,4] ]
  const ok = cells.every(([r,c]) => isMarked(grid, markedSet, r, c))
  return ok ? { hasWin: true, pattern: 'corners' } : { hasWin: false }
}
function checkFull(grid, markedSet) {
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) if (!isMarked(grid, markedSet, r, c)) return { hasWin: false }
  return { hasWin: true, pattern: 'full' }
}
function checkByPattern(grid, markedSet, pattern) {
  if (pattern === 'corners') return checkCorners(grid, markedSet)
  if (pattern === 'full') return checkFull(grid, markedSet)
  return checkLines(grid, markedSet)
}

// In-memory rooms
const rooms = new Map()

function createRoom(roomId, { pattern = 'row', cardsPerPlayer = 1 } = {}) {
  const serverSeed = crypto.randomBytes(16).toString('hex')
  const serverSeedHash = crypto.createHash('sha256').update(serverSeed).digest('hex')
  const remaining = Array.from({ length: 75 }, (_, i) => i + 1)
  const state = {
    roomId,
    pattern,
    cardsPerPlayer,
    players: new Map(), // socketId -> { id, name, cards: [grid], wins: [] }
    history: [],
    remaining,
    serverSeed,
    serverSeedHash,
    started: false,
    winners: [],
  }
  rooms.set(roomId, state)
  return state
}

function drawOne(state) {
  if (state.remaining.length === 0) return null
  const idx = crypto.randomInt(0, state.remaining.length)
  const [num] = state.remaining.splice(idx, 1)
  state.history.push(num)
  return num
}

io.on('connection', (socket) => {
  socket.on('createRoom', (payload, cb) => {
    const { roomId, pattern, cardsPerPlayer } = payload
    if (rooms.has(roomId)) return cb?.({ error: 'ROOM_EXISTS' })
    const state = createRoom(roomId, { pattern, cardsPerPlayer })
    cb?.({ ok: true, serverSeedHash: state.serverSeedHash })
  })

  socket.on('joinRoom', (payload, cb) => {
    const { roomId, name = 'Player' } = payload
    const state = rooms.get(roomId) || createRoom(roomId, {})
    socket.join(roomId)
    const cards = Array.from({ length: state.cardsPerPlayer }, () => generateCard75())
    state.players.set(socket.id, { id: socket.id, name, cards })
    io.to(roomId).emit('playerJoined', { id: socket.id, name })
    cb?.({ ok: true, cards, serverSeedHash: state.serverSeedHash, pattern: state.pattern })
  })

  socket.on('startGame', ({ roomId }, cb) => {
    const state = rooms.get(roomId)
    if (!state) return cb?.({ error: 'NO_ROOM' })
    if (state.started) return cb?.({ error: 'ALREADY_STARTED' })
    state.started = true
    io.to(roomId).emit('gameStarted', { at: Date.now() })
  })

  socket.on('drawNext', ({ roomId }, cb) => {
    const state = rooms.get(roomId)
    if (!state) return cb?.({ error: 'NO_ROOM' })
    const num = drawOne(state)
    if (num == null) return cb?.({ error: 'NO_NUMBERS' })
    io.to(roomId).emit('numberDrawn', { number: num, history: state.history })
    // Evaluate wins
    const marked = new Set(state.history)
    const winners = []
    for (const [, player] of state.players) {
      player.cards.forEach((grid, idx) => {
        const res = checkByPattern(grid, marked, state.pattern)
        if (res.hasWin) winners.push({ playerId: player.id, name: player.name, cardIndex: idx, pattern: res.pattern })
      })
    }
    if (winners.length > 0) {
      state.winners = winners
      io.to(roomId).emit('gameOver', { winners, serverSeed: state.serverSeed, serverSeedHash: state.serverSeedHash, history: state.history })
    }
    cb?.({ ok: true, number: num })
  })

  socket.on('disconnect', () => {
    for (const [roomId, state] of rooms) {
      if (state.players.has(socket.id)) {
        state.players.delete(socket.id)
        io.to(roomId).emit('playerLeft', { id: socket.id })
      }
    }
  })
})

const PORT = process.env.PORT || 4000
server.listen(PORT, () => {
  console.log('Server listening on', PORT)
})


