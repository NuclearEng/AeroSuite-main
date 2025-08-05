import { Router } from 'express';
import passport from 'passport';
import { getAvailableProviders, handleOAuthCallback } from '../controllers/oauth.controller';

const router = Router();

// Get available SSO providers
router.get('/providers', getAvailableProviders);

// Google OAuth routes
router.get('/google', (req, res, next) => {
  const { redirect } = req.query;
  const state = redirect ? Buffer.from(String(redirect)).toString('base64') : undefined;
  
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    state
  })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  // Extract the original redirect URL from state if it exists
  let redirectUrl = '/dashboard';
  if (req.query.state) {
    try {
      redirectUrl = Buffer.from(String(req.query.state), 'base64').toString();
    } catch (e) {
      console.error('Failed to decode state:', e);
    }
  }
  
  // Add the redirect URL as a query parameter
  req.query.redirect = redirectUrl;
  
  // Call the OAuth callback handler
  handleOAuthCallback('google')(req, res, next);
});

// Microsoft OAuth routes
router.get('/microsoft', (req, res, next) => {
  const { redirect } = req.query;
  const state = redirect ? Buffer.from(String(redirect)).toString('base64') : undefined;
  
  passport.authenticate('microsoft', { 
    scope: ['user.read'],
    state
  })(req, res, next);
});

router.get('/microsoft/callback', (req, res, next) => {
  // Extract the original redirect URL from state if it exists
  let redirectUrl = '/dashboard';
  if (req.query.state) {
    try {
      redirectUrl = Buffer.from(String(req.query.state), 'base64').toString();
    } catch (e) {
      console.error('Failed to decode state:', e);
    }
  }
  
  // Add the redirect URL as a query parameter
  req.query.redirect = redirectUrl;
  
  // Call the OAuth callback handler
  handleOAuthCallback('microsoft')(req, res, next);
});

export default router; 