import 'dotenv/config';
import { env } from './config/env.js';
import { logger } from './logger.js';
import { createServer } from './server.js';
import { SupabaseRealtimePublisher } from './publisher/realtimePublisher.js';
import { CompositeRealtimePublisher } from './publisher/compositePublisher.js';
import { WsRealtimePublisher } from './publisher/wsPublisher.js';
import { GameStateMachine } from './loop/GameStateMachine.js';
import { LoopScheduler } from './loop/LoopScheduler.js';
import { LoopController } from './loop/LoopController.js';
import { ProvablyFairStrategy } from './strategy/ProvablyFairStrategy.js';
import { CommandService } from './services/commandService.js';
import { AutoCashoutService } from './services/autoCashoutService.js';
import { SupabaseRoundService } from './services/roundService.js';
import { SupabaseEngineStateService } from './services/engineStateService.js';
import { supabaseServiceClient } from './clients/supabaseClient.js';
import { AdminCommandListener } from './clients/adminCommandListener.js';
import { WsHub } from './ws/WsHub.js';
import { attachWebSocketServer } from './ws/WsServer.js';
import type { StatePayload } from './publisher/realtimePublisher.js';

async function bootstrap(): Promise<void> {
  const wsHub = new WsHub();
  const wsPublisher = new WsRealtimePublisher(wsHub);
  const supabasePublisher = new SupabaseRealtimePublisher(supabaseServiceClient, {
    publishState: false,
    publishHistory: false
  });
  const publisher = new CompositeRealtimePublisher([wsPublisher, supabasePublisher]);
  const autoCashoutService = new AutoCashoutService(supabaseServiceClient, publisher);
  const roundService = new SupabaseRoundService(supabaseServiceClient);
  const engineStateService = new SupabaseEngineStateService(supabaseServiceClient);
  
  const machine = new GameStateMachine({
    publisher,
    strategy: new ProvablyFairStrategy(),
    autoCashoutService,
    roundService,
    engineStateService
  });
  const scheduler = new LoopScheduler(machine);
  const loopController = new LoopController(scheduler, machine);
  const commandService = new CommandService(
    supabaseServiceClient,
    () => machine.getContext(),
    publisher
  );
  const adminListener = new AdminCommandListener(
    supabaseServiceClient,
    loopController,
    engineStateService,
    machine
  );
  
  const app = createServer({ commandService, loopController });
  attachWebSocketServer(app, {
    hub: wsHub,
    getStateSnapshot: (): StatePayload => {
      const ctx = machine.getContext();
      return {
        roundId: ctx.roundId,
        phase: ctx.phase,
        state: ctx.phase,
        multiplier: ctx.multiplier,
        phaseStartedAt: ctx.phaseStartedAt,
        hash: ctx.hash,
        bettingWindowRemainingMs: ctx.bettingWindowRemainingMs,
        bettingWindow: {
          closesInMs: ctx.bettingWindowRemainingMs
        },
        targetMultiplier: ctx.crashTarget
      };
    }
  });

  // Check saved state before starting
  const savedSettings = await engineStateService.getSettings();
  const shouldStartPaused = savedSettings?.paused === true;
  
  if (shouldStartPaused) {
    logger.info('Engine starting in PAUSED state (from saved settings)');
  } else {
    scheduler.start();
    // Ensure paused state is false in DB
    await engineStateService.updatePausedState(false);
  }
  
  adminListener.start();

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    logger.info({ port: env.PORT, paused: shouldStartPaused }, 'Aviator Node Service listening');
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
