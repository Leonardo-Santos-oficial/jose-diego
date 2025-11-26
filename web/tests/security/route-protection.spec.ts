import { describe, it, expect } from 'vitest';

/**
 * Security Tests - Route Protection Logic
 * 
 * Unit tests for route protection, path matching, and authorization logic
 */

interface RouteConfig {
  path: string;
  requiresAuth: boolean;
  requiresAdmin: boolean;
  allowedRoles?: string[];
}

interface User {
  id: string;
  role?: string;
}

interface AuthContext {
  user: User | null;
  isAuthenticated: boolean;
}

// Route matcher utility
function matchPath(pattern: string, path: string): boolean {
  // Convert pattern to regex
  // /admin/* matches /admin/anything
  // /app/* matches /app/anything
  const regexPattern = pattern
    .replace(/\*/g, '.*')
    .replace(/\//g, '\\/');
  
  return new RegExp(`^${regexPattern}$`).test(path);
}

// Route configuration
const PROTECTED_ROUTES: RouteConfig[] = [
  { path: '/admin/*', requiresAuth: true, requiresAdmin: true },
  { path: '/admin', requiresAuth: true, requiresAdmin: true },
  { path: '/app/*', requiresAuth: true, requiresAdmin: false },
  { path: '/app', requiresAuth: true, requiresAdmin: false },
  { path: '/api/admin/*', requiresAuth: true, requiresAdmin: true },
  { path: '/api/user/*', requiresAuth: true, requiresAdmin: false },
];

const PUBLIC_ROUTES = ['/', '/benefits', '/api/public/*', '/auth/*'];

function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some(pattern => matchPath(pattern, path));
}

function getRouteConfig(path: string): RouteConfig | null {
  return PROTECTED_ROUTES.find(route => matchPath(route.path, path)) || null;
}

interface AuthorizationResult {
  authorized: boolean;
  reason?: string;
  redirectTo?: string;
}

function checkAuthorization(path: string, context: AuthContext): AuthorizationResult {
  // Public routes are always accessible
  if (isPublicRoute(path)) {
    return { authorized: true };
  }

  const routeConfig = getRouteConfig(path);
  
  // Unknown route - allow (will 404 naturally)
  if (!routeConfig) {
    return { authorized: true };
  }

  // Check authentication
  if (routeConfig.requiresAuth && !context.isAuthenticated) {
    return {
      authorized: false,
      reason: 'Authentication required',
      redirectTo: '/?unauthorized=1',
    };
  }

  // Check admin role
  if (routeConfig.requiresAdmin && context.user?.role !== 'admin') {
    return {
      authorized: false,
      reason: 'Admin access required',
      redirectTo: '/?unauthorized=1',
    };
  }

  // Check specific roles if configured
  if (routeConfig.allowedRoles && context.user) {
    if (!routeConfig.allowedRoles.includes(context.user.role || '')) {
      return {
        authorized: false,
        reason: 'Insufficient role permissions',
        redirectTo: '/?unauthorized=1',
      };
    }
  }

  return { authorized: true };
}

describe('Path Matching', () => {
  it('should match exact paths', () => {
    expect(matchPath('/admin', '/admin')).toBe(true);
    expect(matchPath('/app', '/app')).toBe(true);
  });

  it('should match wildcard paths', () => {
    expect(matchPath('/admin/*', '/admin/users')).toBe(true);
    expect(matchPath('/admin/*', '/admin/settings')).toBe(true);
    expect(matchPath('/app/*', '/app/profile')).toBe(true);
  });

  it('should not match non-matching paths', () => {
    expect(matchPath('/admin', '/user')).toBe(false);
    expect(matchPath('/admin/*', '/other/path')).toBe(false);
  });

  it('should handle nested wildcards', () => {
    expect(matchPath('/api/admin/*', '/api/admin/users')).toBe(true);
    expect(matchPath('/api/admin/*', '/api/admin/users/123')).toBe(true);
  });
});

