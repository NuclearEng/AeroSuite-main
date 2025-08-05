const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Report Template Schema
 * Defines the structure for storing custom report templates
 */
const ReportTemplateSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Report template name is required'],
      trim: true,
      maxlength: [100, 'Report template name cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Report template description cannot exceed 500 characters']
    },
    keywords: {
      type: String,
      trim: true
    },
    author: {
      type: String,
      trim: true
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    category: {
      type: String,
      enum: ['inspection', 'supplier', 'customer', 'performance', 'general'],
      default: 'general'
    },
    sections: [
      {
        title: {
          type: String,
          required: true
        },
        description: {
          type: String
        },
        type: {
          type: String,
          enum: ['text', 'table', 'chart', 'metrics', 'image'],
          required: true
        },
        content: {
          type: String
        },
        dataSource: {
          model: {
            type: String,
            enum: ['Inspection', 'Supplier', 'Customer', 'User', 'Component']
          },
          query: {
            filter: {
              type: Schema.Types.Mixed
            },
            populate: [String],
            sort: {
              type: Schema.Types.Mixed
            },
            limit: {
              type: Number
            }
          }
        },
        columns: [
          {
            id: {
              type: String,
              required: true
            },
            label: {
              type: String,
              required: true
            },
            format: {
              type: String,
              enum: ['text', 'date', 'number', 'currency', 'percentage', 'boolean']
            }
          }
        ],
        metrics: [
          {
            label: {
              type: String,
              required: true
            },
            valueField: {
              type: String,
              required: true
            },
            format: {
              type: String,
              enum: ['text', 'date', 'number', 'currency', 'percentage', 'boolean']
            },
            trendField: {
              type: String
            }
          }
        ],
        chartOptions: {
          type: {
            type: String,
            enum: ['bar', 'line', 'pie', 'doughnut', 'radar'],
            default: 'bar'
          },
          xAxis: {
            type: String
          },
          yAxis: {
            type: String
          },
          title: {
            type: String
          }
        }
      }
    ],
    filters: [
      {
        name: {
          type: String,
          required: true
        },
        label: {
          type: String,
          required: true
        },
        type: {
          type: String,
          enum: ['text', 'date', 'number', 'select', 'boolean'],
          required: true
        },
        options: [
          {
            value: {
              type: Schema.Types.Mixed
            },
            label: {
              type: String
            }
          }
        ],
        default: {
          type: Schema.Types.Mixed
        },
        required: {
          type: Boolean,
          default: false
        }
      }
    ],
    sortOptions: [
      {
        field: {
          type: String,
          required: true
        },
        label: {
          type: String,
          required: true
        },
        default: {
          type: Boolean,
          default: false
        },
        direction: {
          type: String,
          enum: ['asc', 'desc'],
          default: 'asc'
        }
      }
    ],
    pageOptions: {
      size: {
        type: String,
        enum: ['A4', 'Letter', 'Legal'],
        default: 'A4'
      },
      orientation: {
        type: String,
        enum: ['portrait', 'landscape'],
        default: 'portrait'
      },
      margin: {
        type: Number,
        default: 50
      }
    }
  },
  {
    timestamps: true
  }
);

/**
 * Pre-save hook to ensure default values
 */
ReportTemplateSchema.pre('save', function(next) {
  // Ensure at least one section exists
  if (!this.sections || this.sections.length === 0) {
    this.sections = [
      {
        title: 'Default Section',
        type: 'text',
        content: 'This is a default section. Please edit this template to customize it.'
      }
    ];
  }
  
  next();
});

// Create and export the model
const ReportTemplate = mongoose.model('ReportTemplate', ReportTemplateSchema);
module.exports = ReportTemplate; 