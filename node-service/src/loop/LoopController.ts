import type { GameStateMachine } from './GameStateMachine.js';
import type { LoopScheduler } from './LoopScheduler.js';

export type OverrideAction = 'pause' | 'resume' | 'forceCrash';

export class LoopController {
  constructor(private readonly scheduler: LoopScheduler, private readonly machine: GameStateMachine) {}

  handle(action: OverrideAction): void {
    switch (action) {
      case 'pause':
        this.scheduler.pause();
        break;
      case 'resume':
        this.scheduler.resume();
        break;
      case 'forceCrash':
        this.machine.forceCrash();
        break;
      default:
        throw new Error(`Unsupported override action: ${action satisfies never}`);
    }
  }
}
