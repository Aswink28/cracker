import app from './app.js';
import config from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';

async function start() {
  await connectDatabase();

  const server = app.listen(config.PORT, () => {
    console.log(`API listening on port ${config.PORT} [${config.NODE_ENV}]`);
    console.log(`Allowed origins: ${config.allowedOrigins.join(', ')}`);
  });

  /**
   * Graceful shutdown: stop accepting connections, let in-flight requests
   * finish, then close the database. Platforms send SIGTERM on redeploy, and
   * without this the process is killed mid-request.
   */
  const shutdown = async (signal) => {
    console.log(`\n${signal} received, shutting down...`);

    server.close(async () => {
      await disconnectDatabase();
      console.log('Shutdown complete');
      process.exit(0);
    });

    // Don't hang forever if a connection refuses to drain.
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
