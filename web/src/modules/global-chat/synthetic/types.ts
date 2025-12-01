export interface SyntheticMessage {
  userName: string;
  body: string;
}

export interface NameGenerator {
  generate(): string;
}

export interface CommentGenerator {
  generate(): string;
}

export interface SyntheticMessageGenerator {
  generate(): SyntheticMessage;
}

export interface SyntheticSchedulerConfig {
  minIntervalMs: number;
  maxIntervalMs: number;
  probability: number;
}
