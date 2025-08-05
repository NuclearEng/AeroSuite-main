const mongoose = require('mongoose');

/**
 * Role Schema
 * 
 * Defines roles and their associated permissions
 */
const roleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Role name is required'],
      unique: true,
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Role description is required']
    },
    permissions: [{
      type: String,
      ref: 'Permission'
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    isSystem: {
      type: Boolean,
      default: false,
      description: 'System roles cannot be deleted'
    },
    priority: {
      type: Number,
      default: 0,
      description: 'Higher priority roles take precedence in case of conflicts'
    }
  },
  { timestamps: true }
);

// Create indexes for better query performance
roleSchema.index({ name: 1 });
roleSchema.index({ isSystem: 1 });
roleSchema.index({ isActive: 1 });

/**
 * Return a list of all active roles
 */
roleSchema.statics.getAllRoles = async function() {
  return await this.find({ isActive: true }).sort({ priority: -1, name: 1 });
};

/**
 * Get role by name
 */
roleSchema.statics.getRoleByName = async function(name) {
  return await this.findOne({ name, isActive: true });
};

/**
 * Add permission to role
 */
roleSchema.statics.addPermissionToRole = async function(roleName, permissionName) {
  return await this.findOneAndUpdate(
    { name: roleName, isActive: true },
    { $addToSet: { permissions: permissionName } },
    { new: true }
  );
};

/**
 * Remove permission from role
 */
roleSchema.statics.removePermissionFromRole = async function(roleName, permissionName) {
  return await this.findOneAndUpdate(
    { name: roleName, isActive: true },
    { $pull: { permissions: permissionName } },
    { new: true }
  );
};

/**
 * Add multiple permissions to role
 */
roleSchema.statics.addPermissionsToRole = async function(roleName, permissionNames) {
  return await this.findOneAndUpdate(
    { name: roleName, isActive: true },
    { $addToSet: { permissions: { $each: permissionNames } } },
    { new: true }
  );
};

/**
 * Remove multiple permissions from role
 */
roleSchema.statics.removePermissionsFromRole = async function(roleName, permissionNames) {
  return await this.findOneAndUpdate(
    { name: roleName, isActive: true },
    { $pull: { permissions: { $in: permissionNames } } },
    { new: true }
  );
};

/**
 * Set permissions for role (replaces all permissions)
 */
roleSchema.statics.setRolePermissions = async function(roleName, permissionNames) {
  return await this.findOneAndUpdate(
    { name: roleName, isActive: true },
    { $set: { permissions: permissionNames } },
    { new: true }
  );
};

/**
 * Generate default system roles
 */
roleSchema.statics.generateDefaultRoles = async function() {
  const Permission = mongoose.model('Permission');
  
  // Get all permission names
  const allPermissions = await Permission.getAllPermissionNames();
  
  // Admin role has all permissions
  const adminPermissions = allPermissions;
  
  // Manager role has most permissions except some admin-specific ones
  const managerPermissions = allPermissions.filter(p => 
    !p.startsWith('admin:system:') && 
    !p.includes(':delete') &&
    p !== 'user:update:role' &&
    p !== 'user:update:permission'
  );
  
  // Inspector role has permissions related to inspections and limited supplier/customer access
  const inspectorPermissions = [
    'supplier:read', 
    'supplier:read:performance', 
    'supplier:read:risk',
    'supplier:read:audit',
    'customer:read',
    'inspection:read',
    'inspection:create',
    'inspection:update',
    'inspection:conduct',
    'inspection:read:report',
    'inspection:create:defect',
    'inspection:update:defect',
    'inspection:export:report',
    'component:read',
    'document:read',
    'report:read',
    'report:export',
    'dashboard:read',
    'dashboard:create',
    'dashboard:update'
  ];
  
  // Customer role has limited access to their own data
  const customerPermissions = [
    'customer:read',
    'inspection:read',
    'inspection:read:report',
    'report:read',
    'report:export',
    'document:read',
    'dashboard:read'
  ];
  
  // Viewer role has read-only access
  const viewerPermissions = allPermissions.filter(p => 
    p.includes(':read') || 
    p.includes(':export')
  );
  
  const defaultRoles = [
    {
      name: 'admin',
      description: 'Administrator with full system access',
      permissions: adminPermissions,
      isSystem: true,
      priority: 100
    },
    {
      name: 'manager',
      description: 'Manager with access to most features',
      permissions: managerPermissions,
      isSystem: true,
      priority: 80
    },
    {
      name: 'inspector',
      description: 'Inspector with access to inspection features',
      permissions: inspectorPermissions,
      isSystem: true,
      priority: 60
    },
    {
      name: 'customer',
      description: 'Customer with limited access to their own data',
      permissions: customerPermissions,
      isSystem: true,
      priority: 40
    },
    {
      name: 'viewer',
      description: 'Viewer with read-only access',
      permissions: viewerPermissions,
      isSystem: true,
      priority: 20
    }
  ];
  
  // Insert all roles
  try {
    // Use bulkWrite with ordered: false to continue even if some records already exist
    const operations = defaultRoles.map(role => ({
      updateOne: {
        filter: { name: role.name },
        update: { 
          $set: { 
            description: role.description,
            isSystem: role.isSystem,
            priority: role.priority
          },
          $setOnInsert: { permissions: role.permissions }
        },
        upsert: true
      }
    }));
    
    return await this.bulkWrite(operations, { ordered: false });
  } catch (error) {
    console.error('Error generating default roles:', error);
    throw error;
  }
};

const Role = mongoose.model('Role', roleSchema);

module.exports = Role; 