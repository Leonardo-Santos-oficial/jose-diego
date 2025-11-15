import Fastify, { type FastifyInstance } from 'fastify';
import { env } from './config/env.js';
import { registerCommandRoutes } from './routes/commands.js';
import { registerOverrideRoutes } from './routes/overrides.js';
import type { CommandService } from './services/commandService.js';
import type { LoopController } from './loop/LoopController.js';

interface ServerDependencies {
  commandService: CommandService;
  loopController: LoopController;
}

export function createServer({ commandService, loopController }: ServerDependencies): FastifyInstance {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info'
    }
  });

  app.get('/health', () => ({
    status: 'ok',
    uptime: process.uptime(),
    realtimeUrl: env.REALTIME_URL
  }));

  registerCommandRoutes(app, commandService);
  registerOverrideRoutes(app, loopController);

  return app;
}
