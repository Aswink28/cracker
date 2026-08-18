import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';

import config from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { generalLimiter } from './middleware/rateLimiters.js';

const app = express();

// Render, Railway, Fly and friends all sit behind a proxy. Without this the
// rate limiter sees one shared IP and would throttle every user together.
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(
  helmet({
    // The API returns JSON only, so it needs no CSP of its own; the storefront
    // sets its own headers. Cross-origin resource policy is relaxed so the
    // Next.js app on another domain can read responses.
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

const corsOptions = {
  origin(origin, callback) {
    // Same-origin, curl and server-to-server calls arrive with no Origin
    // header. Next.js server components fetch this way, so they must pass.
    if (!origin) return callback(null, true);
    if (config.allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.use(compression());

// 1 MB is generous for JSON product payloads; images go through multipart.
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.use(morgan(config.isProduction ? 'combined' : 'dev'));
app.use('/api', generalLimiter);

app.get('/', (_req, res) => {
  res.json({ success: true, message: 'Crackers catalogue API', docs: '/api/health' });
});

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
