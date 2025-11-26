import type { CookieOptions } from '@supabase/ssr';

type CookieSecurityLevel = 'strict' | 'moderate' | 'development';

interface CookieSecurityConfig {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  path: string;
  maxAge?: number;
}

interface CookieSecurityStrategy {
  getConfig(): CookieSecurityConfig;
}

class StrictCookieStrategy implements CookieSecurityStrategy {
  getConfig(): CookieSecurityConfig {
    return {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    };
  }
}

class ModerateCookieStrategy implements CookieSecurityStrategy {
  getConfig(): CookieSecurityConfig {
    return {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    };
  }
}

class DevelopmentCookieStrategy implements CookieSecurityStrategy {
  getConfig(): CookieSecurityConfig {
    return {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
    };
  }
}

class CookieSecurityFacade {
  private readonly strategy: CookieSecurityStrategy;

  constructor(level?: CookieSecurityLevel) {
    const securityLevel = level ?? this.detectEnvironment();
    this.strategy = this.createStrategy(securityLevel);
  }

  private detectEnvironment(): CookieSecurityLevel {
    if (process.env.NODE_ENV === 'development') {
      return 'development';
    }
    return 'moderate';
  }

  private createStrategy(level: CookieSecurityLevel): CookieSecurityStrategy {
    const strategies: Record<CookieSecurityLevel, CookieSecurityStrategy> = {
      strict: new StrictCookieStrategy(),
      moderate: new ModerateCookieStrategy(),
      development: new DevelopmentCookieStrategy(),
    };
    return strategies[level];
  }

  getConfig(): CookieSecurityConfig {
    return this.strategy.getConfig();
  }

  applyToOptions(options?: CookieOptions): CookieOptions {
    const securityConfig = this.getConfig();
    return {
      ...options,
      httpOnly: securityConfig.httpOnly,
      secure: securityConfig.secure,
      sameSite: securityConfig.sameSite,
      path: securityConfig.path,
      maxAge: options?.maxAge ?? securityConfig.maxAge,
    };
  }
}

export const cookieSecurity = new CookieSecurityFacade();

export {
  CookieSecurityFacade,
  StrictCookieStrategy,
  ModerateCookieStrategy,
  DevelopmentCookieStrategy,
};

export type { CookieSecurityConfig, CookieSecurityStrategy, CookieSecurityLevel };
