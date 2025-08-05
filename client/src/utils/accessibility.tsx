import React, { useEffect, RefObject } from 'react';

/**
 * Accessibility Utilities
 * 
 * This file contains utility functions and components to improve accessibility
 * throughout the application, making it more compliant with WCAG 2.1 standards.
 */

// Common ARIA role constants
export const AriaRoles = {
  ALERT: 'alert',
  ALERTDIALOG: 'alertdialog',
  BUTTON: 'button',
  CHECKBOX: 'checkbox',
  DIALOG: 'dialog',
  GRID: 'grid',
  LINK: 'link',
  LISTBOX: 'listbox',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  MENUITEMCHECKBOX: 'menuitemcheckbox',
  MENUITEMRADIO: 'menuitemradio',
  OPTION: 'option',
  PROGRESSBAR: 'progressbar',
  RADIO: 'radio',
  RADIOGROUP: 'radiogroup',
  REGION: 'region',
  SCROLLBAR: 'scrollbar',
  SEARCHBOX: 'searchbox',
  SLIDER: 'slider',
  SPINBUTTON: 'spinbutton',
  STATUS: 'status',
  SWITCH: 'switch',
  TAB: 'tab',
  TABLIST: 'tablist',
  TABPANEL: 'tabpanel',
  TEXTBOX: 'textbox',
  TIMER: 'timer',
  TOOLTIP: 'tooltip',
  TREE: 'tree',
  TREEGRID: 'treegrid',
  TREEITEM: 'treeitem'
};

// Common ARIA properties
export const AriaProps = {
  LABELLEDBY: 'aria-labelledby',
  DESCRIBEDBY: 'aria-describedby',
  EXPANDED: 'aria-expanded',
  HASPOPUP: 'aria-haspopup',
  HIDDEN: 'aria-hidden',
  CONTROLS: 'aria-controls',
  SELECTED: 'aria-selected',
  CHECKED: 'aria-checked',
  PRESSED: 'aria-pressed',
  CURRENT: 'aria-current',
  DISABLED: 'aria-disabled',
  ERRORMESSAGE: 'aria-errormessage',
  INVALID: 'aria-invalid',
  REQUIRED: 'aria-required',
  LEVEL: 'aria-level',
  LIVE: 'aria-live',
  ATOMIC: 'aria-atomic',
  BUSY: 'aria-busy',
  RELEVANT: 'aria-relevant',
  SORT: 'aria-sort',
  MULTISELECTABLE: 'aria-multiselectable',
  ORIENTATION: 'aria-orientation',
  VALUENOW: 'aria-valuenow',
  VALUEMIN: 'aria-valuemin',
  VALUEMAX: 'aria-valuemax',
  VALUETEXT: 'aria-valuetext'
};

// Live region politeness levels
export const AriaLive = {
  OFF: 'off',
  POLITE: 'polite',
  ASSERTIVE: 'assertive'
};

// Generate unique ID for accessibility attributes
export const generateA11yId = (prefix: string): string => {
  const randomId = Math.random().toString(36).substring(2, 10);
  return `${prefix}-${randomId}`;
};

// Creates props for accessible elements that trigger disclosure widgets
export const getDisclosureProps = (controlsId: string, expanded: boolean) => {
  return {
    [AriaProps.CONTROLS]: controlsId,
    [AriaProps.EXPANDED]: expanded,
    [AriaProps.HASPOPUP]: true,
  };
};

// Styles for screen reader only text
export const srOnlyStyles: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  borderWidth: 0
};

// Component for screen reader only text
export const SROnly: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <span style={srOnlyStyles}>{children}</span>;
};

// Props for live regions
export const getLiveRegionProps = (
  politeness: 'polite' | 'assertive' | 'off' = 'polite', 
  atomic: boolean = true
) => {
  return {
    [AriaProps.LIVE]: politeness,
    [AriaProps.ATOMIC]: atomic,
    [AriaProps.RELEVANT]: 'additions text'
  };
};

