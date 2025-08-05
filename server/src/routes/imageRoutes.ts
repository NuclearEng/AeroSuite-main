import express from 'express';
import imageController from '../controllers/imageController';

const router = express.Router();

/**
 * @route GET /api/images
 * @description Optimize and serve an image
 * @param {string} src - Source URL of the original image
 * @param {number} width - Target width (optional)
 * @param {number} height - Target height (optional)
 * @param {string} format - Target format (webp, jpeg, png, avif)
 * @param {number} quality - Quality setting (1-100)
 * @param {boolean} blur - Apply blur effect (0 or 1)
 */
router.get('/', imageController.optimizeImage);

/**
 * @route GET /api/images/placeholder
 * @description Generate a tiny placeholder for blur-up effect
 * @param {string} src - Source URL of the original image
 */
router.get('/placeholder', imageController.generatePlaceholder);

export default router; 