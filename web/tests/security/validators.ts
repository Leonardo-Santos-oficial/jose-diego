import type { AttackVector } from './attack-vectors';

export interface SecurityTestResult {
  readonly vector: AttackVector;
  readonly passed: boolean;
  readonly sanitizedOutput?: string;
  readonly error?: string;
}

export interface SecurityValidator {
  validate(input: string, output: string): boolean;
}

class XssValidator implements SecurityValidator {
  private readonly dangerousPatterns = [
    /<script[\s>]/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<svg[\s>]/i,
    /data:text\/html/i,
  ];

  validate(_input: string, output: string): boolean {
    return !this.dangerousPatterns.some((pattern) => pattern.test(output));
  }
}

class LengthValidator implements SecurityValidator {
  constructor(private readonly maxLength: number) {}

  validate(_input: string, output: string): boolean {
    return output.length <= this.maxLength;
  }
}

class NoHtmlTagsValidator implements SecurityValidator {
  private readonly tagPattern = /<[^>]*>/;

  validate(_input: string, output: string): boolean {
    return !this.tagPattern.test(output);
  }
}

export class CompositeValidator implements SecurityValidator {
  private readonly validators: SecurityValidator[] = [];

  add(validator: SecurityValidator): this {
    this.validators.push(validator);
    return this;
  }

  validate(input: string, output: string): boolean {
    return this.validators.every((v) => v.validate(input, output));
  }
}

export function createSanitizerValidator(maxLength = 1000): CompositeValidator {
  return new CompositeValidator()
    .add(new XssValidator())
    .add(new NoHtmlTagsValidator())
    .add(new LengthValidator(maxLength));
}

export function runSecurityTest(
  vector: AttackVector,
  sanitizer: (input: string) => string,
  validator: SecurityValidator
): SecurityTestResult {
  try {
    const sanitizedOutput = sanitizer(vector.payload);
    const passed = validator.validate(vector.payload, sanitizedOutput);
    return { vector, passed, sanitizedOutput };
  } catch (error) {
    return {
      vector,
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function runSecurityTestSuite(
  vectors: readonly AttackVector[],
  sanitizer: (input: string) => string,
  validator: SecurityValidator
): SecurityTestResult[] {
  return vectors.map((vector) => runSecurityTest(vector, sanitizer, validator));
}
