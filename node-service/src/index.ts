import 'dotenv/config';
import { env } from './config/env.js';
import { logger } from './logger.js';
import { createServer } from './server.js';
import { SupabaseRealtimePublisher } from './publisher/realtimePublisher.js';
import { GameStateMachine } from './loop/GameStateMachine.js';
import { LoopScheduler } from './loop/LoopScheduler.js';
import { LoopController } from './loop/LoopController.js';
import { FixedCrashStrategy } from './strategy/crashStrategy.js';
import { CommandService } from './services/commandService.js';
import { supabaseServiceClient } from './clients/supabaseClient.js';

async function bootstrap(): Promise<void> {
  const publisher = new SupabaseRealtimePublisher();
  const machine = new GameStateMachine({
    publisher,
    strategy: new FixedCrashStrategy(3)
  });
  const scheduler = new LoopScheduler(machine);
  const loopController = new LoopController(scheduler, machine);
  const commandService = new CommandService(
    supabaseServiceClient,
    () => machine.getContext(),
    publisher
  );
  const app = createServer({ commandService, loopController });

  scheduler.start();

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    logger.info({ port: env.PORT }, 'Aviator Node Service listening');
  } catch (error) {
    logger.error({ error }, 'Failed to start Aviator Node Service');
    process.exitCode = 1;
    scheduler.stop();
  }

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutting down Aviator Node Service');
    scheduler.stop();
    await app.close();
    process.exit(0);
  };

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

void bootstrap();
