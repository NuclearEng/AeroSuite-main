import { useState, useEffect, useCallback, useRef } from 'react';
import { SxProps, Theme } from '@mui/material';
import { 
  AnimationOptions, 
  prefersReducedMotion, 
  animationPresets 
} from '../utils/animationUtils';

/**
 * Interface for animation hook options
 */
export interface UseAnimationOptions extends AnimationOptions {
  /**
   * Whether to auto-play the animation on mount
   * @default true
   */
  autoPlay?: boolean;
  
  /**
   * Whether to repeat the animation
   * @default false
   */
  repeat?: boolean;
  
  /**
   * Number of times to repeat the animation (0 = infinite)
   * @default 0
   */
  repeatCount?: number;
  
  /**
   * Callback when animation starts
   */
  onStart?: () => void;
  
  /**
   * Callback when animation completes
   */
  onComplete?: () => void;
}

/**
 * Interface for animation hook return value
 */
export interface UseAnimationReturn {
  /**
   * Whether the animation is currently playing
   */
  isPlaying: boolean;
  
  /**
   * Start the animation
   */
  play: () => void;
  
  /**
   * Pause the animation
   */
  pause: () => void;
  
  /**
   * Reset the animation to its initial state
   */
  reset: () => void;
  
  /**
   * Animation styles to apply to the element
   */
  style: SxProps<Theme>;
}

/**
 * Hook for using animations in React components
 * 
 * @param animationType - Type of animation to use
 * @param options - Animation options
 * @returns Animation controls and styles
 */
export const useAnimation = (
  animationType: keyof typeof animationPresets,
  options: UseAnimationOptions = {}
): UseAnimationReturn => {
  const {
    autoPlay = true,
    repeat = false,
    repeatCount = 0,
    onStart,
    onComplete,
    ...animationOptions
  } = options;
  
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [playCount, setPlayCount] = useState(0);
  const animationRef = useRef<Animation | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);
  
  // Get animation preset
  const animationPreset = animationPresets[animationType];
  if (!animationPreset) {
    console.error(`Animation type "${animationType}" not found in presets`);
  }
  
  // Generate animation styles
  const style = animationPreset ? animationPreset({
    ...animationOptions,
    respectReducedMotion: true
  }) : {};
  
  // Play animation
  const play = useCallback(() => {
    if (prefersReducedMotion()) return;
    
    setIsPlaying(true);
    onStart?.();
    
    // If using Web Animations API
    if (elementRef.current && 'animate' in elementRef.current) {
      // Implementation would depend on the specific animation
      // This is a simplified example
    }
  }, [onStart]);
  
  // Pause animation
  const pause = useCallback(() => {
    setIsPlaying(false);
    
    // If using Web Animations API
    if (animationRef.current) {
      animationRef.current.pause();
    }
  }, []);
  
  // Reset animation
  const reset = useCallback(() => {
    setIsPlaying(false);
    setPlayCount(0);
    
    // If using Web Animations API
    if (animationRef.current) {
      animationRef.current.cancel();
    }
  }, []);
  
  // Handle animation completion
  const handleAnimationEnd = useCallback(() => {
    if (repeat && (repeatCount === 0 || playCount < repeatCount)) {
      setPlayCount(prev => prev + 1);
      play();
    } else {
      setIsPlaying(false);
      onComplete?.();
    }
  }, [repeat, repeatCount, playCount, play, onComplete]);
  
  // Auto-play on mount
  useEffect(() => {
    if (autoPlay) {
      play();
    }
    
    return () => {
      if (animationRef.current) {
        animationRef.current.cancel();
      }
    };
  }, [autoPlay, play]);
  
  return {
    isPlaying,
    play,
    pause,
    reset,
    style
  };
};

/**
 * Hook for using staggered animations in lists
 * 
 * @param animationType - Type of animation to use
 * @param itemCount - Number of items to animate
 * @param options - Animation options
 * @returns Array of animation styles for each item
 */
export const useStaggeredAnimation = (
  animationType: keyof typeof animationPresets,
  itemCount: number,
  options: UseAnimationOptions = {}
): SxProps<Theme>[] => {
  const {
    delay = 0,
    ...animationOptions
  } = options;
  
  // Get animation preset
  const animationPreset = animationPresets[animationType];
  if (!animationPreset) {
    console.error(`Animation type "${animationType}" not found in presets`);
    return Array(itemCount).fill({});
  }
  
  // Generate staggered animation styles
  return Array.from({ length: itemCount }).map((_, index) => {
    return animationPreset({
      ...animationOptions,
      delay: delay + (index * 50),
      respectReducedMotion: true
    });
  });
};

/**
 * Hook for using hover animations
 * 
 * @param hoverStyles - Styles to apply on hover
 * @param options - Animation options
 * @returns Hover animation styles
 */
export const useHoverAnimation = (
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
  
  return {
    transition: `all ${duration}ms ${easing}`,
    '&:hover': hoverStyles
  };
};

export default {
  useAnimation,
  useStaggeredAnimation,
  useHoverAnimation
}; 