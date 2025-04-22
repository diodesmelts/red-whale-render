// Server startup script for Docker deployment
// This runs inside the Docker container using CommonJS

const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();

// Set up session
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false
}));

// Parse JSON requests
app.use(express.json());

// Basic API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve static files from dist/public
app.use(express.static(path.join(__dirname, 'dist', 'public')));

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'public', 'index.html'));
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});