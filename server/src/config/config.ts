export default {
  // Application settings
  port: process.env.PORT || 5000,
  env: process.env.NODE_ENV || 'development',
  baseUrl: process.env.BASE_URL || 'http://localhost:5000',
  
  // Database settings
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/aerosuite',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },
  
  // JWT settings
  jwt: {
    secret: (() => {
      if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET environment variable is required');
      return process.env.JWT_SECRET;
    })(),
    expiresIn: (() => {
      if (!process.env.JWT_EXPIRES_IN) throw new Error('JWT_EXPIRES_IN environment variable is required');
      return process.env.JWT_EXPIRES_IN;
    })()
  },
  
  // CORS settings
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  },
  
  // Email settings
  email: {
    from: process.env.EMAIL_FROM || 'no-reply@aerosuite.com',
    smtp: {
      host: (() => {
        if (!process.env.SMTP_HOST) throw new Error('SMTP_HOST environment variable is required');
        return process.env.SMTP_HOST;
      })(),
      port: (() => {
        if (!process.env.SMTP_PORT) throw new Error('SMTP_PORT environment variable is required');
        return parseInt(process.env.SMTP_PORT);
      })(),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: (() => {
          if (!process.env.SMTP_USER) throw new Error('SMTP_USER environment variable is required');
          return process.env.SMTP_USER;
        })(),
        pass: (() => {
          if (!process.env.SMTP_PASS) throw new Error('SMTP_PASS environment variable is required');
          return process.env.SMTP_PASS;
        })()
      }
    }
  },
  
  // OAuth settings
  oauth: {
    google: {
      enabled: process.env.GOOGLE_OAUTH_ENABLED === 'true',
      clientId: (() => {
        if (!process.env.GOOGLE_CLIENT_ID) throw new Error('GOOGLE_CLIENT_ID environment variable is required');
        return process.env.GOOGLE_CLIENT_ID;
      })(),
      clientSecret: (() => {
        if (!process.env.GOOGLE_CLIENT_SECRET) throw new Error('GOOGLE_CLIENT_SECRET environment variable is required');
        return process.env.GOOGLE_CLIENT_SECRET;
      })()
    },
    microsoft: {
      enabled: process.env.MICROSOFT_OAUTH_ENABLED === 'true',
      clientId: (() => {
        if (!process.env.MICROSOFT_CLIENT_ID) throw new Error('MICROSOFT_CLIENT_ID environment variable is required');
        return process.env.MICROSOFT_CLIENT_ID;
      })(),
      clientSecret: (() => {
        if (!process.env.MICROSOFT_CLIENT_SECRET) throw new Error('MICROSOFT_CLIENT_SECRET environment variable is required');
        return process.env.MICROSOFT_CLIENT_SECRET;
      })(),
      tenant: process.env.MICROSOFT_TENANT || 'common'
    }
  },
  
  // Session settings
  session: {
    secret: (() => {
      if (!process.env.SESSION_SECRET) throw new Error('SESSION_SECRET environment variable is required');
      return process.env.SESSION_SECRET;
    })(),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  },
  
  // File upload settings
  upload: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword']
  },
  
  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info'
  }
}; 