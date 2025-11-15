export class AuthNetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthNetworkError';
  }
}

export class AuthConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthConfigurationError';
  }
}
