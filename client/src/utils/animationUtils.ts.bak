import { SxProps, Theme } from '@mui/material';

/**
 * Interface for animation options
 */
export interface AnimationOptions {
  /**
   * Animation duration in milliseconds
   * @default 300
   */
  duration?: number;
  
  /**
   * Animation delay in milliseconds
   * @default 0
   */
  delay?: number;
  
  /**
   * Animation easing function
   * @default 'cubic-bezier(0.4, 0, 0.2, 1)'
   */
  easing?: string;
  
  /**
   * Whether to respect reduced motion preferences
   * @default true
   */
  respectReducedMotion?: boolean;
}

/**
 * Interface for animation state
 */
export interface AnimationState {
  /**
   * Whether the animation is active
   */
  active: boolean;
  
  /**
   * Animation properties
   */
  props: Record<string, any>;
  
  /**
   * Start the animation
   */
  start: () => void;
  
  /**
   * Stop the animation
   */
  stop: () => void;
  
  /**
   * Reset the animation
   */
  reset: () => void;
}

/**
 * Check if the user prefers reduced motion
 * 
 * @returns Whether the user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Create a CSS transition string
 * 
 * @param property - CSS property to animate
 * @param options - Animation options
 * @returns CSS transition string
 */
export const createTransition = (
  property: string | string[],
  options: AnimationOptions = {}
): string => {
  const {
    duration = 300,
    delay = 0,
    easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
    respectReducedMotion = true
  } = options;
  
  // Respect reduced motion preferences
  if (respectReducedMotion && prefersReducedMotion()) {
    return 'none';
  }
  
  const properties = Array.isArray(property) ? property : [property];
  
  return properties
    .map(prop => `${prop} ${duration}ms ${easing} ${delay}ms`)
    .join(', ');
};

/**
 * Create keyframe animation styles
 * 
 * @param keyframeName - Name of the keyframe animation
 * @param keyframes - Keyframe definitions
 * @param options - Animation options
 * @returns SxProps object with animation styles
 */
export const createKeyframeAnimation = (
  keyframeName: string,
  keyframes: Record<string, Record<string, any>>,
  options: AnimationOptions = {}
): SxProps<Theme> => {
  const {
    duration = 300,
    delay = 0,
    easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
    respectReducedMotion = true
  } = options;
  
  // Respect reduced motion preferences
  if (respectReducedMotion && prefersReducedMotion()) {
    return {};
  }
  
  const keyframeObj: Record<string, Record<string, any>> = {};
  
  Object.entries(keyframes).forEach(([key, value]) => {
    keyframeObj[key] = value;
  });
  
  return {
    animation: `${keyframeName} ${duration}ms ${easing} ${delay}ms forwards`,
    [`@keyframes ${keyframeName}`]: keyframeObj
  };
};

/**
 * Predefined animation presets
 */
