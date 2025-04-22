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

// API Routes
app.get('/api/competitions', (req, res) => {
  res.json(competitions);
});

// User API (unauthorized for now)
app.get('/api/user', (req, res) => {
  res.status(401).json({ message: "Unauthorized" });
});

// Serve static files from dist/public
app.use(express.static(path.join(__dirname, 'dist', 'public')));

// Return JSON for root path too for SPA clients
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Blue Whale Competitions</title>
      <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-100 min-h-screen">
      <div class="container mx-auto px-4 py-8">
        <header class="mb-8">
          <h1 class="text-3xl font-bold text-blue-800">Blue Whale Competitions</h1>
          <p class="text-lg text-gray-600">Win amazing prizes!</p>
        </header>
        
        <main>
          <div class="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 class="text-xl font-semibold mb-4">Platform Status</h2>
            <p class="text-green-600 font-medium">✓ API Server running</p>
            <p class="text-green-600 font-medium">✓ Competitions endpoint available</p>
            <p class="mt-4">
              <a href="/api/health" class="text-blue-600 hover:underline">Check API health</a> |
              <a href="/api/competitions" class="text-blue-600 hover:underline">View all competitions</a>
            </p>
          </div>
          
          <div class="grid md:grid-cols-2 gap-6">
            <div class="bg-white rounded-lg shadow-md p-6">
              <h2 class="text-xl font-semibold mb-4">Featured Competitions</h2>
              <div id="competitions-list" class="space-y-4">
                <p class="text-gray-500">Loading competitions...</p>
              </div>
            </div>
            
            <div class="bg-white rounded-lg shadow-md p-6">
              <h2 class="text-xl font-semibold mb-4">About Blue Whale</h2>
              <p class="text-gray-700 mb-4">
                Blue Whale Competitions is a platform that gives users the chance to win incredible prizes 
                by entering competitions across various categories including technology, fashion, home goods, and more.
              </p>
              <p class="text-gray-700">
                Simply browse our competitions, purchase tickets, and you could be our next winner!
              </p>
            </div>
          </div>
        </main>
        
        <footer class="mt-12 pt-6 border-t border-gray-200 text-center text-gray-600">
          <p>© 2025 Blue Whale Competitions. All rights reserved.</p>
        </footer>
      </div>
      
      <script>
        // Fetch competitions
        fetch('/api/competitions')
          .then(response => response.json())
          .then(data => {
            const competitionsList = document.getElementById('competitions-list');
            competitionsList.innerHTML = '';
            
            if (data.length === 0) {
              competitionsList.innerHTML = '<p class="text-gray-500">No competitions available right now.</p>';
              return;
            }
            
            data.forEach(competition => {
              const card = document.createElement('div');
              card.className = 'border border-gray-200 rounded p-4';
              card.innerHTML = \`
                <h3 class="font-medium text-blue-700">\${competition.title}</h3>
                <p class="text-sm text-gray-600 mt-1">\${competition.category} | £\${competition.ticketPrice.toFixed(2)} per ticket</p>
                <p class="text-sm mt-2">\${competition.description.substring(0, 100)}...</p>
                <div class="mt-3 flex justify-between items-center">
                  <span class="text-sm font-medium">Prize value: £\${competition.prizeValue.toFixed(2)}</span>
                  <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Draw: \${new Date(competition.drawDate).toLocaleDateString()}</span>
                </div>
              \`;
              competitionsList.appendChild(card);
            });
          })
          .catch(error => {
            console.error('Error fetching competitions:', error);
            document.getElementById('competitions-list').innerHTML = 
              '<p class="text-red-500">Failed to load competitions. Please try again later.</p>';
          });
      </script>
    </body>
    </html>
  `);
});

// Fallback to index.html for SPA for any other routes
app.get('*', (req, res) => {
  res.redirect('/');
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});