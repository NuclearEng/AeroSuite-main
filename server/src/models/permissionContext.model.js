/**
 * Permission Context Model
 * 
 * Defines contexts in which permissions can be applied
 * 
 * @task TS378 - Advanced user permissions management
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const permissionContextSchema = new Schema({
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
  // The type of resource this context applies to
  resourceType: {
    type: String,
    required: true,
    trim: true
  },
  // Conditions that define when this context applies
  conditions: {
    type: Object,
    default: {}
  },
  // Permissions granted in this context
  permissions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }],
  // Whether this context is active
  isActive: {
    type: Boolean,
    default: true
  },
  // Whether this is a system-defined context
  isSystem: {
    type: Boolean,
    default: false
  },
  // Additional metadata
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
permissionContextSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

/**
 * Create default permission contexts
 */
permissionContextSchema.statics.createDefaultContexts = async function() {
  const Permission = mongoose.model('Permission');
  
  // Get necessary permissions
  const [
    viewCustomer,
    editCustomer,
    viewSupplier,
    editSupplier,
    viewInspection,
    editInspection
  ] = await Promise.all([
    Permission.findOne({ name: 'customer:read' }),
    Permission.findOne({ name: 'customer:update' }),
    Permission.findOne({ name: 'supplier:read' }),
    Permission.findOne({ name: 'supplier:update' }),
    Permission.findOne({ name: 'inspection:read' }),
    Permission.findOne({ name: 'inspection:update' })
  ]);
  
  const defaultContexts = [
    {
      name: 'own-customer',
      displayName: 'Own Customer',
      description: 'Permissions for a user\'s own customer',
      resourceType: 'customer',
      conditions: {
        field: 'customerId',
        operator: 'equals',
        valueFrom: 'user.customerId'
      },
      permissions: [
        viewCustomer?._id
      ],
      isSystem: true
    },
    {
      name: 'assigned-customer',
      displayName: 'Assigned Customer',
      description: 'Permissions for customers assigned to a user',
      resourceType: 'customer',
      conditions: {
        field: 'assignedUsers',
        operator: 'contains',
        valueFrom: 'user._id'
      },
      permissions: [
        viewCustomer?._id,
        editCustomer?._id
      ],
      isSystem: true
    },
    {
      name: 'assigned-supplier',
      displayName: 'Assigned Supplier',
      description: 'Permissions for suppliers assigned to a user',
      resourceType: 'supplier',
      conditions: {
        field: 'assignedUsers',
        operator: 'contains',
        valueFrom: 'user._id'
      },
      permissions: [
        viewSupplier?._id,
        editSupplier?._id
      ],
      isSystem: true
    },
    {
      name: 'assigned-inspection',
      displayName: 'Assigned Inspection',
      description: 'Permissions for inspections assigned to a user',
      resourceType: 'inspection',
      conditions: {
        field: 'assignedTo',
        operator: 'equals',
        valueFrom: 'user._id'
      },
      permissions: [
        viewInspection?._id,
        editInspection?._id
      ],
      isSystem: true
    },
    {
      name: 'created-inspection',
      displayName: 'Created Inspection',
      description: 'Permissions for inspections created by a user',
      resourceType: 'inspection',
      conditions: {
        field: 'createdBy',
        operator: 'equals',
        valueFrom: 'user._id'
      },
      permissions: [
        viewInspection?._id
      ],
      isSystem: true
    }
  ];

  // Create or update default contexts
  for (const contextData of defaultContexts) {
    await this.findOneAndUpdate(
      { name: contextData.name },
      contextData,
      { upsert: true, new: true }
    );
  }
};

/**
 * Check if context applies to a resource
 */
permissionContextSchema.methods.appliesToResource = function(resource, user) {
  if (!resource || !user) return false;
  
  const condition = this.conditions;
  if (!condition || !condition.field || !condition.operator) return false;
  
  // Get the field value from the resource
  const resourceValue = resource[condition.field];
  if (resourceValue === undefined) return false;
  
  // Get the comparison value
  let comparisonValue;
  if (condition.valueFrom && condition.valueFrom.startsWith('user.')) {
    const userField = condition.valueFrom.replace('user.', '');
    comparisonValue = user[userField];
  } else {
    comparisonValue = condition.value;
  }
  
  if (comparisonValue === undefined) return false;
  
  // Compare based on the operator
  switch (condition.operator) {
    case 'equals':
      return resourceValue && resourceValue.toString() === comparisonValue.toString();
    case 'contains':
      if (Array.isArray(resourceValue)) {
        return resourceValue.some(v => v && v.toString() === comparisonValue.toString());
      }
      return false;
    case 'greaterThan':
      return resourceValue > comparisonValue;
    case 'lessThan':
      return resourceValue < comparisonValue;
    default:
      return false;
  }
};

const PermissionContext = mongoose.model('PermissionContext', permissionContextSchema);

module.exports = PermissionContext; 