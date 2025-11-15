import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { LoopController } from '../loop/LoopController.js';

const overrideSchema = z.object({
  action: z.enum(['pause', 'resume', 'forceCrash'])
});

export function registerOverrideRoutes(app: FastifyInstance, controller: LoopController): void {
  app.post('/round/override', async (request, reply) => {
    const parsed = overrideSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({ message: 'Invalid override payload', issues: parsed.error.issues });
    }

    controller.handle(parsed.data.action);
    return reply.status(202).send({ status: 'accepted', action: parsed.data.action });
  });
}
