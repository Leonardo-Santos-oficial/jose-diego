type Primitive = string | number | boolean | null | undefined;

export class CacheKeyBuilder {
  private readonly parts: string[] = [];

  constructor(namespace: string) {
    this.parts.push(namespace);
  }

  static create(namespace: string): CacheKeyBuilder {
    return new CacheKeyBuilder(namespace);
  }

  with(key: string, value: Primitive): this {
    if (value !== undefined && value !== null) {
      this.parts.push(`${key}:${String(value)}`);
    }
    return this;
  }

  append(value: Primitive): this {
    if (value !== undefined && value !== null) {
      this.parts.push(String(value));
    }
    return this;
  }

  build(): string {
    return this.parts.join(':');
  }
}

export function buildCacheKey(namespace: string, ...args: Primitive[]): string {
  const validArgs = args.filter((arg) => arg !== undefined && arg !== null);
  return [namespace, ...validArgs.map(String)].join(':');
}
