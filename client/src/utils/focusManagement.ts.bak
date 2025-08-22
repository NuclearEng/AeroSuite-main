/**
 * Focus Management Utilities
 * 
 * This module provides utilities for managing focus and keyboard navigation
 * to improve accessibility for keyboard users.
 */

/**
 * Interface for focus trap options
 */
export interface FocusTrapOptions {
  /** Root element to trap focus within */
  root: HTMLElement;
  /** Initial element to focus when trap is activated */
  initialFocus?: HTMLElement | null;
  /** Whether to auto-focus the initial element when trap is activated */
  autoFocus?: boolean;
  /** Whether to restore focus to the previously focused element when trap is deactivated */
  restoreFocus?: boolean;
  /** Whether to include hidden elements in the focus order */
  includeHidden?: boolean;
  /** Callback when focus successfully moves to another element */
  onFocusMove?: (prevElement: HTMLElement | null, nextElement: HTMLElement) => void;
  /** Callback when focus tries to escape the trap */
  onEscapeAttempt?: (event: KeyboardEvent) => void;
}

/**
 * Interface for focus trap instance
 */
export interface FocusTrap {
  /** Activate the focus trap */
  activate: () => void;
  /** Deactivate the focus trap */
  deactivate: () => void;
  /** Update the focus trap (e.g., when focusable elements change) */
  update: () => void;
  /** Check if the focus trap is active */
  isActive: () => boolean;
  /** Get all focusable elements within the trap */
  getFocusableElements: () => HTMLElement[];
  /** Get the currently focused element */
  getCurrentFocusedElement: () => HTMLElement | null;
}

/**
 * Create a focus trap within a container element
 * 
 * @param options - Focus trap options
 * @returns Focus trap instance
 */
export function createFocusTrap(options: FocusTrapOptions): FocusTrap {
  const {
    root,
    initialFocus,
    autoFocus = true,
    restoreFocus = true,
    includeHidden = false,
    onFocusMove,
    onEscapeAttempt
  } = options;
  
  let active = false;
  let previouslyFocused: HTMLElement | null = null;
  
  // Get all focusable elements within the container
  const getFocusableElements = (): HTMLElement[] => {
    // Selectors for all potentially focusable elements
    const selector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      'details:not([disabled])',
      'summary:not(:disabled)',
      'iframe',
      'object',
      'embed',
      'audio[controls]',
      'video[controls]',
      '[contenteditable]'
    ].join(',');
    
    // Get all elements matching the selector
    const elements = Array.from(root.querySelectorAll<HTMLElement>(selector))
      .filter(element => {
        // Skip hidden elements unless includeHidden is true
        if (!includeHidden) {
          const style = window.getComputedStyle(element);
          return !(style.display === 'none' || style.visibility === 'hidden' || element.hasAttribute('hidden'));
        }
        return true;
      })
      .filter(element => {
        // Ensure element is not inside a hidden container
        let parent = element.parentElement;
        while (parent && parent !== root) {
          const style = window.getComputedStyle(parent);
          if (style.display === 'none' || style.visibility === 'hidden' || parent.hasAttribute('hidden')) {
            return false;
          }
          parent = parent.parentElement;
        }
        return true;
      });
    
    // Sort by tabindex
    return elements.sort((a, b) => {
      const aTabIndex = a.tabIndex || 0;
      const bTabIndex = b.tabIndex || 0;
      
      if (aTabIndex === bTabIndex) return 0;
      if (aTabIndex === 0) return 1;
      if (bTabIndex === 0) return -1;
      return aTabIndex - bTabIndex;
    });
  };
  
  // Handle tab key to keep focus within the container
  const handleTabKey = (event: KeyboardEvent) => {
    if (!active || event.key !== 'Tab') return;
    
    const focusableElements = getFocusableElements();
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const currentElement = document.activeElement as HTMLElement;
    
    // Handle Tab key
    if (!event.shiftKey && currentElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
      onFocusMove?.(currentElement, firstElement);
      return;
    }
    
    // Handle Shift+Tab key
    if (event.shiftKey && currentElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      onFocusMove?.(currentElement, lastElement);
      return;
    }
    
    // Handle focus moving to another element within the trap
    const currentIndex = focusableElements.indexOf(currentElement);
    if (currentIndex !== -1) {
      const nextIndex = event.shiftKey ? currentIndex - 1 : currentIndex + 1;
      if (nextIndex >= 0 && nextIndex < focusableElements.length) {
        onFocusMove?.(currentElement, focusableElements[nextIndex]);
      }
    }
  };
  
  // Handle focus moving outside the container
  const handleFocusIn = (event: FocusEvent) => {
    if (!active) return;
    
    const target = event.target as HTMLElement;
    if (root.contains(target)) return;
    
    // Focus moved outside the container, bring it back
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      event.preventDefault();
      focusableElements[0].focus();
      onEscapeAttempt?.(event as unknown as KeyboardEvent);
    }
  };
  
  // Activate the focus trap
  const activate = () => {
    if (active) return;
    
    // Store the currently focused element to restore later
    previouslyFocused = document.activeElement as HTMLElement;
    
    // Set up event listeners
    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('focusin', handleFocusIn);
    
    // Focus the initial element if specified
    if (autoFocus) {
      const focusTarget = initialFocus || getFocusableElements()[0];
      if (focusTarget) {
        setTimeout(() => {
          focusTarget.focus();
        }, 0);
      }
    }
    
    active = true;
  };
  
  // Deactivate the focus trap
  const deactivate = () => {
    if (!active) return;
    
    // Remove event listeners
    document.removeEventListener('keydown', handleTabKey);
    document.removeEventListener('focusin', handleFocusIn);
    
    // Restore focus to the previously focused element
    if (restoreFocus && previouslyFocused && previouslyFocused.focus) {
      setTimeout(() => {
        previouslyFocused?.focus();
      }, 0);
    }
    
    active = false;
  };
  
  // Update the focus trap (e.g., when the DOM changes)
  const update = () => {
    // Nothing to do if not active
    if (!active) return;
    
    // Check if the currently focused element is still within the trap
    const currentElement = document.activeElement as HTMLElement;
    if (!root.contains(currentElement)) {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      }
    }
  };
  
  // Get the currently focused element
  const getCurrentFocusedElement = (): HTMLElement | null => {
    return document.activeElement as HTMLElement;
  };
  
  // Check if the focus trap is active
  const isActive = (): boolean => {
    return active;
  };
  
  return {
    activate,
    deactivate,
    update,
    isActive,
    getFocusableElements,
    getCurrentFocusedElement
  };
}

