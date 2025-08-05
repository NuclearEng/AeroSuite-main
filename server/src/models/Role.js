// Task: TS036 - User Permissions Core Framework
const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    description: 'Unique identifier for the role'
  },
  displayName: {
    type: String,
    required: true,
    description: 'Human-readable name for the role'
  },
  description: {
    type: String,
    required: true,
    description: 'Detailed description of the role and its purpose'
  },
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission',
    description: 'Array of permissions assigned to this role'
  }],
  hierarchy: {
    level: {
      type: Number,
      required: true,
      default: 100,
      description: 'Hierarchy level (lower number = higher authority)'
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      description: 'Parent role in hierarchy'
    },
    inheritsPermissions: {
      type: Boolean,
      default: true,
      description: 'Whether this role inherits permissions from parent'
    }
  },
  restrictions: {
    maxUsers: {
      type: Number,
      default: 0,
      description: 'Maximum number of users that can have this role (0 = unlimited)'
    },
    requiresMFA: {
      type: Boolean,
      default: false,
      description: 'Whether users with this role must have MFA enabled'
    },
    requiresApproval: {
      type: Boolean,
      default: false,
      description: 'Whether assigning this role requires approval'
    },
    ipWhitelist: [{
      type: String,
      description: 'IP addresses allowed for this role'
    }],
    timeRestrictions: {
      enabled: { type: Boolean, default: false },
      timezone: { type: String, default: 'UTC' },
      allowedDays: [{
        type: Number,
        min: 0,
        max: 6,
        description: 'Days of week (0=Sunday, 6=Saturday)'
      }],
      allowedHours: {
        start: { type: Number, min: 0, max: 23 },
        end: { type: Number, min: 0, max: 23 }
      }
    }
  },
  metadata: {
    category: {
      type: String,
      required: true,
      enum: ['system', 'organization', 'project', 'custom'],
      default: 'custom'
    },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    color: {
      type: String,
      default: '#6B7280',
      description: 'Color for UI display'
    },
    icon: {
      type: String,
      default: 'user-circle',
      description: 'Icon identifier for UI display'
    }
  },
  isSystem: {
    type: Boolean,
    default: false,
    description: 'Whether this is a system role that cannot be modified'
  },
  isActive: {
    type: Boolean,
    default: true,
    description: 'Whether this role is currently active'
  },
  isDefault: {
    type: Boolean,
    default: false,
    description: 'Whether this is the default role for new users'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    description: 'User who created this role'
  },
  modifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    description: 'User who last modified this role'
  }
}, {
  timestamps: true,
  collection: 'roles'
});

// Indexes
roleSchema.index({ name: 1 });
roleSchema.index({ 'hierarchy.level': 1 });
roleSchema.index({ isActive: 1 });
roleSchema.index({ isDefault: 1 });
roleSchema.index({ 'metadata.category': 1 });

// Virtual for user count
roleSchema.virtual('userCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'role',
  count: true
});

// Methods
roleSchema.methods.hasPermission = async function(permissionName) {
  await this.populate('permissions');
  return this.permissions.some(p => p.name === permissionName);
};

roleSchema.methods.addPermission = async function(permissionId) {
  if (!this.permissions.includes(permissionId)) {
    this.permissions.push(permissionId);
    await this.save();
  }
};

roleSchema.methods.removePermission = async function(permissionId) {
  this.permissions = this.permissions.filter(p => 
    p.toString() !== permissionId.toString()
  );
  await this.save();
};

roleSchema.methods.getEffectivePermissions = async function() {
  const permissions = new Set();
  
  // Add own permissions
  await this.populate('permissions');
  this.permissions.forEach(p => permissions.add(p));
  
  // Add inherited permissions if enabled
  if (this.hierarchy.inheritsPermissions && this.hierarchy.parent) {
    const parentRole = await this.model('Role')
      .findById(this.hierarchy.parent)
      .populate('permissions');
    
    if (parentRole) {
      const parentPerms = await parentRole.getEffectivePermissions();
      parentPerms.forEach(p => permissions.add(p));
    }
  }
  
  return Array.from(permissions);
};

