require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { AccessToken } = require('livekit-server-sdk');

const app = express();
const port = 3001;

// Middleware
app.use(cors({
  origin: '*', // Restrict this in production!
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Environment variables
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL || 'wss://psy-cliniq-s70l8vu6.ojeddah1a.production.livekit.cloud';

if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  console.error('LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set in .env');
  process.exit(1);
}

// Generate token with role-based identity and permissions
function generateToken(roomName, participantName, isProvider) {
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: isProvider ? `provider-${participantName}` : `client-${participantName}`,
    metadata: JSON.stringify({ role: isProvider ? 'provider' : 'client' }) // Add metadata
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    // Explicitly specify track types
    canPublishSources: ['microphone', 'camera'],
    // Allow participants to update their own metadata (e.g., "hand raised")
    canUpdateOwnMetadata: true
  });

  return at.toJwt();
}

// Token endpoint (now accepts `isProvider` flag)
app.post('/get-token', (req, res) => {
  try {
    const { roomName, participantName, isProvider } = req.body;
    
    if (!roomName || !participantName) {
      return res.status(400).json({ error: 'roomName and participantName are required' });
    }

    const token = generateToken(roomName, participantName, isProvider || false);
    
    res.json({
      token,
      livekitUrl: LIVEKIT_URL,
      roomName,
    });
  } catch (error) {
    console.error('Error generating token:', error);
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Token server running at http://localhost:${port}`);
});
