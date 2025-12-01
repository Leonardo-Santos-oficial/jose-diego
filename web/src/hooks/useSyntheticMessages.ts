import { useEffect, useRef, useCallback } from 'react';
import type { GlobalChatMessage } from '@/modules/global-chat/types';
import {
  BrazilianNameGenerator,
  AviatorCommentGenerator,
  SyntheticChatMessageGenerator,
  SyntheticMessageScheduler,
  type SyntheticSchedulerConfig,
} from '@/modules/global-chat/synthetic';

type SyntheticMessageCallback = (message: GlobalChatMessage) => void;

export function useSyntheticMessages(
  onMessage: SyntheticMessageCallback,
  config?: Partial<SyntheticSchedulerConfig>
): void {
  const onMessageRef = useRef(onMessage);

  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const createSyntheticGlobalMessage = useCallback((userName: string, body: string): GlobalChatMessage => ({
    id: `synthetic-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    userId: 'synthetic',
    userName,
    body,
    createdAt: new Date().toISOString(),
  }), []);

  useEffect(() => {
    const generator = new SyntheticChatMessageGenerator(
      new BrazilianNameGenerator(),
      new AviatorCommentGenerator()
    );

    const scheduler = new SyntheticMessageScheduler(
      generator,
      (syntheticMessage) => {
        const message = createSyntheticGlobalMessage(
          syntheticMessage.userName,
          syntheticMessage.body
        );
        onMessageRef.current(message);
      },
      config
    );

    scheduler.start();

    return () => scheduler.stop();
  }, [config, createSyntheticGlobalMessage]);
}
