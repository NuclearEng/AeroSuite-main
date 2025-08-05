const mongoose = require('mongoose');

/**
 * Permission Schema
 * 
 * Defines granular permissions that can be assigned to roles or directly to users
 */
const permissionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Permission name is required'],
      unique: true,
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Permission description is required']
    },
    category: {
      type: String,
      required: [true, 'Permission category is required'],
      enum: [
        'supplier', 
        'customer', 
        'inspection', 
        'report', 
        'user', 
        'admin', 
        'dashboard', 
        'document',
        'component',
        'system'
      ]
    },
    action: {
      type: String,
      required: [true, 'Permission action is required'],
      enum: ['create', 'read', 'update', 'delete', 'manage', 'approve', 'execute', 'export']
    },
    resource: {
      type: String,
      required: [true, 'Permission resource is required']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

// Create indexes for better query performance
permissionSchema.index({ name: 1 });
permissionSchema.index({ category: 1 });
permissionSchema.index({ action: 1, resource: 1 });

/**
 * Return a list of all permissions
 */
permissionSchema.statics.getAllPermissions = async function() {
  return await this.find({ isActive: true }).sort({ category: 1, action: 1, resource: 1 });
};

/**
 * Return permissions by category
 */
permissionSchema.statics.getPermissionsByCategory = async function(category) {
  return await this.find({ category, isActive: true }).sort({ action: 1, resource: 1 });
};

/**
 * Return permissions by multiple categories
 */
permissionSchema.statics.getPermissionsByCategories = async function(categories) {
  return await this.find({ category: { $in: categories }, isActive: true }).sort({ category: 1, action: 1, resource: 1 });
};

/**
 * Return all permission names as an array
 */
permissionSchema.statics.getAllPermissionNames = async function() {
  const permissions = await this.find({ isActive: true }).select('name -_id');
  return permissions.map(p => p.name);
};

/**
 * Generate a default set of permissions for the system
 * Used during system initialization
 */
permissionSchema.statics.generateDefaultPermissions = async function() {
  const defaultPermissions = [
    // Supplier permissions
    { name: 'supplier:create', description: 'Create suppliers', category: 'supplier', action: 'create', resource: 'supplier' },
    { name: 'supplier:read', description: 'View suppliers', category: 'supplier', action: 'read', resource: 'supplier' },
    { name: 'supplier:update', description: 'Update suppliers', category: 'supplier', action: 'update', resource: 'supplier' },
    { name: 'supplier:delete', description: 'Delete suppliers', category: 'supplier', action: 'delete', resource: 'supplier' },
    { name: 'supplier:manage', description: 'Manage all aspects of suppliers', category: 'supplier', action: 'manage', resource: 'supplier' },
    { name: 'supplier:read:performance', description: 'View supplier performance data', category: 'supplier', action: 'read', resource: 'performance' },
    { name: 'supplier:read:risk', description: 'View supplier risk data', category: 'supplier', action: 'read', resource: 'risk' },
    { name: 'supplier:update:risk', description: 'Update supplier risk assessments', category: 'supplier', action: 'update', resource: 'risk' },
    { name: 'supplier:read:audit', description: 'View supplier audits', category: 'supplier', action: 'read', resource: 'audit' },
    { name: 'supplier:create:audit', description: 'Create supplier audits', category: 'supplier', action: 'create', resource: 'audit' },
    { name: 'supplier:update:audit', description: 'Update supplier audits', category: 'supplier', action: 'update', resource: 'audit' },
    { name: 'supplier:export:data', description: 'Export supplier data', category: 'supplier', action: 'export', resource: 'supplier' },

    // Customer permissions
    { name: 'customer:create', description: 'Create customers', category: 'customer', action: 'create', resource: 'customer' },
    { name: 'customer:read', description: 'View customers', category: 'customer', action: 'read', resource: 'customer' },
    { name: 'customer:update', description: 'Update customers', category: 'customer', action: 'update', resource: 'customer' },
    { name: 'customer:delete', description: 'Delete customers', category: 'customer', action: 'delete', resource: 'customer' },
    { name: 'customer:manage', description: 'Manage all aspects of customers', category: 'customer', action: 'manage', resource: 'customer' },
    { name: 'customer:export:data', description: 'Export customer data', category: 'customer', action: 'export', resource: 'customer' },

    // Inspection permissions
    { name: 'inspection:create', description: 'Create inspections', category: 'inspection', action: 'create', resource: 'inspection' },
    { name: 'inspection:read', description: 'View inspections', category: 'inspection', action: 'read', resource: 'inspection' },
    { name: 'inspection:update', description: 'Update inspections', category: 'inspection', action: 'update', resource: 'inspection' },
    { name: 'inspection:delete', description: 'Delete inspections', category: 'inspection', action: 'delete', resource: 'inspection' },
    { name: 'inspection:manage', description: 'Manage all aspects of inspections', category: 'inspection', action: 'manage', resource: 'inspection' },
    { name: 'inspection:schedule', description: 'Schedule inspections', category: 'inspection', action: 'create', resource: 'schedule' },
    { name: 'inspection:conduct', description: 'Conduct inspections', category: 'inspection', action: 'execute', resource: 'inspection' },
    { name: 'inspection:approve', description: 'Approve inspection results', category: 'inspection', action: 'approve', resource: 'inspection' },
    { name: 'inspection:read:report', description: 'View inspection reports', category: 'inspection', action: 'read', resource: 'report' },
    { name: 'inspection:export:report', description: 'Export inspection reports', category: 'inspection', action: 'export', resource: 'report' },
    { name: 'inspection:create:defect', description: 'Create defect records', category: 'inspection', action: 'create', resource: 'defect' },
    { name: 'inspection:update:defect', description: 'Update defect records', category: 'inspection', action: 'update', resource: 'defect' },

    // Report permissions
    { name: 'report:create', description: 'Create reports', category: 'report', action: 'create', resource: 'report' },
    { name: 'report:read', description: 'View reports', category: 'report', action: 'read', resource: 'report' },
    { name: 'report:update', description: 'Update reports', category: 'report', action: 'update', resource: 'report' },
    { name: 'report:delete', description: 'Delete reports', category: 'report', action: 'delete', resource: 'report' },
    { name: 'report:manage', description: 'Manage all aspects of reports', category: 'report', action: 'manage', resource: 'report' },
    { name: 'report:export', description: 'Export reports', category: 'report', action: 'export', resource: 'report' },
    { name: 'report:create:template', description: 'Create report templates', category: 'report', action: 'create', resource: 'template' },
    { name: 'report:update:template', description: 'Update report templates', category: 'report', action: 'update', resource: 'template' },

    // User permissions
    { name: 'user:create', description: 'Create users', category: 'user', action: 'create', resource: 'user' },
    { name: 'user:read', description: 'View users', category: 'user', action: 'read', resource: 'user' },
    { name: 'user:update', description: 'Update users', category: 'user', action: 'update', resource: 'user' },
    { name: 'user:delete', description: 'Delete users', category: 'user', action: 'delete', resource: 'user' },
    { name: 'user:manage', description: 'Manage all aspects of users', category: 'user', action: 'manage', resource: 'user' },
    { name: 'user:update:role', description: 'Change user roles', category: 'user', action: 'update', resource: 'role' },
    { name: 'user:update:permission', description: 'Modify user permissions', category: 'user', action: 'update', resource: 'permission' },
    { name: 'user:reset:password', description: 'Reset user passwords', category: 'user', action: 'update', resource: 'password' },

    // Admin permissions
    { name: 'admin:system:settings', description: 'Manage system settings', category: 'admin', action: 'manage', resource: 'settings' },
    { name: 'admin:system:logs', description: 'View system logs', category: 'admin', action: 'read', resource: 'logs' },
    { name: 'admin:system:monitoring', description: 'View system monitoring', category: 'admin', action: 'read', resource: 'monitoring' },
    { name: 'admin:system:backup', description: 'Manage system backups', category: 'admin', action: 'manage', resource: 'backup' },
    { name: 'admin:system:maintenance', description: 'Perform system maintenance', category: 'admin', action: 'execute', resource: 'maintenance' },
    
    // Dashboard permissions
    { name: 'dashboard:read', description: 'View dashboards', category: 'dashboard', action: 'read', resource: 'dashboard' },
    { name: 'dashboard:create', description: 'Create custom dashboards', category: 'dashboard', action: 'create', resource: 'dashboard' },
    { name: 'dashboard:update', description: 'Update dashboards', category: 'dashboard', action: 'update', resource: 'dashboard' },
    { name: 'dashboard:delete', description: 'Delete dashboards', category: 'dashboard', action: 'delete', resource: 'dashboard' },
    { name: 'dashboard:share', description: 'Share dashboards with others', category: 'dashboard', action: 'update', resource: 'share' },
    { name: 'dashboard:export', description: 'Export dashboard data', category: 'dashboard', action: 'export', resource: 'dashboard' },

    // Document permissions
    { name: 'document:create', description: 'Create documents', category: 'document', action: 'create', resource: 'document' },
    { name: 'document:read', description: 'View documents', category: 'document', action: 'read', resource: 'document' },
    { name: 'document:update', description: 'Update documents', category: 'document', action: 'update', resource: 'document' },
    { name: 'document:delete', description: 'Delete documents', category: 'document', action: 'delete', resource: 'document' },
    { name: 'document:manage', description: 'Manage all aspects of documents', category: 'document', action: 'manage', resource: 'document' },
    { name: 'document:approve', description: 'Approve documents', category: 'document', action: 'approve', resource: 'document' },

    // Component permissions
    { name: 'component:create', description: 'Create components', category: 'component', action: 'create', resource: 'component' },
    { name: 'component:read', description: 'View components', category: 'component', action: 'read', resource: 'component' },
    { name: 'component:update', description: 'Update components', category: 'component', action: 'update', resource: 'component' },
    { name: 'component:delete', description: 'Delete components', category: 'component', action: 'delete', resource: 'component' },
    { name: 'component:manage', description: 'Manage all aspects of components', category: 'component', action: 'manage', resource: 'component' },
  ];
  
  // Insert all permissions
  try {
    // Use bulkWrite with ordered: false to continue even if some records already exist
    const operations = defaultPermissions.map(permission => ({
      updateOne: {
        filter: { name: permission.name },
        update: { $set: permission },
        upsert: true
      }
    }));
    
    return await this.bulkWrite(operations, { ordered: false });
  } catch (error) {
    console.error('Error generating default permissions:', error);
    throw error;
  }
};

const Permission = mongoose.model('Permission', permissionSchema);

module.exports = Permission; 