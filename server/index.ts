import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from "cors";

// Configure allowed origins based on environment
function configureAllowedOrigins() {
  const explicitOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : [];
  
  // Always include standard production domains
  const standardOrigins = [
    'https://bluewhalecompetitions.co.uk',
    'https://www.bluewhalecompetitions.co.uk',
    'https://redwhale.onrender.com',
    'https://blue-whale.onrender.com'
  ];
  
  // Combine and deduplicate
  const origins = Array.from(new Set([...explicitOrigins, ...standardOrigins]));
  
  console.log('🔒 Configured CORS allowed origins:', origins);
  return origins;
}

// Enhanced CORS configuration with detailed console logging
const corsOptions = {
  origin: function(origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // In development, allow all origins including undefined (direct browser requests)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`🔓 Development CORS: allowing origin: ${origin || 'undefined (direct)'}`);
      callback(null, true);
      return;
    }
    
    const allowedOrigins = configureAllowedOrigins();
    
    // For production, only allow specific origins and log details
    if (!origin) {
      console.log('⚠️ Production request with no origin header');
      callback(null, true);  // Allow requests with no origin (like mobile apps or curl)
      return;
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log(`✅ CORS allowed origin: ${origin}`);
      callback(null, true);
    } else {
      console.log(`❌ CORS rejected origin: ${origin}`);
      callback(new Error(`CORS not allowed for origin: ${origin}`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Confirm-Delete'],
  maxAge: 86400 // 24 hours in seconds
};

const app = express();

// Apply CORS with our enhanced configuration
app.use(cors(corsOptions));

// Special preflighted requests handler for cross-domain requests with cookies
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use port from environment or fallback to 5000
  // Render sets PORT environment variable for us
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