describe('Public Route Detection', () => {
  it('should identify public routes', () => {
    expect(isPublicRoute('/')).toBe(true);
    expect(isPublicRoute('/benefits')).toBe(true);
  });

  it('should identify protected routes as non-public', () => {
    expect(isPublicRoute('/admin')).toBe(false);
    expect(isPublicRoute('/app')).toBe(false);
    expect(isPublicRoute('/app/profile')).toBe(false);
  });
});

describe('Route Authorization', () => {
  describe('Public Routes', () => {
    it('should allow unauthenticated access to public routes', () => {
      const context: AuthContext = { user: null, isAuthenticated: false };
      
      expect(checkAuthorization('/', context).authorized).toBe(true);
      expect(checkAuthorization('/benefits', context).authorized).toBe(true);
    });

    it('should allow authenticated access to public routes', () => {
      const context: AuthContext = { 
        user: { id: '123', role: 'user' }, 
        isAuthenticated: true 
      };
      
      expect(checkAuthorization('/', context).authorized).toBe(true);
    });
  });

  describe('Protected Routes - Authentication', () => {
    it('should deny unauthenticated access to /app', () => {
      const context: AuthContext = { user: null, isAuthenticated: false };
      const result = checkAuthorization('/app', context);
      
      expect(result.authorized).toBe(false);
      expect(result.reason).toBe('Authentication required');
      expect(result.redirectTo).toBe('/?unauthorized=1');
    });

    it('should deny unauthenticated access to /app/*', () => {
      const context: AuthContext = { user: null, isAuthenticated: false };
      const result = checkAuthorization('/app/profile', context);
      
      expect(result.authorized).toBe(false);
    });

    it('should allow authenticated access to /app', () => {
      const context: AuthContext = { 
        user: { id: '123', role: 'user' }, 
        isAuthenticated: true 
      };
      const result = checkAuthorization('/app', context);
      
      expect(result.authorized).toBe(true);
    });
  });

  describe('Admin Routes - Role Verification', () => {
    it('should deny unauthenticated access to /admin', () => {
      const context: AuthContext = { user: null, isAuthenticated: false };
      const result = checkAuthorization('/admin', context);
      
      expect(result.authorized).toBe(false);
      expect(result.reason).toBe('Authentication required');
    });

    it('should deny non-admin access to /admin', () => {
      const context: AuthContext = { 
        user: { id: '123', role: 'user' }, 
        isAuthenticated: true 
      };
      const result = checkAuthorization('/admin', context);
      
      expect(result.authorized).toBe(false);
      expect(result.reason).toBe('Admin access required');
    });

    it('should allow admin access to /admin', () => {
      const context: AuthContext = { 
        user: { id: '123', role: 'admin' }, 
        isAuthenticated: true 
      };
      const result = checkAuthorization('/admin', context);
      
      expect(result.authorized).toBe(true);
    });

    it('should deny non-admin access to /admin/*', () => {
      const context: AuthContext = { 
        user: { id: '123', role: 'user' }, 
        isAuthenticated: true 
      };
      
      expect(checkAuthorization('/admin/users', context).authorized).toBe(false);
      expect(checkAuthorization('/admin/game', context).authorized).toBe(false);
      expect(checkAuthorization('/admin/settings', context).authorized).toBe(false);
    });

    it('should allow admin access to /admin/*', () => {
      const context: AuthContext = { 
        user: { id: '123', role: 'admin' }, 
        isAuthenticated: true 
      };
      
      expect(checkAuthorization('/admin/users', context).authorized).toBe(true);
      expect(checkAuthorization('/admin/game', context).authorized).toBe(true);
    });
  });

  describe('API Routes', () => {
    it('should deny unauthenticated access to /api/admin/*', () => {
      const context: AuthContext = { user: null, isAuthenticated: false };
      const result = checkAuthorization('/api/admin/action', context);
      
      expect(result.authorized).toBe(false);
    });

    it('should deny non-admin access to /api/admin/*', () => {
      const context: AuthContext = { 
        user: { id: '123', role: 'user' }, 
        isAuthenticated: true 
      };
      const result = checkAuthorization('/api/admin/action', context);
      
      expect(result.authorized).toBe(false);
    });

    it('should allow admin access to /api/admin/*', () => {
      const context: AuthContext = { 
        user: { id: '123', role: 'admin' }, 
        isAuthenticated: true 
      };
      const result = checkAuthorization('/api/admin/action', context);
      
      expect(result.authorized).toBe(true);
    });

    it('should allow authenticated access to /api/user/*', () => {
      const context: AuthContext = { 
        user: { id: '123', role: 'user' }, 
        isAuthenticated: true 
      };
      const result = checkAuthorization('/api/user/profile', context);
      
      expect(result.authorized).toBe(true);
    });
  });

  describe('Unknown Routes', () => {
    it('should allow access to unknown routes', () => {
      const context: AuthContext = { user: null, isAuthenticated: false };
      
      // Unknown routes should be allowed (will 404 naturally)
      expect(checkAuthorization('/unknown/path', context).authorized).toBe(true);
      expect(checkAuthorization('/random', context).authorized).toBe(true);
    });
  });
});

