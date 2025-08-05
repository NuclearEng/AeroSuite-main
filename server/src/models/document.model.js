const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Document Schema
 * 
 * Stores metadata about documents in the system.
 * The actual files are stored in the file system or S3.
 */
const documentSchema = new Schema(
  {
    // Unique document ID (UUID)
    documentId: {
      type: String,
      required: true,
      unique: true
    },
    
    // Original filename provided by the user
    originalFilename: {
      type: String,
      required: true
    },
    
    // Document title (optional, user-provided)
    title: {
      type: String,
      trim: true
    },
    
    // Document description (optional)
    description: {
      type: String,
      trim: true
    },
    
    // MIME type
    mimeType: {
      type: String,
      required: true
    },
    
    // File size in bytes
    size: {
      type: Number,
      required: true
    },
    
    // Storage type (local, s3)
    storageType: {
      type: String,
      required: true,
      enum: ['local', 's3']
    },
    
    // Storage path (file path or S3 key)
    storagePath: {
      type: String,
      required: true
    },
    
    // Document category
    category: {
      type: String,
      enum: [
        'report',
        'inspection',
        'certificate',
        'manual',
        'specification',
        'contract',
        'invoice',
        'image',
        'drawing',
        'other'
      ],
      default: 'other'
    },
    
    // Document status
    status: {
      type: String,
      enum: ['active', 'archived', 'deleted'],
      default: 'active'
    },
    
    // Tags for searching and filtering
    tags: [String],
    
    // Document type
    type: {
      type: String,
      enum: [
        'document',
        'image',
        'spreadsheet',
        'presentation',
        'pdf',
        'archive',
        'text',
        'cad',
        'version',
        'thumbnail',
        'other'
      ],
      default: 'document'
    },
    
    // Versioning information
    version: {
      isVersion: {
        type: Boolean,
        default: false
      },
      versionNumber: {
        type: Number,
        default: 1
      },
      originalDocumentId: {
        type: String
      },
      previousVersionId: {
        type: String
      },
      versionNotes: {
        type: String
      }
    },
    
    // Related entity information
    entity: {
      entityType: {
        type: String,
        enum: [
          'supplier',
          'customer',
          'inspection',
          'component',
          'user',
          'report',
          'none'
        ],
        default: 'none'
      },
      entityId: {
        type: Schema.Types.ObjectId,
        refPath: 'entity.entityType'
      }
    },
    
    // Access control
    access: {
      isPublic: {
        type: Boolean,
        default: false
      },
      allowedRoles: {
        type: [String],
        default: ['admin']
      },
      allowedUsers: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
      }]
    },
    
    // Thumbnail information
    thumbnail: {
      hasThumbnail: {
        type: Boolean,
        default: false
      },
      thumbnailId: {
        type: String
      }
    },
    
    // Upload information
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    // Custom metadata (flexible field for additional info)
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster queries
documentSchema.index({ documentId: 1 });
documentSchema.index({ 'entity.entityType': 1, 'entity.entityId': 1 });
documentSchema.index({ tags: 1 });
documentSchema.index({ 'version.originalDocumentId': 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ category: 1 });
documentSchema.index({ uploadedBy: 1 });
documentSchema.index({ createdAt: -1 });

// Method to check if user has access to document
documentSchema.methods.hasAccess = function(user) {
  // Public documents are accessible to everyone
  if (this.access.isPublic) {
    return true;
  }
  
  // Document owner always has access
  if (this.uploadedBy.toString() === user._id.toString()) {
    return true;
  }
  
  // Check user role
  if (user.role && this.access.allowedRoles.includes(user.role)) {
    return true;
  }
  
  // Check if user is in allowed users
  if (this.access.allowedUsers.some(id => id.toString() === user._id.toString())) {
    return true;
  }
  
  return false;
};

// Virtual for download URL
documentSchema.virtual('downloadUrl').get(function() {
  return `/api/documents/download/${this.documentId}`;
});

// Virtual for preview URL (if available)
documentSchema.virtual('previewUrl').get(function() {
  if (this.thumbnail.hasThumbnail) {
    return `/api/documents/preview/${this.documentId}`;
  }
  return null;
});

const Document = mongoose.model('Document', documentSchema);

module.exports = Document; 