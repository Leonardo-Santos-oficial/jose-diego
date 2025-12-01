import type { AutoReplyStrategy, AutoReplyContext, AutoReplyResult } from './types';

const WELCOME_MESSAGE = 
  'Olá! 👋 Recebemos sua mensagem e nossa equipe irá analisar em breve. ' +
  'Fique tranquilo(a), responderemos o mais rápido possível. Enquanto isso, ' +
  'fique à vontade para enviar mais detalhes se necessário.';

export class WelcomeAutoReplyStrategy implements AutoReplyStrategy {
  shouldReply(context: AutoReplyContext): boolean {
    return context.thread.status === 'open';
  }

  generateReply(_context: AutoReplyContext): AutoReplyResult {
    return {
      body: WELCOME_MESSAGE,
      delayMs: 1500,
    };
  }
}
