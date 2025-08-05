/**
 * Permission Group Model
 * 
 * Groups related permissions together for easier management
 * 
 * @task TS378 - Advanced user permissions management
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const permissionGroupSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  category: {
    type: String,
    enum: ['system', 'core', 'feature', 'custom'],
    default: 'feature'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isSystem: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: Object,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Pre-save hook to update timestamps
permissionGroupSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

/**
 * Create default permission groups
 */
permissionGroupSchema.statics.createDefaultGroups = async function() {
  const defaultGroups = [
    {
      name: 'user-management',
      displayName: 'User Management',
      description: 'Permissions related to user management',
      category: 'core',
      isSystem: true,
      permissions: [] // Will be populated later
    },
    {
      name: 'customer-management',
      displayName: 'Customer Management',
      description: 'Permissions related to customer management',
      category: 'core',
      isSystem: true,
      permissions: []
    },
    {
      name: 'supplier-management',
      displayName: 'Supplier Management',
      description: 'Permissions related to supplier management',
      category: 'core',
      isSystem: true,
      permissions: []
    },
    {
      name: 'inspection-management',
      displayName: 'Inspection Management',
      description: 'Permissions related to inspection management',
      category: 'core',
      isSystem: true,
      permissions: []
    },
    {
      name: 'report-management',
      displayName: 'Report Management',
      description: 'Permissions related to report management',
      category: 'core',
      isSystem: true,
      permissions: []
    },
    {
      name: 'system-management',
      displayName: 'System Management',
      description: 'Permissions related to system configuration',
      category: 'system',
      isSystem: true,
      permissions: []
    }
  ];

  // Create or update default groups
  for (const groupData of defaultGroups) {
    await this.findOneAndUpdate(
      { name: groupData.name },
      groupData,
      { upsert: true, new: true }
    );
  }
};

/**
 * Assign permissions to groups based on their resource
 */
permissionGroupSchema.statics.assignPermissionsToGroups = async function() {
  const Permission = mongoose.model('Permission');
  
  // Get all permissions
  const permissions = await Permission.find({ isActive: true });
  
  // Group permissions by resource prefix
  const permissionsByResource = permissions.reduce((acc, permission) => {
    const resource = permission.resource.split(':')[0];
    if (!acc[resource]) {
      acc[resource] = [];
    }
    acc[resource].push(permission._id);
    return acc;
  }, {});
  
  // Map resources to groups
  const resourceToGroupMap = {
    'user': 'user-management',
    'role': 'user-management',
    'permission': 'user-management',
    'customer': 'customer-management',
    'supplier': 'supplier-management',
    'inspection': 'inspection-management',
    'report': 'report-management',
    'system': 'system-management',
    'setting': 'system-management',
    'audit': 'system-management'
  };
  
  // Update each group with its permissions
  for (const [resource, permissionIds] of Object.entries(permissionsByResource)) {
    const groupName = resourceToGroupMap[resource] || 'system-management';
    
    await this.findOneAndUpdate(
      { name: groupName },
      { $addToSet: { permissions: { $each: permissionIds } } }
    );
  }
};

const PermissionGroup = mongoose.model('PermissionGroup', permissionGroupSchema);

module.exports = PermissionGroup; 