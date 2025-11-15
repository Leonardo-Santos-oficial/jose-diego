import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { BetCommandInput, CashoutCommandInput } from '../commands/types.js';
import type { CommandService } from '../services/commandService.js';

const betSchema = z.object({
  roundId: z.string().uuid(),
  userId: z.string().uuid(),
  amount: z.number().min(0.5).max(500),
  autopayoutMultiplier: z.number().min(1).optional(),
  strategyKey: z.string().optional()
});

const cashoutSchema = z.object({
  ticketId: z.string().uuid(),
  userId: z.string().uuid(),
  kind: z.enum(['manual', 'auto'])
});

export function registerCommandRoutes(app: FastifyInstance, service: CommandService): void {
  app.post<{ Body: BetCommandInput }>('/bets', async (request, reply) => {
    const parsed = betSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        message: 'Invalid bet payload',
        issues: parsed.error.issues
      });
    }

    const result = await service.placeBet(parsed.data);
    const statusCode = result.status === 'accepted' ? 202 : 409;
    return reply.status(statusCode).send(result);
  });

  app.post<{ Body: CashoutCommandInput }>('/cashout', async (request, reply) => {
    const parsed = cashoutSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        message: 'Invalid cashout payload',
        issues: parsed.error.issues
      });
    }

    const result = await service.cashout(parsed.data);
    const statusCode = result.status === 'credited' ? 202 : 409;
    return reply.status(statusCode).send(result);
  });
}