// Statics
roleSchema.statics.createSystemRoles = async function() {
  const Permission = mongoose.model('Permission');
  
  const systemRoles = [
    {
      name: 'superadmin',
      displayName: 'Super Administrator',
      description: 'Full system access with all permissions',
      hierarchy: { level: 1 },
      metadata: { 
        category: 'system', 
        riskLevel: 'critical',
        color: '#DC2626',
        icon: 'shield-check'
      },
      isSystem: true,
      restrictions: {
        requiresMFA: true,
        maxUsers: 2
      }
    },
    {
      name: 'admin',
      displayName: 'Administrator',
      description: 'Administrative access with most permissions',
      hierarchy: { level: 10 },
      metadata: { 
        category: 'system', 
        riskLevel: 'high',
        color: '#F59E0B',
        icon: 'shield'
      },
      isSystem: true,
      restrictions: {
        requiresMFA: true
      }
    },
    {
      name: 'manager',
      displayName: 'Manager',
      description: 'Management access with elevated permissions',
      hierarchy: { level: 20 },
      metadata: { 
        category: 'organization', 
        riskLevel: 'medium',
        color: '#3B82F6',
        icon: 'briefcase'
      },
      isSystem: true
    },
    {
      name: 'supervisor',
      displayName: 'Supervisor',
      description: 'Supervisory access with team management permissions',
      hierarchy: { level: 30 },
      metadata: { 
        category: 'organization', 
        riskLevel: 'medium',
        color: '#8B5CF6',
        icon: 'users'
      },
      isSystem: true
    },
    {
      name: 'inspector',
      displayName: 'Inspector',
      description: 'Inspection and quality control permissions',
      hierarchy: { level: 40 },
      metadata: { 
        category: 'organization', 
        riskLevel: 'medium',
        color: '#10B981',
        icon: 'clipboard-check'
      },
      isSystem: true
    },
    {
      name: 'operator',
      displayName: 'Operator',
      description: 'Standard user with operational permissions',
      hierarchy: { level: 50 },
      metadata: { 
        category: 'organization', 
        riskLevel: 'low',
        color: '#6B7280',
        icon: 'user'
      },
      isSystem: true,
      isDefault: true
    },
    {
      name: 'viewer',
      displayName: 'Viewer',
      description: 'Read-only access to permitted resources',
      hierarchy: { level: 60 },
      metadata: { 
        category: 'organization', 
        riskLevel: 'low',
        color: '#9CA3AF',
        icon: 'eye'
      },
      isSystem: true
    },
    {
      name: 'guest',
      displayName: 'Guest',
      description: 'Limited access for external users',
      hierarchy: { level: 100 },
      metadata: { 
        category: 'organization', 
        riskLevel: 'low',
        color: '#D1D5DB',
        icon: 'user-circle'
      },
      isSystem: true,
      restrictions: {
        timeRestrictions: {
          enabled: true
        }
      }
    }
  ];

  // Define permission mappings for each role
  const rolePermissions = {
    superadmin: ['*'], // All permissions
    admin: [
      'users.manage', 'customers.manage', 'suppliers.manage',
      'inspections.manage', 'reports.generate', 'reports.export',
      'settings.manage', 'permissions.manage', 'audit.view'
    ],
    manager: [
      'users.view', 'customers.manage', 'suppliers.manage',
      'inspections.manage', 'reports.generate', 'reports.export',
      'audit.view'
    ],
    supervisor: [
      'customers.view', 'suppliers.view', 'inspections.manage',
      'reports.generate', 'reports.export'
    ],
    inspector: [
      'customers.view', 'suppliers.view', 'inspections.create',
      'inspections.approve', 'reports.generate'
    ],
    operator: [
      'customers.view', 'suppliers.view', 'inspections.create',
      'reports.generate'
    ],
    viewer: [
      'customers.view', 'suppliers.view', 'reports.generate'
    ],
    guest: [
      'reports.generate'
    ]
  };

  // Create or update roles
  for (const roleData of systemRoles) {
    const role = await this.findOneAndUpdate(
      { name: roleData.name },
      roleData,
      { upsert: true, new: true }
    );

    // Assign permissions
    const permissionNames = rolePermissions[roleData.name];
    if (permissionNames && permissionNames.length > 0) {
      if (permissionNames[0] === '*') {
        // Assign all permissions for superadmin
        const allPermissions = await Permission.find({ isActive: true });
        role.permissions = allPermissions.map(p => p._id);
      } else {
        // Assign specific permissions
        const permissions = await Permission.find({ 
          name: { $in: permissionNames },
          isActive: true 
        });
        role.permissions = permissions.map(p => p._id);
      }
      await role.save();
    }
  }
};

// Middleware
roleSchema.pre('save', async function(next) {
  // Ensure only one default role
  if (this.isDefault && this.isModified('isDefault')) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id }, isDefault: true },
      { isDefault: false }
    );
  }
  
  // Validate hierarchy
  if (this.hierarchy.parent) {
    const parentRole = await this.constructor.findById(this.hierarchy.parent);
    if (parentRole && parentRole.hierarchy.level >= this.hierarchy.level) {
      const error = new Error('Child role must have higher hierarchy level than parent');
      return next(error);
    }
  }
  
  next();
});

roleSchema.pre('remove', async function(next) {
  if (this.isSystem) {
    const error = new Error('Cannot delete system roles');
    return next(error);
  }
  
  // Check if role is in use
  const User = mongoose.model('User');
  const userCount = await User.countDocuments({ role: this._id });
  
  if (userCount > 0) {
    const error = new Error(`Cannot delete role. ${userCount} users have this role assigned.`);
    return next(error);
  }
  
  next();
});

const Role = mongoose.model('Role', roleSchema);

module.exports = Role; 