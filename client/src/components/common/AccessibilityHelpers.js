import React, { useRef, useEffect } from 'react';
import { Box, Typography, styled } from '@mui/material';

/**
 * VisuallyHidden component - Hides content visually but keeps it accessible to screen readers
 * Use this for content that should be read by screen readers but not visible on screen
 */
export const VisuallyHidden = ({ children }) => {
  return (
    <Box
      sx={{
        border: 0,
        clip: 'rect(0 0 0 0)',
        height: '1px',
        margin: '-1px',
        overflow: 'hidden',
        padding: 0,
        position: 'absolute',
        width: '1px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </Box>
  );
};

/**
 * SkipLink component - Allows keyboard users to skip to the main content
 */
export const SkipLink = styled('a')(({ theme }) => ({
  position: 'absolute',
  top: '-40px',
  left: 0,
  background: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(1),
  zIndex: theme.zIndex.tooltip,
  transition: 'top 0.2s',
  '&:focus': {
    top: 0,
  },
}));

/**
 * LiveRegion component - For dynamically updating content that should be announced by screen readers
 * @param {Object} props
 * @param {string} props.id - Unique ID for the region
 * @param {string} props.ariaLive - ARIA live setting ('polite' or 'assertive')
 * @param {React.ReactNode} props.children - Content to be announced
 */
export const LiveRegion = ({ children, politeness = 'polite' }) => {
  return (
    <Box
      aria-live={politeness}
      aria-atomic="true"
      sx={{
        border: 0,
        clip: 'rect(0 0 0 0)',
        height: '1px',
        margin: '-1px',
        overflow: 'hidden',
        padding: 0,
        position: 'absolute',
        width: '1px',
      }}
    >
      {children}
    </Box>
  );
};

/**
 * FocusTrap component - Traps focus within a component (e.g., for modals)
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content within the focus trap
 * @param {boolean} props.active - Whether the focus trap is active
 */
export const FocusTrap = ({ children, active = true }) => {
  const containerRef = useRef(null);
  const startSentinelRef = useRef(null);
  const endSentinelRef = useRef(null);

  useEffect(() => {
    if (!active) return;

    const handleFocus = (e) => {
      if (!containerRef.current) return;

      // If focus is outside the container, bring it back in
      if (!containerRef.current.contains(document.activeElement)) {
        startSentinelRef.current?.focus();
      }
    };

    const handleTabStart = (e) => {
      if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        const focusableElements = getFocusableElements(containerRef.current);
        focusableElements[focusableElements.length - 1]?.focus();
      }
    };

    const handleTabEnd = (e) => {
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        const focusableElements = getFocusableElements(containerRef.current);
        focusableElements[0]?.focus();
      }
    };

    // Add event listeners
    startSentinelRef.current?.addEventListener('focus', handleTabStart);
    endSentinelRef.current?.addEventListener('focus', handleTabEnd);
    document.addEventListener('focusin', handleFocus);

    return () => {
      // Remove event listeners
      startSentinelRef.current?.removeEventListener('focus', handleTabStart);
      endSentinelRef.current?.removeEventListener('focus', handleTabEnd);
      document.removeEventListener('focusin', handleFocus);
    };
  }, [active]);

  // Helper function to get all focusable elements
  const getFocusableElements = (parent) => {
    if (!parent) return [];
    
    return Array.from(
      parent.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => !el.hasAttribute('data-focus-guard'));
  };

  return (
    <>
      <div tabIndex={0} ref={startSentinelRef} data-focus-guard aria-hidden="true" />
      <div ref={containerRef}>{children}</div>
      <div tabIndex={0} ref={endSentinelRef} data-focus-guard aria-hidden="true" />
    </>
  );
};

/**
 * KeyboardNavigation component - Enables keyboard navigation for a list of items
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content with keyboard navigation
 * @param {Function} props.onKeyDown - Custom keydown handler
 * @param {string} props.orientation - 'vertical' or 'horizontal'
 */
export const KeyboardNavigation = ({ children, onKeyDown, orientation = 'vertical' }) => {
  const containerRef = useRef(null);

  const handleKeyDown = (e) => {
    if (onKeyDown) {
      onKeyDown(e);
      if (e.defaultPrevented) return;
    }

    const focusableElements = containerRef.current
      ? Array.from(containerRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      : [];

    if (!focusableElements.length) return;

    const currentIndex = focusableElements.indexOf(document.activeElement);
    let nextIndex;

    if (orientation === 'vertical') {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
      }
    } else {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextIndex = currentIndex < focusableElements.length - 1 ? currentIndex + 1 : 0;
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : focusableElements.length - 1;
      }
    }

    if (nextIndex !== undefined) {
      focusableElements[nextIndex].focus();
    }
  };

  return (
    <div ref={containerRef} onKeyDown={handleKeyDown}>
      {children}
    </div>
  );
};

