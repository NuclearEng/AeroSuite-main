import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

// OAuth Provider Interface
interface OAuthProvider {
  id: string;
  accessToken?: string;
  refreshToken?: string;
}

// OAuth Interface
interface OAuth {
  google?: OAuthProvider;
  microsoft?: OAuthProvider;
}

// User Interface
export interface User extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role: 'admin' | 'user' | 'manager';
  isActive: boolean;
  emailVerified: boolean;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  customerId?: mongoose.Types.ObjectId;
  twoFactorAuth?: {
    enabled: boolean;
    method: 'app' | 'email' | 'sms';
    secret?: string;
    backupCodes?: string[];
  };
  oauth?: OAuth;
  lastLogin?: Date;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: {
      email: boolean;
      inApp: boolean;
    };
    dashboardLayout: Record<string, any>;
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
  fullName(): string;
}

// User Schema
const userSchema = new Schema<User>(
  {
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address']
    },
    password: {
      type: String,
      required: function(this: User) {
        // Password is required unless the user signs up with OAuth
        return !this.oauth?.google?.id && !this.oauth?.microsoft?.id;
      },
      minlength: [8, 'Password must be at least 8 characters long']
    },
    role: {
      type: String,
      enum: ['admin', 'user', 'manager'],
      default: 'user'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    emailVerified: {
      type: Boolean,
      default: false
    },
    avatar: {
      type: String
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'Customer'
    },
    twoFactorAuth: {
      enabled: {
        type: Boolean,
        default: false
      },
      method: {
        type: String,
        enum: ['app', 'email', 'sms'],
        default: 'app'
      },
      secret: String,
      backupCodes: [String]
    },
    oauth: {
      google: {
        id: String,
        accessToken: String,
        refreshToken: String
      },
      microsoft: {
        id: String,
        accessToken: String,
        refreshToken: String
      }
    },
    lastLogin: {
      type: Date
    },
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system'
      },
      notifications: {
        email: {
          type: Boolean,
          default: true
        },
        inApp: {
          type: Boolean,
          default: true
        }
      },
      dashboardLayout: {
        type: Schema.Types.Mixed,
        default: {}
      }
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre('save', async function(next) {
  const user = this as User;
  
  // Only hash the password if it has been modified (or is new)
  if (!user.isModified('password') || !user.password) {
    return next();
  }
  
  try {
    // Generate salt and hash
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  const user = this as User;
  
  // If no password (OAuth user), always return false
  if (!user.password) {
    return false;
  }
  
  try {
    return await bcrypt.compare(candidatePassword, user.password);
  } catch (error) {
    return false;
  }
};

// Get full name
userSchema.methods.fullName = function(): string {
  return `${this.firstName} ${this.lastName}`;
};

// Create and export the model
export const UserModel = mongoose.model<User>('User', userSchema); 