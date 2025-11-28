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

const ALLOWED_ORIGINS = [
  'https://jose-diego.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
];

export function createServer({ commandService, loopController }: ServerDependencies): FastifyInstance {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? 'info'
    }
  });

  app.addHook('onRequest', async (request, reply) => {
    const origin = request.headers.origin;
    
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      reply.header('Access-Control-Allow-Origin', origin);
    }
    
    reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    reply.header('Access-Control-Allow-Credentials', 'true');
    reply.header('Access-Control-Max-Age', '86400');
    
    if (request.method === 'OPTIONS') {
      return reply.status(204).send();
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