/**
 * Focus the first focusable element within a container
 * 
 * @param container - Container element
 * @returns The element that was focused, or null if none was found
 */
export function focusFirstElement(container: HTMLElement): HTMLElement | null {
  const focusTrap = createFocusTrap({ root: container });
  const elements = focusTrap.getFocusableElements();
  
  if (elements.length > 0) {
    elements[0].focus();
    return elements[0];
  }
  
  return null;
}

/**
 * Create a focus manager for handling focus within a component
 * 
 * @param container - Container element reference
 * @returns Focus management functions
 */
export function useFocusManager(container: React.RefObject<HTMLElement>) {
  let focusTrap: FocusTrap | null = null;
  
  // Initialize the focus trap
  const initFocusTrap = (options: Omit<FocusTrapOptions, 'root'> = {}) => {
    if (!container.current) return null;
    
    focusTrap = createFocusTrap({
      root: container.current,
      ...options
    });
    
    return focusTrap;
  };
  
  // Activate the focus trap
  const trapFocus = (options: Omit<FocusTrapOptions, 'root'> = {}) => {
    if (!focusTrap) {
      focusTrap = initFocusTrap(options);
    }
    
    focusTrap?.activate();
    return focusTrap;
  };
  
  // Release the focus trap
  const releaseFocus = () => {
    focusTrap?.deactivate();
  };
  
  // Update the focus trap
  const updateFocusTrap = () => {
    focusTrap?.update();
  };
  
  return {
    initFocusTrap,
    trapFocus,
    releaseFocus,
    updateFocusTrap,
    getFocusableElements: () => focusTrap?.getFocusableElements() || []
  };
}

/**
 * Focus an element and scroll it into view
 * 
 * @param element - Element to focus
 * @param options - Focus options
 */
export function focusAndScroll(
  element: HTMLElement,
  options: { preventScroll?: boolean; scrollOptions?: ScrollIntoViewOptions } = {}
): void {
  const { preventScroll = false, scrollOptions = { behavior: 'smooth', block: 'nearest' } } = options;
  
  element.focus({ preventScroll });
  
  if (!preventScroll) {
    element.scrollIntoView(scrollOptions);
  }
}

