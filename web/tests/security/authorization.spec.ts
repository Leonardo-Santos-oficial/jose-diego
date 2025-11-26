import { describe, it, expect } from 'vitest';

/**
 * Security Tests - Authorization & Access Control
 * 
 * Unit tests for authorization logic, RBAC, and access control
 */

// Role definitions
type Role = 'guest' | 'user' | 'moderator' | 'admin' | 'superadmin';

// Permission definitions
type Permission = 
  | 'read:own'
  | 'read:all'
  | 'write:own'
  | 'write:all'
  | 'delete:own'
  | 'delete:all'
  | 'manage:users'
  | 'manage:roles'
  | 'manage:system'
  | 'view:reports'
  | 'view:audit'
  | 'admin:panel';

// Role hierarchy (higher index = more permissions)
const ROLE_HIERARCHY: Role[] = ['guest', 'user', 'moderator', 'admin', 'superadmin'];

// Role-Permission mapping
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  guest: ['read:own'],
  user: ['read:own', 'write:own', 'delete:own'],
  moderator: ['read:own', 'read:all', 'write:own', 'delete:own', 'delete:all'],
  admin: ['read:own', 'read:all', 'write:own', 'write:all', 'delete:own', 'delete:all', 'manage:users', 'view:reports', 'admin:panel'],
  superadmin: ['read:own', 'read:all', 'write:own', 'write:all', 'delete:own', 'delete:all', 'manage:users', 'manage:roles', 'manage:system', 'view:reports', 'view:audit', 'admin:panel'],
};

function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}

function hasRole(userRole: Role, requiredRole: Role): boolean {
  const userIndex = ROLE_HIERARCHY.indexOf(userRole);
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole);
  
  if (userIndex === -1 || requiredIndex === -1) {
    return false;
  }
  
  return userIndex >= requiredIndex;
}

function canAccessResource(
  userRole: Role,
  userId: string,
  resourceOwnerId: string,
  requiredPermission: Permission
): boolean {
  // Check if user has the permission
  if (!hasPermission(userRole, requiredPermission)) {
    return false;
  }
  
  // For "own" permissions, check ownership
  if (requiredPermission.endsWith(':own')) {
    return userId === resourceOwnerId;
  }
  
  return true;
}

// Attribute-Based Access Control (ABAC)
interface Resource {
  id: string;
  ownerId: string;
  type: string;
  classification: 'public' | 'internal' | 'confidential' | 'restricted';
  department?: string;
}

interface User {
  id: string;
  role: Role;
  department?: string;
  clearanceLevel: number;
}

interface AccessContext {
  time: Date;
  ipAddress: string;
  mfaVerified: boolean;
}

function abacAuthorize(
  user: User,
  resource: Resource,
  action: 'read' | 'write' | 'delete',
  context: AccessContext
): { allowed: boolean; reason?: string } {
  // Check classification clearance
  const clearanceRequired: Record<Resource['classification'], number> = {
    public: 0,
    internal: 1,
    confidential: 2,
    restricted: 3,
  };
  
  if (user.clearanceLevel < clearanceRequired[resource.classification]) {
    return { allowed: false, reason: 'Insufficient clearance level' };
  }
  
  // Restricted resources require MFA
  if (resource.classification === 'restricted' && !context.mfaVerified) {
    return { allowed: false, reason: 'MFA required for restricted resources' };
  }
  
  // Department check for confidential resources
  if (resource.classification === 'confidential' && resource.department) {
    if (user.department !== resource.department && user.role !== 'superadmin') {
      return { allowed: false, reason: 'Department mismatch for confidential resource' };
    }
  }
  
  // Time-based restrictions (no writes outside business hours for non-admins)
  const hour = context.time.getHours();
  if (action === 'write' && (hour < 8 || hour > 18) && !hasRole(user.role, 'admin')) {
    return { allowed: false, reason: 'Write access restricted outside business hours' };
  }
  
  return { allowed: true };
}