describe('Path Traversal Prevention', () => {
  function sanitizePath(path: string): string {
    // Remove path traversal attempts
    return path
      .replace(/\.{2,}/g, '') // Remove ..
      .replace(/\/+/g, '/')    // Normalize multiple slashes
      .replace(/\0/g, '')      // Remove null bytes
      .replace(/%00/g, '')     // Remove URL-encoded null bytes
      .replace(/%2e%2e/gi, '') // Remove URL-encoded ..
      .replace(/;/g, '');      // Remove semicolons (path pollution)
  }

  it('should remove .. sequences', () => {
    expect(sanitizePath('/admin/../etc/passwd')).toBe('/admin/etc/passwd');
    expect(sanitizePath('../../etc/passwd')).toBe('/etc/passwd');
  });

  it('should normalize multiple slashes', () => {
    expect(sanitizePath('/admin//game')).toBe('/admin/game');
    expect(sanitizePath('///admin///game///')).toBe('/admin/game/');
  });

  it('should remove null bytes', () => {
    expect(sanitizePath('/admin\0')).toBe('/admin');
    expect(sanitizePath('/admin%00')).toBe('/admin');
  });

  it('should remove URL-encoded traversal', () => {
    expect(sanitizePath('/admin/%2e%2e/etc')).toBe('/admin//etc');
  });

  it('should remove semicolons', () => {
    expect(sanitizePath('/admin;/game')).toBe('/admin/game');
  });
});

describe('URL Parameter Injection Prevention', () => {
  function sanitizeQueryParams(params: Record<string, string>): Record<string, string> {
    const sanitized: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(params)) {
      // Skip dangerous parameter names
      if (/^(__proto__|constructor|prototype)$/i.test(key)) {
        continue;
      }
      
      // Sanitize value
      sanitized[key] = value
        .replace(/<script/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+=/gi, '');
    }
    
    return sanitized;
  }

  it('should remove script tags from values', () => {
    const params = { search: '<script>alert(1)</script>' };
    const sanitized = sanitizeQueryParams(params);
    
    expect(sanitized.search).not.toContain('<script');
  });

  it('should remove javascript: protocol', () => {
    const params = { redirect: 'javascript:alert(1)' };
    const sanitized = sanitizeQueryParams(params);
    
    expect(sanitized.redirect).not.toContain('javascript:');
  });

  it('should remove event handlers', () => {
    const params = { data: 'test" onclick="alert(1)"' };
    const sanitized = sanitizeQueryParams(params);
    
    expect(sanitized.data).not.toContain('onclick=');
  });

  it('should skip prototype pollution attempts', () => {
    const params = { 
      __proto__: 'malicious',
      constructor: 'attack',
      prototype: 'injection',
      valid: 'value',
    };
    const sanitized = sanitizeQueryParams(params);
    
    // Check that prototype pollution keys are not present as own properties with malicious values
    expect(Object.prototype.hasOwnProperty.call(sanitized, '__proto__')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(sanitized, 'constructor')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(sanitized, 'prototype')).toBe(false);
    expect(sanitized.valid).toBe('value');
  });
});
