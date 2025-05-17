require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { AccessToken } = require('livekit-server-sdk');

const app = express();
const port = 3001;

// Middleware
// Replace your current CORS middleware with this:
app.use(cors({
  origin: '*', // For development only - restrict this in production
  methods: ['POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Load environment variables
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL || 'wss://your-livekit-server-url';

if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  console.error('LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set in .env');
  process.exit(1);
}

// Generate a token for a participant
function generateToken(roomName, participantName) {
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantName,
  });

  at.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
  });

  return at.toJwt();
}

// Endpoint to get a token
app.post('/get-token', (req, res) => {
  try {
    const { roomName, participantName } = req.body;
    
    if (!roomName || !participantName) {
      return res.status(400).json({ error: 'roomName and participantName are required' });
    }

    const token = generateToken(roomName, participantName);
    
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