describe('Role-Based Access Control (RBAC)', () => {
  describe('Permission Checking', () => {
    it('should grant guest read:own permission', () => {
      expect(hasPermission('guest', 'read:own')).toBe(true);
    });

    it('should deny guest write permission', () => {
      expect(hasPermission('guest', 'write:own')).toBe(false);
    });

    it('should grant user basic permissions', () => {
      expect(hasPermission('user', 'read:own')).toBe(true);
      expect(hasPermission('user', 'write:own')).toBe(true);
      expect(hasPermission('user', 'delete:own')).toBe(true);
    });

    it('should deny user admin permissions', () => {
      expect(hasPermission('user', 'manage:users')).toBe(false);
      expect(hasPermission('user', 'admin:panel')).toBe(false);
    });

    it('should grant moderator elevated permissions', () => {
      expect(hasPermission('moderator', 'read:all')).toBe(true);
      expect(hasPermission('moderator', 'delete:all')).toBe(true);
    });

    it('should grant admin management permissions', () => {
      expect(hasPermission('admin', 'manage:users')).toBe(true);
      expect(hasPermission('admin', 'admin:panel')).toBe(true);
      expect(hasPermission('admin', 'view:reports')).toBe(true);
    });

    it('should grant superadmin all permissions', () => {
      expect(hasPermission('superadmin', 'manage:system')).toBe(true);
      expect(hasPermission('superadmin', 'manage:roles')).toBe(true);
      expect(hasPermission('superadmin', 'view:audit')).toBe(true);
    });
  });

  describe('Role Hierarchy', () => {
    it('should recognize user has user role', () => {
      expect(hasRole('user', 'user')).toBe(true);
    });

    it('should recognize admin has user role', () => {
      expect(hasRole('admin', 'user')).toBe(true);
    });

    it('should recognize superadmin has all roles', () => {
      expect(hasRole('superadmin', 'guest')).toBe(true);
      expect(hasRole('superadmin', 'user')).toBe(true);
      expect(hasRole('superadmin', 'moderator')).toBe(true);
      expect(hasRole('superadmin', 'admin')).toBe(true);
    });

    it('should deny user having admin role', () => {
      expect(hasRole('user', 'admin')).toBe(false);
    });

    it('should deny guest having any higher role', () => {
      expect(hasRole('guest', 'user')).toBe(false);
      expect(hasRole('guest', 'admin')).toBe(false);
    });

    it('should handle invalid roles', () => {
      expect(hasRole('invalid' as Role, 'user')).toBe(false);
      expect(hasRole('user', 'invalid' as Role)).toBe(false);
    });
  });

  describe('Resource Access', () => {
    it('should allow owner to read own resource', () => {
      expect(canAccessResource('user', 'user1', 'user1', 'read:own')).toBe(true);
    });

    it('should deny non-owner to read own-only resource', () => {
      expect(canAccessResource('user', 'user1', 'user2', 'read:own')).toBe(false);
    });

    it('should allow admin to read all resources', () => {
      expect(canAccessResource('admin', 'admin1', 'user2', 'read:all')).toBe(true);
    });

    it('should allow owner to delete own resource', () => {
      expect(canAccessResource('user', 'user1', 'user1', 'delete:own')).toBe(true);
    });

    it('should allow moderator to delete any resource', () => {
      expect(canAccessResource('moderator', 'mod1', 'user2', 'delete:all')).toBe(true);
    });

    it('should deny user to delete others resources', () => {
      expect(canAccessResource('user', 'user1', 'user2', 'delete:all')).toBe(false);
    });
  });
});

describe('Attribute-Based Access Control (ABAC)', () => {
  const businessHoursContext: AccessContext = {
    time: new Date('2024-01-15T10:00:00'),
    ipAddress: '192.168.1.1',
    mfaVerified: true,
  };

  const afterHoursContext: AccessContext = {
    time: new Date('2024-01-15T22:00:00'),
    ipAddress: '192.168.1.1',
    mfaVerified: true,
  };

  const noMfaContext: AccessContext = {
    time: new Date('2024-01-15T10:00:00'),
    ipAddress: '192.168.1.1',
    mfaVerified: false,
  };

  describe('Clearance Level', () => {
    it('should allow access to public resources', () => {
      const user: User = { id: 'u1', role: 'user', clearanceLevel: 0 };
      const resource: Resource = { id: 'r1', ownerId: 'u2', type: 'doc', classification: 'public' };
      
      expect(abacAuthorize(user, resource, 'read', businessHoursContext).allowed).toBe(true);
    });

    it('should deny low clearance to confidential', () => {
      const user: User = { id: 'u1', role: 'user', clearanceLevel: 1 };
      const resource: Resource = { id: 'r1', ownerId: 'u2', type: 'doc', classification: 'confidential' };
      
      const result = abacAuthorize(user, resource, 'read', businessHoursContext);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('clearance');
    });

    it('should allow high clearance to confidential', () => {
      const user: User = { id: 'u1', role: 'user', clearanceLevel: 2, department: 'IT' };
      const resource: Resource = { id: 'r1', ownerId: 'u2', type: 'doc', classification: 'confidential', department: 'IT' };
      
      expect(abacAuthorize(user, resource, 'read', businessHoursContext).allowed).toBe(true);
    });
  });

  describe('MFA Requirements', () => {
    it('should require MFA for restricted resources', () => {
      const user: User = { id: 'u1', role: 'admin', clearanceLevel: 3 };
      const resource: Resource = { id: 'r1', ownerId: 'u2', type: 'doc', classification: 'restricted' };
      
      const result = abacAuthorize(user, resource, 'read', noMfaContext);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('MFA');
    });

    it('should allow access with MFA for restricted', () => {
      const user: User = { id: 'u1', role: 'admin', clearanceLevel: 3 };
      const resource: Resource = { id: 'r1', ownerId: 'u2', type: 'doc', classification: 'restricted' };
      
      expect(abacAuthorize(user, resource, 'read', businessHoursContext).allowed).toBe(true);
    });
  });

  describe('Department Restrictions', () => {
    it('should deny cross-department access to confidential', () => {
      const user: User = { id: 'u1', role: 'user', clearanceLevel: 2, department: 'HR' };
      const resource: Resource = { id: 'r1', ownerId: 'u2', type: 'doc', classification: 'confidential', department: 'IT' };
      
      const result = abacAuthorize(user, resource, 'read', businessHoursContext);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Department');
    });

    it('should allow superadmin cross-department access', () => {
      const user: User = { id: 'u1', role: 'superadmin', clearanceLevel: 3, department: 'HR' };
      const resource: Resource = { id: 'r1', ownerId: 'u2', type: 'doc', classification: 'confidential', department: 'IT' };
      
      expect(abacAuthorize(user, resource, 'read', businessHoursContext).allowed).toBe(true);
    });
  });

  describe('Time-Based Restrictions', () => {
    it('should deny write outside business hours for users', () => {
      const user: User = { id: 'u1', role: 'user', clearanceLevel: 1 };
      const resource: Resource = { id: 'r1', ownerId: 'u1', type: 'doc', classification: 'internal' };
      
      const result = abacAuthorize(user, resource, 'write', afterHoursContext);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('business hours');
    });

    it('should allow admin write outside business hours', () => {
      const user: User = { id: 'u1', role: 'admin', clearanceLevel: 2 };
      const resource: Resource = { id: 'r1', ownerId: 'u1', type: 'doc', classification: 'internal' };
      
      expect(abacAuthorize(user, resource, 'write', afterHoursContext).allowed).toBe(true);
    });

    it('should allow read outside business hours', () => {
      const user: User = { id: 'u1', role: 'user', clearanceLevel: 1 };
      const resource: Resource = { id: 'r1', ownerId: 'u1', type: 'doc', classification: 'internal' };
      
      expect(abacAuthorize(user, resource, 'read', afterHoursContext).allowed).toBe(true);
    });
  });
});

