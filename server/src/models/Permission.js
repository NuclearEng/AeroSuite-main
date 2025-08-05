// Task: TS036 - User Permissions Core Framework
const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    description: 'Unique identifier for the permission'
  },
  displayName: {
    type: String,
    required: true,
    description: 'Human-readable name for the permission'
  },
  description: {
    type: String,
    required: true,
    description: 'Detailed description of what this permission allows'
  },
  resource: {
    type: String,
    required: true,
    enum: [
      'users',
      'customers',
      'suppliers',
      'inspections',
      'reports',
      'dashboard',
      'settings',
      'permissions',
      'roles',
      'audit',
      'api',
      'notifications',
      'files',
      'analytics'
    ],
    description: 'The resource this permission applies to'
  },
  actions: [{
    type: String,
    required: true,
    enum: ['create', 'read', 'update', 'delete', 'execute', 'approve', 'export', 'import'],
    description: 'The actions allowed on the resource'
  }],
  conditions: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
    description: 'Additional conditions for permission application'
  },
  category: {
    type: String,
    required: true,
    enum: ['system', 'data', 'workflow', 'reporting', 'administration'],
    description: 'Permission category for grouping'
  },
  isSystem: {
    type: Boolean,
    default: false,
    description: 'Whether this is a system permission that cannot be modified'
  },
  isActive: {
    type: Boolean,
    default: true,
    description: 'Whether this permission is currently active'
  },
  metadata: {
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    requiresMFA: {
      type: Boolean,
      default: false
    },
    requiresApproval: {
      type: Boolean,
      default: false
    },
    expiresAfter: {
      type: Number,
      description: 'Hours after which permission expires (0 = never)'
    }
  }
}, {
  timestamps: true,
  collection: 'permissions'
});

// Indexes
permissionSchema.index({ name: 1 });
permissionSchema.index({ resource: 1, actions: 1 });
permissionSchema.index({ category: 1 });
permissionSchema.index({ isActive: 1 });

// Virtual for full permission string
permissionSchema.virtual('fullPermission').get(function() {
  return `${this.resource}:${this.actions.join(',')}`;
});

// Methods
permissionSchema.methods.hasAction = function(action) {
  return this.actions.includes(action);
};

permissionSchema.methods.addAction = function(action) {
  if (!this.actions.includes(action)) {
    this.actions.push(action);
  }
};

permissionSchema.methods.removeAction = function(action) {
  this.actions = this.actions.filter(a => a !== action);
};

// Statics
permissionSchema.statics.createSystemPermissions = async function() {
  const systemPermissions = [
    // User Management
    {
      name: 'users.manage',
      displayName: 'Manage Users',
      description: 'Full access to user management',
      resource: 'users',
      actions: ['create', 'read', 'update', 'delete'],
      category: 'administration',
      isSystem: true,
      metadata: { riskLevel: 'high', requiresMFA: true }
    },
    {
      name: 'users.view',
      displayName: 'View Users',
      description: 'View user information',
      resource: 'users',
      actions: ['read'],
      category: 'administration',
      isSystem: true,
      metadata: { riskLevel: 'low' }
    },
    
    // Customer Management
    {
      name: 'customers.manage',
      displayName: 'Manage Customers',
      description: 'Full access to customer management',
      resource: 'customers',
      actions: ['create', 'read', 'update', 'delete'],
      category: 'data',
      isSystem: true,
      metadata: { riskLevel: 'medium' }
    },
    {
      name: 'customers.view',
      displayName: 'View Customers',
      description: 'View customer information',
      resource: 'customers',
      actions: ['read'],
      category: 'data',
      isSystem: true,
      metadata: { riskLevel: 'low' }
    },
    
    // Supplier Management
    {
      name: 'suppliers.manage',
      displayName: 'Manage Suppliers',
      description: 'Full access to supplier management',
      resource: 'suppliers',
      actions: ['create', 'read', 'update', 'delete'],
      category: 'data',
      isSystem: true,
      metadata: { riskLevel: 'medium' }
    },
    
    // Inspection Management
    {
      name: 'inspections.manage',
      displayName: 'Manage Inspections',
      description: 'Full access to inspection management',
      resource: 'inspections',
      actions: ['create', 'read', 'update', 'delete', 'approve'],
      category: 'workflow',
      isSystem: true,
      metadata: { riskLevel: 'high', requiresApproval: true }
    },
    {
      name: 'inspections.create',
      displayName: 'Create Inspections',
      description: 'Create new inspections',
      resource: 'inspections',
      actions: ['create'],
      category: 'workflow',
      isSystem: true,
      metadata: { riskLevel: 'medium' }
    },
    {
      name: 'inspections.approve',
      displayName: 'Approve Inspections',
      description: 'Approve or reject inspections',
      resource: 'inspections',
      actions: ['approve'],
      category: 'workflow',
      isSystem: true,
      metadata: { riskLevel: 'high', requiresMFA: true }
    },
    
    // Report Management
    {
      name: 'reports.generate',
      displayName: 'Generate Reports',
      description: 'Generate and view reports',
      resource: 'reports',
      actions: ['create', 'read', 'execute'],
      category: 'reporting',
      isSystem: true,
      metadata: { riskLevel: 'medium' }
    },
    {
      name: 'reports.export',
      displayName: 'Export Reports',
      description: 'Export reports to various formats',
      resource: 'reports',
      actions: ['export'],
      category: 'reporting',
      isSystem: true,
      metadata: { riskLevel: 'medium' }
    },
    
    // Settings Management
    {
      name: 'settings.manage',
      displayName: 'Manage Settings',
      description: 'Modify system settings',
      resource: 'settings',
      actions: ['read', 'update'],
      category: 'administration',
      isSystem: true,
      metadata: { riskLevel: 'critical', requiresMFA: true }
    },
    
    // Permission Management
    {
      name: 'permissions.manage',
      displayName: 'Manage Permissions',
      description: 'Manage user permissions and roles',
      resource: 'permissions',
      actions: ['create', 'read', 'update', 'delete'],
      category: 'administration',
      isSystem: true,
      metadata: { riskLevel: 'critical', requiresMFA: true }
    },
    
    // Audit Log Access
    {
      name: 'audit.view',
      displayName: 'View Audit Logs',
      description: 'View system audit logs',
      resource: 'audit',
      actions: ['read'],
      category: 'administration',
      isSystem: true,
      metadata: { riskLevel: 'high' }
    }
  ];

  for (const permission of systemPermissions) {
    await this.findOneAndUpdate(
      { name: permission.name },
      permission,
      { upsert: true, new: true }
    );
  }
};

// Middleware
permissionSchema.pre('save', function(next) {
  // Remove duplicate actions
  this.actions = [...new Set(this.actions)];
  next();
});

permissionSchema.pre('remove', async function(next) {
  if (this.isSystem) {
    const error = new Error('Cannot delete system permissions');
    return next(error);
  }
  next();
});

const Permission = mongoose.model('Permission', permissionSchema);

module.exports = Permission; 