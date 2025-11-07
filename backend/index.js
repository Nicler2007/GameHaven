// backend/index.js

const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())

// ===== MongoDB connection =====
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err))

// ===== Mongoose model =====
const gameSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, enum: ['want to play', 'in progress', 'completed'], default: 'want to play' },
  notes: String
})

const Game = mongoose.model('Game', gameSchema)

// ===== Routes =====

// Test route
app.get('/', (req, res) => res.send('GameHaven backend is running!'))

// Get all games
app.get('/games', async (req, res) => {
  try {
    const games = await Game.find({})
    res.json(games)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch games' })
  }
})

// Add a new game
app.post('/games', async (req, res) => {
  const { name, status, notes } = req.body
  if (!name) {
    return res.status(400).json({ error: 'Game must have a name' })
  }

  const newGame = new Game({ name, status: status || 'want to play', notes: notes || '' })
  try {
    const savedGame = await newGame.save()
    res.status(201).json(savedGame)
  } catch (err) {
    res.status(500).json({ error: 'Failed to save game' })
  }
})

// Update a game
app.put('/games/:id', async (req, res) => {
  const { id } = req.params;
  const { name, status, notes } = req.body;

  if (!['want to play', 'in progress', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const updatedGame = await Game.findByIdAndUpdate(
      id,
      { name, status, notes },
      { new: true, runValidators: true }
    );
    if (!updatedGame) return res.status(404).json({ error: 'Game not found' });
    res.json(updatedGame);
  } catch (err) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// Delete a game
app.delete('/games/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const deletedGame = await Game.findByIdAndDelete(id);
    if (!deletedGame) return res.status(404).json({ error: 'Game not found' });
    res.json({ message: 'Game deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed' });
  }
});

// ===== Server start =====
const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))