describe('Privilege Escalation Prevention', () => {
  function canAssignRole(assignerRole: Role, targetRole: Role): boolean {
    // Can only assign roles lower than your own
    const assignerIndex = ROLE_HIERARCHY.indexOf(assignerRole);
    const targetIndex = ROLE_HIERARCHY.indexOf(targetRole);
    
    if (assignerIndex === -1 || targetIndex === -1) {
      return false;
    }
    
    // Must have manage:roles permission
    if (!hasPermission(assignerRole, 'manage:roles')) {
      return false;
    }
    
    // Can only assign roles strictly below
    return assignerIndex > targetIndex;
  }

  it('should prevent user from assigning roles', () => {
    expect(canAssignRole('user', 'guest')).toBe(false);
  });

  it('should prevent admin from assigning admin role', () => {
    expect(canAssignRole('admin', 'admin')).toBe(false);
  });

  it('should allow superadmin to assign admin role', () => {
    expect(canAssignRole('superadmin', 'admin')).toBe(true);
  });

  it('should allow superadmin to assign user role', () => {
    expect(canAssignRole('superadmin', 'user')).toBe(true);
  });

  it('should prevent self-escalation', () => {
    expect(canAssignRole('admin', 'superadmin')).toBe(false);
  });

  it('should prevent assigning same level role', () => {
    expect(canAssignRole('superadmin', 'superadmin')).toBe(false);
  });
});

describe('Resource Ownership Validation', () => {
  interface OwnedResource {
    id: string;
    ownerId: string;
    createdBy: string;
    sharedWith: string[];
  }

  function canModifyResource(userId: string, resource: OwnedResource, userRole: Role): boolean {
    // Owner can always modify
    if (resource.ownerId === userId) {
      return true;
    }
    
    // Creator can modify if different from owner
    if (resource.createdBy === userId) {
      return true;
    }
    
    // Shared users can only read
    if (resource.sharedWith.includes(userId)) {
      return false;
    }
    
    // Admin can modify any
    return hasPermission(userRole, 'write:all');
  }

  it('should allow owner to modify', () => {
    const resource: OwnedResource = { id: 'r1', ownerId: 'u1', createdBy: 'u1', sharedWith: [] };
    expect(canModifyResource('u1', resource, 'user')).toBe(true);
  });

  it('should allow creator to modify', () => {
    const resource: OwnedResource = { id: 'r1', ownerId: 'u2', createdBy: 'u1', sharedWith: [] };
    expect(canModifyResource('u1', resource, 'user')).toBe(true);
  });

  it('should deny shared user to modify', () => {
    const resource: OwnedResource = { id: 'r1', ownerId: 'u1', createdBy: 'u1', sharedWith: ['u2'] };
    expect(canModifyResource('u2', resource, 'user')).toBe(false);
  });

  it('should allow admin to modify any', () => {
    const resource: OwnedResource = { id: 'r1', ownerId: 'u1', createdBy: 'u1', sharedWith: [] };
    expect(canModifyResource('admin1', resource, 'admin')).toBe(true);
  });

  it('should deny random user to modify', () => {
    const resource: OwnedResource = { id: 'r1', ownerId: 'u1', createdBy: 'u1', sharedWith: [] };
    expect(canModifyResource('u3', resource, 'user')).toBe(false);
  });
});
