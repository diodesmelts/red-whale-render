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

// Mock competition data for the Docker deployment
const competitions = [
  {
    id: 1,
    title: "Ninja Air Fryer",
    description: "Win this amazing kitchen gadget!",
    imageUrl: "/images/air-fryer.jpg",
    category: "Kitchen",
    prizeValue: 199.99,
    ticketPrice: 2.99,
    maxTicketsPerUser: 20,
    totalTickets: 1000,
    ticketsSold: 450,
    brand: "Ninja",
    drawDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    isLive: true,
    isFeatured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    title: "PlayStation 5",
    description: "The latest gaming console from Sony with two controllers",
    imageUrl: "/images/ps5.jpg",
    category: "Gaming",
    prizeValue: 599.99,
    ticketPrice: 4.99,
    maxTicketsPerUser: 15,
    totalTickets: 2000,
    ticketsSold: 1200,
    brand: "Sony",
    drawDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    isLive: true,
    isFeatured: true,
    createdAt: new Date().toISOString()
  }
];

// Competitions API
app.get('/api/competitions', (req, res) => {
  res.json(competitions);
});

// User API (unauthorized for now)
app.get('/api/user', (req, res) => {
  res.status(401).json({ message: "Unauthorized" });
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