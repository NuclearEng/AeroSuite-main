import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model';
import config from '../config/config';

// Helper function to generate JWT token
const generateToken = (user: User): string => {
  return jwt.sign(
    { id: user.id, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

// Get available SSO providers
export const getAvailableProviders = (req: Request, res: Response): void => {
  const providers = [];
  
  if (config.oauth.google.enabled) {
    providers.push('google');
  }
  
  if (config.oauth.microsoft.enabled) {
    providers.push('microsoft');
  }
  
  res.json({
    success: true,
    data: {
      enabled: providers.length > 0,
      providers
    }
  });
};

// Handle OAuth callback
export const handleOAuthCallback = (provider: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    passport.authenticate(provider, { session: false }, (err: Error | null, user: User | false) => {
      if (err || !user) {
        return res.redirect(`${config.cors.origin}/auth/login?error=${encodeURIComponent(err?.message || 'Authentication failed')}`);
      }
      
      // Generate JWT token
      const token = generateToken(user);

      // Update last login timestamp
      user.lastLogin = new Date();
      user.save().catch(saveErr => console.error('Failed to update last login time:', saveErr));
      
      // Extract redirect URL from query or use default (validate to prevent open redirect)
      const rawRedirect = (req.query.redirect as string) || '/dashboard';
      const sanitizedRedirect = typeof rawRedirect === 'string' && rawRedirect.startsWith('/') ? rawRedirect : '/dashboard';

      // Set HttpOnly, Secure cookie instead of leaking token in URL
      const isProd = process.env.NODE_ENV === 'production';
      res.cookie('auth_token', token, {
        httpOnly: true,
        secure: isProd,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
      });

      // Redirect to frontend without token in query
      res.redirect(`${config.cors.origin}${sanitizedRedirect}`);
    })(req, res, next);
  };
}; 