import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env, isDevelopment } from './config/env';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import routes from './routes';

const app = express();

// ========== GLOBAL MIDDLEWARE ==========
app.use(helmet());
app.use(cors({
  origin: [env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:19006'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(isDevelopment ? 'dev' : 'combined'));
app.use(generalLimiter);

// ========== ROUTES ==========
app.use('/api/v1', routes);

// ========== ERROR HANDLING ==========
app.use(notFoundHandler);
app.use(errorHandler);

// ========== START SERVER ==========
const server = app.listen(env.PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════╗
║            Freebuff API Server                   ║
╠══════════════════════════════════════════════════╣
║  Status:  Running                                ║
║  Port:    ${String(env.PORT).padEnd(39)}║
║  Mode:    ${isDevelopment ? 'Development'.padEnd(36) : 'Production'.padEnd(36)}║
║  URL:     http://localhost:${String(env.PORT).padEnd(25)}║
╚══════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('[Server] Closed');
    process.exit(0);
  });
});

export default app;
