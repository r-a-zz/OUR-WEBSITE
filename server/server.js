const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/status', (req, res) => {
  res.json({ message: 'Music search API server is running' });
});

// Music search endpoint using Deezer API
app.get('/api/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // Using Deezer API (no auth required for basic search)
    const response = await axios.get(`https://api.deezer.com/search`, {
      params: { q: q, limit: 10 }
    });

    const tracks = response.data.data.map(track => ({
      id: track.id,
      title: track.title_short || track.title,
      artist: track.artist.name,
      album: track.album.title,
      cover: track.album.cover_medium,
      preview: track.preview,
      duration: track.duration,
      link: track.link
    }));

    res.json({ 
      success: true, 
      data: tracks,
      total: response.data.total 
    });

  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({ 
      error: 'Failed to search music',
      message: error.message 
    });
  }
});

// Alternative: Spotify search endpoint (requires Spotify API credentials)
app.get('/api/search-spotify', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // You would need to add Spotify API credentials here
    // const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
    // const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
    
    // For now, return a message to set up Spotify API
    res.json({ 
      message: 'Spotify search requires API credentials. Please set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET environment variables.',
      fallback: 'Use /api/search for Deezer-powered search instead.'
    });

  } catch (error) {
    console.error('Spotify search error:', error.message);
    res.status(500).json({ error: 'Spotify search failed' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🎵 Music API server running on http://localhost:${PORT}`);
  console.log(`🔍 Search endpoint: http://localhost:${PORT}/api/search?q=your-query`);
});
