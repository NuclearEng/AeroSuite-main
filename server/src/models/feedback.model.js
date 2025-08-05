/**
 * Feedback Model
 * 
 * Stores customer feedback data including ratings, comments, and sentiment analysis
 * 
 * @task TS379 - Customer feedback collection system
 */

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const feedbackSchema = new Schema({
  // The user who submitted the feedback (if authenticated)
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  // Customer associated with the feedback
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: false
  },
  // Type of feedback
  feedbackType: {
    type: String,
    enum: ['general', 'feature', 'bug', 'support', 'suggestion', 'other'],
    default: 'general'
  },
  // The source/context of the feedback
  source: {
    type: String,
    enum: ['app', 'website', 'email', 'support', 'survey', 'other'],
    required: true
  },
  // The page or feature the feedback is about
  context: {
    page: String,
    feature: String,
    metadata: Object
  },
  // Numerical rating (1-5)
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: function() {
      return this.feedbackType === 'general';
    }
  },
  // Feedback title
  title: {
    type: String,
    trim: true,
    maxlength: 200
  },
  // Feedback content
  content: {
    type: String,
    required: true,
    trim: true
  },
  // Attached files (e.g., screenshots)
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    path: String
  }],
  // Contact information for anonymous feedback
  contactInfo: {
    name: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: function(v) {
          return v === '' || /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: 'Please enter a valid email address'
      }
    },
    phone: {
      type: String,
      trim: true
    },
    allowContact: {
      type: Boolean,
      default: false
    }
  },
  // Sentiment analysis results
  sentiment: {
    score: Number,
    magnitude: Number,
    label: {
      type: String,
      enum: ['positive', 'negative', 'neutral', 'mixed']
    },
    analyzed: {
      type: Boolean,
      default: false
    }
  },
  // Tags for categorization
  tags: [String],
  // Status of the feedback
  status: {
    type: String,
    enum: ['new', 'reviewed', 'in_progress', 'resolved', 'closed'],
    default: 'new'
  },
  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'low'
  },
  // Assigned to (staff member)
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Notes from staff (internal)
  internalNotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Response to the feedback
  response: {
    content: String,
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date,
    isPublic: {
      type: Boolean,
      default: false
    }
  },
  // User device and browser information
  userAgent: {
    browser: String,
    device: String,
    os: String
  },
  // IP address (stored securely)
  ipAddress: {
    type: String
  },
  // Flag for featured feedback
  isFeatured: {
    type: Boolean,
    default: false
  },
  // Flag for anonymous feedback
  isAnonymous: {
    type: Boolean,
    default: false
  },
  // Flag for whether this feedback has been addressed
  isAddressed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for faster queries
feedbackSchema.index({ feedbackType: 1, status: 1, createdAt: -1 });
feedbackSchema.index({ 'context.page': 1 });
feedbackSchema.index({ customer: 1 });
feedbackSchema.index({ tags: 1 });

// Virtual for time elapsed since feedback was submitted
feedbackSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Static method to get feedback statistics
feedbackSchema.statics.getStatistics = async function(filters = {}) {
  const match = { ...filters };
  
  const stats = await this.aggregate([
    { $match: match },
    { 
      $facet: {
        byType: [
          { $group: { _id: '$feedbackType', count: { $sum: 1 } } }
        ],
        byRating: [
          { $match: { rating: { $exists: true } } },
          { $group: { _id: '$rating', count: { $sum: 1 } } }
        ],
        byStatus: [
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ],
        averageRating: [
          { $match: { rating: { $exists: true } } },
          { $group: { _id: null, avg: { $avg: '$rating' } } }
        ],
        totalCount: [
          { $count: 'count' }
        ],
        recentTrend: [
          { 
            $match: { 
              createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
            } 
          },
          {
            $group: {
              _id: { 
                $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } 
              },
              count: { $sum: 1 },
              avgRating: { $avg: '$rating' }
            }
          },
          { $sort: { '_id': 1 } }
        ]
      }
    }
  ]);
  
  return stats[0];
};

// Method to analyze sentiment using basic rules
// This can be replaced with a more sophisticated ML-based approach later
feedbackSchema.methods.analyzeSentiment = function() {
  if (!this.content) return;
  
  const text = this.content.toLowerCase();
  
  // Simple word lists for basic sentiment analysis
  const positiveWords = ['good', 'great', 'excellent', 'amazing', 'awesome', 'love', 'like', 'helpful', 'best', 'fantastic', 'perfect'];
  const negativeWords = ['bad', 'poor', 'terrible', 'awful', 'horrible', 'hate', 'worst', 'useless', 'difficult', 'disappointing', 'frustrating'];
  
  let positiveScore = 0;
  let negativeScore = 0;
  
  // Count occurrences of positive and negative words
  positiveWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) positiveScore += matches.length;
  });
  
  negativeWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) negativeScore += matches.length;
  });
  
  // Calculate overall sentiment
  const totalScore = positiveScore - negativeScore;
  const magnitude = positiveScore + negativeScore;
  
  let label = 'neutral';
  if (totalScore > 0) label = 'positive';
  else if (totalScore < 0) label = 'negative';
  if (positiveScore > 0 && negativeScore > 0) label = 'mixed';
  
  // Update sentiment fields
  this.sentiment = {
    score: totalScore,
    magnitude: magnitude,
    label: label,
    analyzed: true
  };
};

// Pre-save hook to analyze sentiment
feedbackSchema.pre('save', function(next) {
  // Only analyze if content changed or sentiment not yet analyzed
  if (this.isModified('content') || !this.sentiment?.analyzed) {
    this.analyzeSentiment();
  }
  
  // Set isAnonymous flag if no user is associated
  if (!this.user) {
    this.isAnonymous = true;
  }
  
  next();
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback; 