export const animationPresets = {
  /**
   * Fade in animation
   * 
   * @param options - Animation options
   * @returns SxProps object with animation styles
   */
  fadeIn: (options: AnimationOptions = {}): SxProps<Theme> => createKeyframeAnimation(
    'fadeIn',
    {
      '0%': { opacity: 0 },
      '100%': { opacity: 1 }
    },
    options
  ),
  
  /**
   * Fade out animation
   * 
   * @param options - Animation options
   * @returns SxProps object with animation styles
   */
  fadeOut: (options: AnimationOptions = {}): SxProps<Theme> => createKeyframeAnimation(
    'fadeOut',
    {
      '0%': { opacity: 1 },
      '100%': { opacity: 0 }
    },
    options
  ),
  
  /**
   * Slide in from top animation
   * 
   * @param options - Animation options
   * @returns SxProps object with animation styles
   */
  slideInTop: (options: AnimationOptions = {}): SxProps<Theme> => createKeyframeAnimation(
    'slideInTop',
    {
      '0%': { opacity: 0, transform: 'translateY(-20px)' },
      '100%': { opacity: 1, transform: 'translateY(0)' }
    },
    options
  ),
  
  /**
   * Slide in from bottom animation
   * 
   * @param options - Animation options
   * @returns SxProps object with animation styles
   */
  slideInBottom: (options: AnimationOptions = {}): SxProps<Theme> => createKeyframeAnimation(
    'slideInBottom',
    {
      '0%': { opacity: 0, transform: 'translateY(20px)' },
      '100%': { opacity: 1, transform: 'translateY(0)' }
    },
    options
  ),
  
  /**
   * Slide in from left animation
   * 
   * @param options - Animation options
   * @returns SxProps object with animation styles
   */
  slideInLeft: (options: AnimationOptions = {}): SxProps<Theme> => createKeyframeAnimation(
    'slideInLeft',
    {
      '0%': { opacity: 0, transform: 'translateX(-20px)' },
      '100%': { opacity: 1, transform: 'translateX(0)' }
    },
    options
  ),
  
  /**
   * Slide in from right animation
   * 
   * @param options - Animation options
   * @returns SxProps object with animation styles
   */
  slideInRight: (options: AnimationOptions = {}): SxProps<Theme> => createKeyframeAnimation(
    'slideInRight',
    {
      '0%': { opacity: 0, transform: 'translateX(20px)' },
      '100%': { opacity: 1, transform: 'translateX(0)' }
    },
    options
  ),
  
  /**
   * Scale in animation
   * 
   * @param options - Animation options
   * @returns SxProps object with animation styles
   */
  scaleIn: (options: AnimationOptions = {}): SxProps<Theme> => createKeyframeAnimation(
    'scaleIn',
    {
      '0%': { opacity: 0, transform: 'scale(0.9)' },
      '100%': { opacity: 1, transform: 'scale(1)' }
    },
    options
  ),
  
  /**
   * Scale out animation
   * 
   * @param options - Animation options
   * @returns SxProps object with animation styles
   */
  scaleOut: (options: AnimationOptions = {}): SxProps<Theme> => createKeyframeAnimation(
    'scaleOut',
    {
      '0%': { opacity: 1, transform: 'scale(1)' },
      '100%': { opacity: 0, transform: 'scale(0.9)' }
    },
    options
  ),
  
  /**
   * Bounce animation
   * 
   * @param options - Animation options
   * @returns SxProps object with animation styles
   */
  bounce: (options: AnimationOptions = {}): SxProps<Theme> => createKeyframeAnimation(
    'bounce',
    {
      '0%': { transform: 'translateY(0)' },
      '20%': { transform: 'translateY(-10px)' },
      '40%': { transform: 'translateY(0)' },
      '60%': { transform: 'translateY(-5px)' },
      '80%': { transform: 'translateY(0)' },
    },
    options
  ),
  
  /**
   * Pulse animation
   * 
   * @param options - Animation options
   * @returns SxProps object with animation styles
   */
  pulse: (options: AnimationOptions = {}): SxProps<Theme> => createKeyframeAnimation(
    'pulse',
    {
      '0%': { transform: 'scale(1)' },
      '50%': { transform: 'scale(1.05)' },
      '100%': { transform: 'scale(1)' },
    },
    options
  ),
  
  /**
   * Shake animation
   * 
   * @param options - Animation options
   * @returns SxProps object with animation styles
   */
  shake: (options: AnimationOptions = {}): SxProps<Theme> => createKeyframeAnimation(
    'shake',
    {
      '0%, 100%': { transform: 'translateX(0)' },
      '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-5px)' },
      '20%, 40%, 60%, 80%': { transform: 'translateX(5px)' },
    },
    options
  ),
  
  /**
   * Rotate animation
   * 
   * @param options - Animation options
   * @returns SxProps object with animation styles
   */
  rotate: (options: AnimationOptions = {}): SxProps<Theme> => createKeyframeAnimation(
    'rotate',
    {
      '0%': { transform: 'rotate(0deg)' },
      '100%': { transform: 'rotate(360deg)' },
    },
    options
  ),
};

/**
 * Create hover animation styles
 * 
 * @param hoverStyles - Styles to apply on hover
 * @param options - Animation options
 * @returns SxProps object with hover animation styles
 */
export const createHoverAnimation = (
  hoverStyles: Record<string, any>,
  options: AnimationOptions = {}
): SxProps<Theme> => {
  const {
    duration = 300,
    easing = 'cubic-bezier(0.4, 0, 0.2, 1)',
    respectReducedMotion = true
  } = options;
  
  // Respect reduced motion preferences
  if (respectReducedMotion && prefersReducedMotion()) {
    return {
      '&:hover': hoverStyles
    };
  }
  
  return (theme: Theme) => ({
    transition: theme.transitions.create('all', {
      duration: duration,
      easing: theme.transitions.easing.easeInOut,
    }),
    '&:hover': hoverStyles,
  });
};

/**
 * Create staggered animation for a list of items
 * 
 * @param baseAnimation - Base animation styles
 * @param options - Animation options
 * @returns Function that returns SxProps for each item
 */
export const createStaggeredAnimation = (
  baseAnimation: SxProps<Theme>,
  options: AnimationOptions = {}
): (index: number) => SxProps<Theme> => {
  const {
    delay = 0,
    respectReducedMotion = true
  } = options;
  
  // Respect reduced motion preferences
  if (respectReducedMotion && prefersReducedMotion()) {
    return () => baseAnimation;
  }
  
  return (index: number) => ({
    ...baseAnimation,
    animationDelay: `${delay + (index * 50)}ms`,
  });
};

export default {
  prefersReducedMotion,
  createTransition,
  createKeyframeAnimation,
  animationPresets,
  createHoverAnimation,
  createStaggeredAnimation
}; 