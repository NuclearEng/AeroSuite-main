/**
 * Common Type Definitions
 * Contains shared interfaces and types used across the application
 */

/**
 * Base entity interface
 * Common properties for all entities
 */
export interface BaseEntity {
  /** Unique identifier */
  id: string | number;
  /** Creation timestamp */
  createdAt?: string | Date;
  /** Last update timestamp */
  updatedAt?: string | Date;
}

/**
 * Address interface
 */
export interface Address {
  /** Street address line 1 */
  street1: string;
  /** Street address line 2 (optional) */
  street2?: string;
  /** City */
  city: string;
  /** State/Province/Region */
  state: string;
  /** Postal/ZIP code */
  postalCode: string;
  /** Country */
  country: string;
  /** Address type */
  type?: 'billing' | 'shipping' | 'primary' | 'secondary';
}

/**
 * Contact information interface
 */
export interface ContactInfo {
  /** Full name */
  name?: string;
  /** Email address */
  email?: string;
  /** Phone number */
  phone?: string;
  /** Job title */
  title?: string;
  /** Department */
  department?: string;
  /** Whether this is the primary contact */
  isPrimary?: boolean;
}

/**
 * User interface
 */
export interface User extends BaseEntity {
  /** Username */
  username: string;
  /** Email address */
  email: string;
  /** First name */
  firstName: string;
  /** Last name */
  lastName: string;
  /** User role */
  role: 'admin' | 'user' | 'manager' | 'viewer';
  /** Whether the user is active */
  isActive: boolean;
  /** Last login timestamp */
  lastLogin?: string | Date;
  /** User preferences */
  preferences?: UserPreferences;
  /** User permissions */
  permissions?: string[];
}

/**
 * User preferences interface
 */
export interface UserPreferences {
  /** Theme preference */
  theme?: 'light' | 'dark' | 'system';
  /** Language preference */
  language?: string;
  /** Timezone */
  timezone?: string;
  /** Notification preferences */
  notifications?: {
    /** Email notifications */
    email?: boolean;
    /** Push notifications */
    push?: boolean;
    /** SMS notifications */
    sms?: boolean;
  };
  /** Dashboard layout */
  dashboardLayout?: unknown;
}

/**
 * File metadata interface
 */
export interface FileMetadata extends BaseEntity {
  /** Original filename */
  filename: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  mimeType: string;
  /** File URL */
  url?: string;
  /** File path */
  path?: string;
  /** File owner */
  ownerId?: string | number;
  /** File description */
  description?: string;
  /** File tags */
  tags?: string[];
}

/**
 * Status interface
 */
export interface Status {
  /** Status code */
  code: string;
  /** Status label */
  label: string;
  /** Status color */
  color?: string;
  /** Status icon */
  icon?: string;
  /** Status description */
  description?: string;
}

/**
 * Location interface
 */
export interface Location {
  /** Latitude */
  latitude: number;
  /** Longitude */
  longitude: number;
  /** Accuracy in meters */
  accuracy?: number;
  /** Altitude in meters */
  altitude?: number;
  /** Location name */
  name?: string;
  /** Location address */
  address?: Address;
}

/**
 * Date range interface
 */
export interface DateRange {
  /** Start date */
  start: string | Date;
  /** End date */
  end: string | Date;
}

/**
 * Audit log entry interface
 */
export interface AuditLogEntry extends BaseEntity {
  /** User who performed the action */
  userId: string | number;
  /** Action performed */
  action: string;
  /** Entity type */
  entityType: string;
  /** Entity ID */
  entityId: string | number;
  /** Previous state */
  previousState?: unknown;
  /** New state */
  newState?: unknown;
  /** IP address */
  ipAddress?: string;
  /** User agent */
  userAgent?: string;
}

/**
 * Generic key-value pair
 */
export interface KeyValuePair<K = string, V = unknown> {
  /** Key */
  key: K;
  /** Value */
  value: V;
} 