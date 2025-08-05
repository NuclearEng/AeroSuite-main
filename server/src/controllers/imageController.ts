import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { URL } from 'url';
import crypto from 'crypto';
import fetch from 'node-fetch';

// In a real implementation, you would use libraries like sharp for image processing
// For this example, we'll create a simple controller that demonstrates the approach

/**
 * Generate a hash for caching purposes based on image URL and options
 */
const generateCacheKey = (url: string, options: Record<string, any>): string => {
  const data = JSON.stringify({ url, options });
  return crypto.createHash('md5').update(data).digest('hex');
};

/**
 * Check if the URL is from a trusted domain
 */
const isAllowedDomain = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    
    // List of allowed domains
    const allowedDomains = [
      'example.com',
      'localhost',
      'aerosuite.com',
      'aerosuite-assets.com',
      's3.amazonaws.com'
    ];
    
    return allowedDomains.some(domain => parsed.hostname.includes(domain));
  } catch (error) {
    return false;
  }
};

/**
 * Controller for optimizing and serving images
 */
export const optimizeImage = async (req: Request, res: Response) => {
  try {
    // Get image source URL from request
    const { src } = req.query;
    
    if (!src || typeof src !== 'string') {
      return res.status(400).json({ error: 'Image source URL is required' });
    }
    
    // Security check - prevent SSRF attacks
    if (!isAllowedDomain(src)) {
      return res.status(403).json({ error: 'Domain not allowed' });
    }
    
    // Get optimization options from request
    const width = req.query.width ? parseInt(req.query.width as string) : undefined;
    const height = req.query.height ? parseInt(req.query.height as string) : undefined;
    const format = (req.query.format as string)?.toLowerCase() || 'webp';
    const quality = req.query.quality ? parseInt(req.query.quality as string) : 80;
    const blur = req.query.blur === '1';
    
    // Create cache key based on URL and options
    const cacheKey = generateCacheKey(src, { width, height, format, quality, blur });
    const cacheDir = path.join(__dirname, '../../cache/images');
    const cachePath = path.join(cacheDir, `${cacheKey}.${format}`);
    
    // Create cache directory if it doesn't exist
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    
    // Check if image is already cached
    if (fs.existsSync(cachePath)) {
      // Set appropriate content type based on format
      const contentType = format === 'webp' ? 'image/webp' :
                          format === 'jpeg' ? 'image/jpeg' :
                          format === 'png' ? 'image/png' :
                          format === 'avif' ? 'image/avif' : 'image/webp';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      return res.sendFile(cachePath);
    }
    
    // Fetch the original image
    const response = await fetch(src);
    
    if (!response.ok) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // In a real implementation, you would use a library like sharp to:
    // 1. Resize the image
    // 2. Convert to the requested format
    // 3. Apply quality setting
    // 4. Apply blur if requested
    // 5. Save to cache
    // 6. Serve the optimized image
    
    // For this example, we'll just forward the original image
    // but in a real implementation you would process it
    
    // Set appropriate headers
    res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    // Stream the image to the response
    return response.body.pipe(res);
    
  } catch (error) {
    console.error('Error optimizing image:', error);
    return res.status(500).json({ error: 'Failed to optimize image' });
  }
};

/**
 * Generate a tiny placeholder image for blur-up effect
 */
export const generatePlaceholder = async (req: Request, res: Response) => {
  try {
    // Get image source URL from request
    const { src } = req.query;
    
    if (!src || typeof src !== 'string') {
      return res.status(400).json({ error: 'Image source URL is required' });
    }
    
    // Security check - prevent SSRF attacks
    if (!isAllowedDomain(src)) {
      return res.status(403).json({ error: 'Domain not allowed' });
    }
    
    // Create cache key based on URL
    const cacheKey = generateCacheKey(src, { placeholder: true });
    const cacheDir = path.join(__dirname, '../../cache/placeholders');
    const cachePath = path.join(cacheDir, `${cacheKey}.webp`);
    
    // Create cache directory if it doesn't exist
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    
    // Check if placeholder is already cached
    if (fs.existsSync(cachePath)) {
      res.setHeader('Content-Type', 'image/webp');
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      return res.sendFile(cachePath);
    }
    
    // Fetch the original image
    const response = await fetch(src);
    
    if (!response.ok) {
      return res.status(404).json({ error: 'Image not found' });
    }
    
    // In a real implementation, you would:
    // 1. Resize the image to a very small size (e.g., 10x10)
    // 2. Apply blur
    // 3. Convert to WebP at low quality
    // 4. Save to cache
    // 5. Serve the placeholder
    
    // For this example, we'll just serve a default placeholder
    res.setHeader('Content-Type', 'image/webp');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    
    // In a real implementation, you would generate the placeholder and stream it
    return res.status(200).send('Placeholder image data would go here');
    
  } catch (error) {
    console.error('Error generating placeholder:', error);
    return res.status(500).json({ error: 'Failed to generate placeholder' });
  }
};

export default {
  optimizeImage,
  generatePlaceholder
}; 