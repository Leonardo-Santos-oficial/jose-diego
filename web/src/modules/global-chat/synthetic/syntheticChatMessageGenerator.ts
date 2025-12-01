import type {
  NameGenerator,
  CommentGenerator,
  SyntheticMessage,
  SyntheticMessageGenerator,
} from './types';

export class SyntheticChatMessageGenerator implements SyntheticMessageGenerator {
  constructor(
    private readonly nameGenerator: NameGenerator,
    private readonly commentGenerator: CommentGenerator
  ) {}

  generate(): SyntheticMessage {
    return {
      userName: this.nameGenerator.generate(),
      body: this.commentGenerator.generate(),
    };
  }
}
