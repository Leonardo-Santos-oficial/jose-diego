import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrazilianNameGenerator } from '../brazilianNameGenerator';
import { AviatorCommentGenerator } from '../aviatorCommentGenerator';
import { SyntheticChatMessageGenerator } from '../syntheticChatMessageGenerator';
import { SyntheticMessageScheduler } from '../syntheticMessageScheduler';

describe('BrazilianNameGenerator', () => {
  it('generates a non-empty string', () => {
    const generator = new BrazilianNameGenerator();
    const name = generator.generate();
    
    expect(typeof name).toBe('string');
    expect(name.length).toBeGreaterThan(0);
  });

  it('generates different names over multiple calls', () => {
    const generator = new BrazilianNameGenerator();
    const names = new Set<string>();
    
    for (let i = 0; i < 50; i++) {
      names.add(generator.generate());
    }
    
    expect(names.size).toBeGreaterThan(5);
  });
});

describe('AviatorCommentGenerator', () => {
  it('generates a non-empty string', () => {
    const generator = new AviatorCommentGenerator();
    const comment = generator.generate();
    
    expect(typeof comment).toBe('string');
    expect(comment.length).toBeGreaterThan(0);
  });

  it('generates different comments over multiple calls', () => {
    const generator = new AviatorCommentGenerator();
    const comments = new Set<string>();
    
    for (let i = 0; i < 50; i++) {
      comments.add(generator.generate());
    }
    
    expect(comments.size).toBeGreaterThan(5);
  });
});

describe('SyntheticChatMessageGenerator', () => {
  it('generates a message with userName and body', () => {
    const nameGen = new BrazilianNameGenerator();
    const commentGen = new AviatorCommentGenerator();
    const generator = new SyntheticChatMessageGenerator(nameGen, commentGen);
    
    const message = generator.generate();
    
    expect(message).toHaveProperty('userName');
    expect(message).toHaveProperty('body');
    expect(message.userName.length).toBeGreaterThan(0);
    expect(message.body.length).toBeGreaterThan(0);
  });
});

describe('SyntheticMessageScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls onMessage after scheduled delay', () => {
    const mockGenerator = {
      generate: () => ({ userName: 'Test', body: 'Hello' }),
    };
    const onMessage = vi.fn();
    
    const scheduler = new SyntheticMessageScheduler(
      mockGenerator,
      onMessage,
      { minIntervalMs: 100, maxIntervalMs: 100, probability: 1 }
    );
    
    scheduler.start();
    vi.advanceTimersByTime(150);
    
    expect(onMessage).toHaveBeenCalledWith({ userName: 'Test', body: 'Hello' });
    
    scheduler.stop();
  });

  it('respects probability setting', () => {
    const mockGenerator = {
      generate: () => ({ userName: 'Test', body: 'Hello' }),
    };
    const onMessage = vi.fn();
    
    const scheduler = new SyntheticMessageScheduler(
      mockGenerator,
      onMessage,
      { minIntervalMs: 100, maxIntervalMs: 100, probability: 0 }
    );
    
    scheduler.start();
    vi.advanceTimersByTime(500);
    
    expect(onMessage).not.toHaveBeenCalled();
    
    scheduler.stop();
  });

  it('stops emitting when stopped', () => {
    const mockGenerator = {
      generate: () => ({ userName: 'Test', body: 'Hello' }),
    };
    const onMessage = vi.fn();
    
    const scheduler = new SyntheticMessageScheduler(
      mockGenerator,
      onMessage,
      { minIntervalMs: 100, maxIntervalMs: 100, probability: 1 }
    );
    
    scheduler.start();
    scheduler.stop();
    vi.advanceTimersByTime(500);
    
    expect(onMessage).not.toHaveBeenCalled();
  });
});