// Check color contrast for accessibility
export const checkColorContrast = (foreground: string, background: string) => {
  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (m: string, r: string, g: string, b: string) => {
      return r + r + g + g + b + b;
    });
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  // Calculate relative luminance
  const calculateLuminance = (rgb: { r: number; g: number; b: number }) => {
    const { r, g, b } = rgb;
    
    // Convert RGB values to the range [0, 1]
    const rSRGB = r / 255;
    const gSRGB = g / 255; 
    const bSRGB = b / 255;
    
    // Calculate RGB values for luminance
    const rLum = rSRGB <= 0.03928 ? rSRGB / 12.92 : Math.pow((rSRGB + 0.055) / 1.055, 2.4);
    const gLum = gSRGB <= 0.03928 ? gSRGB / 12.92 : Math.pow((gSRGB + 0.055) / 1.055, 2.4);
    const bLum = bSRGB <= 0.03928 ? bSRGB / 12.92 : Math.pow((bSRGB + 0.055) / 1.055, 2.4);
    
    // Calculate luminance using the formula
    return 0.2126 * rLum + 0.7152 * gLum + 0.0722 * bLum;
  };

  // Get RGB values from hex colors
  const fgRGB = hexToRgb(foreground);
  const bgRGB = hexToRgb(background);
  
  // Calculate luminance
  const fgLuminance = calculateLuminance(fgRGB);
  const bgLuminance = calculateLuminance(bgRGB);
  
  // Calculate contrast ratio
  const contrastRatio = (Math.max(fgLuminance, bgLuminance) + 0.05) / 
                         (Math.min(fgLuminance, bgLuminance) + 0.05);
  
  // Determine WCAG compliance
  const AALargeText = contrastRatio >= 3;
  const AANormalText = contrastRatio >= 4.5;
  const AAALargeText = contrastRatio >= 4.5;
  const AAANormalText = contrastRatio >= 7;
  
  return {
    contrastRatio: contrastRatio.toFixed(2),
    AALargeText,
    AANormalText,
    AAALargeText,
    AAANormalText,
    passes: {
      AA: AALargeText && AANormalText,
      AAA: AAALargeText && AAANormalText
    }
  };
};

// Focus trap hook for modals and dialogs
export const useFocusTrap = (
  isActive: boolean,
  containerRef: RefObject<HTMLElement>
) => {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Save active element to restore focus later
    const previousActiveElement = document.activeElement as HTMLElement;
    
    // Find all focusable elements within the container
    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    // Focus the first element initially
    if (firstElement) {
      firstElement.focus();
    }
    
    // Handle keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      // Shift + Tab: navigate backwards
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      }
      // Tab: navigate forwards
      else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };
    
    // Add event listener for keyboard navigation
    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup: restore focus and remove event listener
    return () => {
      if (previousActiveElement) {
        previousActiveElement.focus();
      }
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, containerRef]);
};

// Helper for managing focus when content updates
export const useFocusOnUpdate = (
  ref: RefObject<HTMLElement>,
  dependencies: any[] = []
) => {
  useEffect(() => {
    if (ref.current) {
      ref.current.focus();
    }
  }, dependencies);
};

// Skip to main content functionality for keyboard users
export const SkipToContent: React.FC = () => {
  return (
    <a
      href="#main-content"
      style={{
        position: 'absolute',
        top: '-40px',
        left: 0,
        padding: '8px',
        backgroundColor: '#fff',
        color: '#000',
        zIndex: 9999,
        transition: 'top 0.3s'
      }}
      onFocus={(e) => {
        e.currentTarget.style.top = '0';
      }}
      onBlur={(e) => {
        e.currentTarget.style.top = '-40px';
      }}
    >
      Skip to main content
    </a>
  );
};

// Accessibility announcement component for screen readers
export const Announcer: React.FC<{ 
  message: string; 
  politeness?: 'polite' | 'assertive';
  clearAfter?: number;
}> = ({ 
  message, 
  politeness = 'polite',
  clearAfter = 5000
}) => {
  const [announcement, setAnnouncement] = React.useState(message);

  React.useEffect(() => {
    setAnnouncement(message);
    
    // Clear announcement after specified time
    if (message && clearAfter > 0) {
      const timer = setTimeout(() => {
        setAnnouncement('');
      }, clearAfter);
      
      return () => {
        clearTimeout(timer);
      };
    }
  }, [message, clearAfter]);

  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      style={srOnlyStyles}
    >
      {announcement}
    </div>
  );
};

export default {
  AriaRoles,
  AriaProps,
  AriaLive,
  generateA11yId,
  getDisclosureProps,
  srOnlyStyles,
  SROnly,
  getLiveRegionProps,
  checkColorContrast,
  useFocusTrap,
  useFocusOnUpdate,
  SkipToContent,
  Announcer
}; 