/**
 * Set up keyboard navigation for a list of elements
 * 
 * @param options - Keyboard navigation options
 * @returns Keyboard event handler
 */
export function setupKeyboardNavigation(options: {
  vertical?: boolean;
  horizontal?: boolean;
  wrap?: boolean;
  itemSelector: string;
  onItemFocus?: (item: HTMLElement, index: number) => void;
  onItemSelect?: (item: HTMLElement, index: number) => void;
  onEscape?: () => void;
}): (event: KeyboardEvent) => void {
  const {
    vertical = true,
    horizontal = false,
    wrap = true,
    itemSelector,
    onItemFocus,
    onItemSelect,
    onEscape
  } = options;
  
  return (event: KeyboardEvent) => {
    const container = (event.currentTarget as HTMLElement);
    const items = Array.from(container.querySelectorAll<HTMLElement>(itemSelector));
    if (items.length === 0) return;
    
    const currentElement = document.activeElement as HTMLElement;
    const currentIndex = items.indexOf(currentElement);
    
    let nextIndex = currentIndex;
    
    switch (event.key) {
      case 'ArrowDown':
        if (vertical) {
          event.preventDefault();
          nextIndex = currentIndex + 1;
          if (nextIndex >= items.length) {
            nextIndex = wrap ? 0 : items.length - 1;
          }
        }
        break;
        
      case 'ArrowUp':
        if (vertical) {
          event.preventDefault();
          nextIndex = currentIndex - 1;
          if (nextIndex < 0) {
            nextIndex = wrap ? items.length - 1 : 0;
          }
        }
        break;
        
      case 'ArrowRight':
        if (horizontal) {
          event.preventDefault();
          nextIndex = currentIndex + 1;
          if (nextIndex >= items.length) {
            nextIndex = wrap ? 0 : items.length - 1;
          }
        }
        break;
        
      case 'ArrowLeft':
        if (horizontal) {
          event.preventDefault();
          nextIndex = currentIndex - 1;
          if (nextIndex < 0) {
            nextIndex = wrap ? items.length - 1 : 0;
          }
        }
        break;
        
      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;
        
      case 'End':
        event.preventDefault();
        nextIndex = items.length - 1;
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (currentIndex !== -1) {
          onItemSelect?.(items[currentIndex], currentIndex);
        }
        return;
        
      case 'Escape':
        event.preventDefault();
        onEscape?.();
        return;
        
      default:
        return;
    }
    
    if (nextIndex !== currentIndex && nextIndex >= 0 && nextIndex < items.length) {
      items[nextIndex].focus();
      onItemFocus?.(items[nextIndex], nextIndex);
    }
  };
}

/**
 * Create an accessible announcement that will be read by screen readers
 * 
 * @param message - Message to announce
 * @param options - Announcement options
 */
export function announce(
  message: string,
  options: { politeness?: 'polite' | 'assertive'; timeout?: number } = {}
): void {
  const { politeness = 'polite', timeout = 500 } = options;
  
  // Create or get the announcement element
  let announcer = document.getElementById('a11y-announcer');
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'a11y-announcer';
    announcer.setAttribute('aria-live', politeness);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.setAttribute('role', 'status');
    announcer.style.position = 'absolute';
    announcer.style.width = '1px';
    announcer.style.height = '1px';
    announcer.style.padding = '0';
    announcer.style.margin = '-1px';
    announcer.style.overflow = 'hidden';
    announcer.style.clip = 'rect(0, 0, 0, 0)';
    announcer.style.whiteSpace = 'nowrap';
    announcer.style.border = '0';
    document.body.appendChild(announcer);
  } else {
    // Update politeness if different
    announcer.setAttribute('aria-live', politeness);
  }
  
  // Clear previous announcement
  announcer.textContent = '';
  
  // Set the new announcement after a small delay
  // This ensures screen readers will announce it
  setTimeout(() => {
    if (announcer) {
      announcer.textContent = message;
    }
  }, timeout);
}

export default {
  createFocusTrap,
  focusFirstElement,
  useFocusManager,
  focusAndScroll,
  setupKeyboardNavigation,
  announce
}; 