/**
 * AccessibleTooltip component - Provides accessible tooltip functionality
 * @param {Object} props
 * @param {React.ReactNode} props.children - Element that triggers the tooltip
 * @param {string} props.tooltip - Tooltip content
 */
export const AccessibleTooltip = ({ children, tooltip }) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const id = useRef(`tooltip-${Math.random().toString(36).substr(2, 9)}`);

  const handleFocus = () => setIsVisible(true);
  const handleBlur = () => setIsVisible(false);
  const handleMouseEnter = () => setIsVisible(true);
  const handleMouseLeave = () => setIsVisible(false);

  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      {React.cloneElement(children, {
        'aria-describedby': isVisible ? id.current : undefined,
        onFocus: handleFocus,
        onBlur: handleBlur,
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
      })}
      {isVisible && (
        <Box
          id={id.current}
          role="tooltip"
          sx={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '8px',
            padding: '4px 8px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            borderRadius: '4px',
            fontSize: '0.75rem',
            zIndex: 1500,
            whiteSpace: 'nowrap',
          }}
        >
          <Typography variant="caption">{tooltip}</Typography>
        </Box>
      )}
    </Box>
  );
};

/**
 * A11yAnnouncer - Announces messages to screen readers
 */
export class A11yAnnouncer {
  static #instance;
  #liveRegion;

  constructor() {
    if (A11yAnnouncer.#instance) {
      return A11yAnnouncer.#instance;
    }

    this.#createLiveRegion();
    A11yAnnouncer.#instance = this;
  }

  #createLiveRegion() {
    if (typeof document === 'undefined') return;

    this.#liveRegion = document.createElement('div');
    this.#liveRegion.setAttribute('aria-live', 'polite');
    this.#liveRegion.setAttribute('aria-atomic', 'true');
    this.#liveRegion.setAttribute('class', 'sr-only');
    this.#liveRegion.style.position = 'absolute';
    this.#liveRegion.style.width = '1px';
    this.#liveRegion.style.height = '1px';
    this.#liveRegion.style.padding = '0';
    this.#liveRegion.style.margin = '-1px';
    this.#liveRegion.style.overflow = 'hidden';
    this.#liveRegion.style.clip = 'rect(0, 0, 0, 0)';
    this.#liveRegion.style.whiteSpace = 'nowrap';
    this.#liveRegion.style.border = '0';

    document.body.appendChild(this.#liveRegion);
  }

  /**
   * Announce a message to screen readers
   * @param {string} message - Message to announce
   * @param {'polite' | 'assertive'} priority - Priority level
   */
  announce(message, priority = 'polite') {
    if (!this.#liveRegion) return;
    
    this.#liveRegion.setAttribute('aria-live', priority);
    
    // Clear the region first
    this.#liveRegion.textContent = '';
    
    // Use setTimeout to ensure the clearing has processed
    setTimeout(() => {
      this.#liveRegion.textContent = message;
    }, 50);
  }

  /**
   * Get the singleton instance
   * @returns {A11yAnnouncer}
   */
  static getInstance() {
    if (!A11yAnnouncer.#instance) {
      A11yAnnouncer.#instance = new A11yAnnouncer();
    }
    return A11yAnnouncer.#instance;
  }
}

/**
 * Hook to announce messages to screen readers
 * @returns {Function} announce function
 */
export const useAnnounce = () => {
  const announcer = React.useMemo(() => {
    if (typeof window !== 'undefined') {
      return A11yAnnouncer.getInstance();
    }
    return null;
  }, []);

  return React.useCallback((message, priority = 'polite') => {
    if (announcer) {
      announcer.announce(message, priority);
    }
  }, [announcer]);
};

/**
 * Initialize the accessibility features for the application
 * Call this once at the app root level
 */
export const initializeAccessibility = () => {
  if (typeof document === 'undefined') return;
  
  // Create the announcer instance
  A11yAnnouncer.getInstance();
  
  // Add skip link if not present
  if (!document.getElementById('skip-to-content')) {
    const skipLink = document.createElement('a');
    skipLink.id = 'skip-to-content';
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.style.position = 'absolute';
    skipLink.style.top = '-40px';
    skipLink.style.left = '0';
    skipLink.style.zIndex = '9999';
    skipLink.style.padding = '8px';
    skipLink.style.background = '#1976d2';
    skipLink.style.color = 'white';
    skipLink.style.transition = 'top 0.2s';
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '0';
    });
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
  }

  // Add skip link functionality
  document.addEventListener('DOMContentLoaded', () => {
    const skipLink = document.querySelector('a[href="#main-content"]');
    if (skipLink) {
      skipLink.addEventListener('click', (e) => {
        e.preventDefault();
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
          mainContent.tabIndex = -1;
          mainContent.focus();
          mainContent.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  });

  // Add keyboard navigation handler
  document.addEventListener('keydown', (e) => {
    // Show focus outlines when using keyboard
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-user');
    }
  });

  // Hide focus outlines when using mouse
  document.addEventListener('mousedown', () => {
    document.body.classList.remove('keyboard-user');
  });
}; 