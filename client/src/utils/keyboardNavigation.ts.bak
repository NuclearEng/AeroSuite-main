/**
 * Keyboard Navigation Utilities
 * 
 * This module provides utilities for enhancing keyboard navigation
 * to improve accessibility for keyboard users.
 */

/**
 * Interface for keyboard navigation options
 */
export interface KeyboardNavigationOptions {
  /** Container element reference */
  container: HTMLElement;
  /** Selector for focusable items */
  itemSelector: string;
  /** Whether to enable vertical navigation */
  vertical?: boolean;
  /** Whether to enable horizontal navigation */
  horizontal?: boolean;
  /** Whether to wrap around when reaching the end */
  wrap?: boolean;
  /** Whether to automatically focus the first item on initialization */
  autoFocus?: boolean;
  /** Callback when an item is focused */
  onItemFocus?: (item: HTMLElement, index: number) => void;
  /** Callback when an item is selected (Enter/Space) */
  onItemSelect?: (item: HTMLElement, index: number) => void;
  /** Callback when navigation escapes */
  onEscape?: () => void;
}

/**
 * Interface for keyboard navigation controller
 */
export interface KeyboardNavigationController {
  /** Initialize the keyboard navigation */
  init: () => void;
  /** Destroy the keyboard navigation */
  destroy: () => void;
  /** Focus a specific item by index */
  focusItem: (index: number) => void;
  /** Focus the next item */
  focusNext: () => void;
  /** Focus the previous item */
  focusPrevious: () => void;
  /** Focus the first item */
  focusFirst: () => void;
  /** Focus the last item */
  focusLast: () => void;
  /** Get all focusable items */
  getItems: () => HTMLElement[];
  /** Get the currently focused item index */
  getCurrentIndex: () => number;
}

/**
 * Create a keyboard navigation controller
 * 
 * @param options - Keyboard navigation options
 * @returns Keyboard navigation controller
 */
export function createKeyboardNavigation(options: KeyboardNavigationOptions): KeyboardNavigationController {
  const {
    container,
    itemSelector,
    vertical = true,
    horizontal = false,
    wrap = true,
    autoFocus = false,
    onItemFocus,
    onItemSelect,
    onEscape
  } = options;
  
  let items: HTMLElement[] = [];
  let currentIndex = -1;
  let keydownListener: ((event: KeyboardEvent) => void) | null = null;
  
  // Get all focusable items
  const getItems = (): HTMLElement[] => {
    return Array.from(container.querySelectorAll<HTMLElement>(itemSelector));
  };
  
  // Focus a specific item by index
  const focusItem = (index: number): void => {
    items = getItems();
    
    if (items.length === 0) return;
    
    // Ensure index is within bounds
    const boundedIndex = wrap
      ? (index + items.length) % items.length
      : Math.max(0, Math.min(index, items.length - 1));
    
    const item = items[boundedIndex];
    if (item) {
      item.focus();
      currentIndex = boundedIndex;
      onItemFocus?.(item, boundedIndex);
    }
  };
  
  // Focus the next item
  const focusNext = (): void => {
    focusItem(currentIndex + 1);
  };
  
  // Focus the previous item
  const focusPrevious = (): void => {
    focusItem(currentIndex - 1);
  };
  
  // Focus the first item
  const focusFirst = (): void => {
    focusItem(0);
  };
  
  // Focus the last item
  const focusLast = (): void => {
    items = getItems();
    focusItem(items.length - 1);
  };
  
  // Get the current focused item index
  const getCurrentIndex = (): number => {
    return currentIndex;
  };
  
  // Handle keyboard events
  const handleKeyDown = (event: KeyboardEvent): void => {
    // Only handle keyboard events when the container or its children have focus
    const activeElement = document.activeElement;
    if (!container.contains(activeElement)) return;
    
    switch (event.key) {
      case 'ArrowDown':
        if (vertical) {
          event.preventDefault();
          focusNext();
        }
        break;
        
      case 'ArrowUp':
        if (vertical) {
          event.preventDefault();
          focusPrevious();
        }
        break;
        
      case 'ArrowRight':
        if (horizontal) {
          event.preventDefault();
          focusNext();
        }
        break;
        
      case 'ArrowLeft':
        if (horizontal) {
          event.preventDefault();
          focusPrevious();
        }
        break;
        
      case 'Home':
        event.preventDefault();
        focusFirst();
        break;
        
      case 'End':
        event.preventDefault();
        focusLast();
        break;
        
      case 'Enter':
      case ' ':
        if (currentIndex !== -1) {
          event.preventDefault();
          onItemSelect?.(items[currentIndex], currentIndex);
        }
        break;
        
      case 'Escape':
        event.preventDefault();
        onEscape?.();
        break;
    }
  };
  
  // Initialize keyboard navigation
  const init = (): void => {
    items = getItems();
    
    // Add event listener for keyboard navigation
    keydownListener = handleKeyDown;
    container.addEventListener('keydown', keydownListener);
    
    // Set initial focus if requested
    if (autoFocus && items.length > 0) {
      focusFirst();
    }
    
    // Update current index based on currently focused element
    const activeElement = document.activeElement as HTMLElement;
    if (container.contains(activeElement)) {
      currentIndex = items.indexOf(activeElement);
    }
  };
  
  // Destroy keyboard navigation
  const destroy = (): void => {
    if (keydownListener) {
      container.removeEventListener('keydown', keydownListener);
      keydownListener = null;
    }
  };
  
  return {
    init,
    destroy,
    focusItem,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    getItems,
    getCurrentIndex
  };
}

/**
 * Create a keyboard navigation controller for a React component
 * 
 * @param options - Keyboard navigation options
 * @returns Keyboard navigation controller
 */
export function useKeyboardNavigation(options: Omit<KeyboardNavigationOptions, 'container'> & { containerRef: React.RefObject<HTMLElement> }): KeyboardNavigationController | null {
  const { containerRef, ...restOptions } = options;
  
  if (!containerRef.current) {
    return null;
  }
  
  const controller = createKeyboardNavigation({
    container: containerRef.current,
    ...restOptions
  });
  
  return controller;
}

/**
 * Make a list navigable with keyboard
 * 
 * @param listElement - List element
 * @param options - Options for keyboard navigation
 * @returns Cleanup function
 */
export function makeListKeyboardNavigable(
  listElement: HTMLElement,
  options: Partial<Omit<KeyboardNavigationOptions, 'container'>> = {}
): () => void {
  const controller = createKeyboardNavigation({
    container: listElement,
    itemSelector: options.itemSelector || 'li',
    vertical: options.vertical !== undefined ? options.vertical : true,
    wrap: options.wrap !== undefined ? options.wrap : true,
    ...options
  });
  
  controller.init();
  
  return () => controller.destroy();
}

/**
 * Make a grid navigable with keyboard
 * 
 * @param gridElement - Grid element
 * @param options - Options for keyboard navigation
 * @returns Cleanup function
 */
export function makeGridKeyboardNavigable(
  gridElement: HTMLElement,
  options: Partial<Omit<KeyboardNavigationOptions, 'container'>> = {}
): () => void {
  const controller = createKeyboardNavigation({
    container: gridElement,
    itemSelector: options.itemSelector || '[role="gridcell"], [role="cell"], td',
    vertical: options.vertical !== undefined ? options.vertical : true,
    horizontal: options.horizontal !== undefined ? options.horizontal : true,
    wrap: options.wrap !== undefined ? options.wrap : true,
    ...options
  });
  
  controller.init();
  
  return () => controller.destroy();
}

/**
 * Make a menu navigable with keyboard
 * 
 * @param menuElement - Menu element
 * @param options - Options for keyboard navigation
 * @returns Cleanup function
 */
export function makeMenuKeyboardNavigable(
  menuElement: HTMLElement,
  options: Partial<Omit<KeyboardNavigationOptions, 'container'>> = {}
): () => void {
  const controller = createKeyboardNavigation({
    container: menuElement,
    itemSelector: options.itemSelector || '[role="menuitem"], li',
    vertical: options.vertical !== undefined ? options.vertical : true,
    wrap: options.wrap !== undefined ? options.wrap : true,
    ...options
  });
  
  controller.init();
  
  return () => controller.destroy();
}

/**
 * Make a tablist navigable with keyboard
 * 
 * @param tablistElement - Tablist element
 * @param options - Options for keyboard navigation
 * @returns Cleanup function
 */
export function makeTablistKeyboardNavigable(
  tablistElement: HTMLElement,
  options: Partial<Omit<KeyboardNavigationOptions, 'container'>> = {}
): () => void {
  const controller = createKeyboardNavigation({
    container: tablistElement,
    itemSelector: options.itemSelector || '[role="tab"]',
    horizontal: options.horizontal !== undefined ? options.horizontal : true,
    wrap: options.wrap !== undefined ? options.wrap : true,
    ...options
  });
  
  controller.init();
  
  return () => controller.destroy();
}

export default {
  createKeyboardNavigation,
  useKeyboardNavigation,
  makeListKeyboardNavigable,
  makeGridKeyboardNavigable,
  makeMenuKeyboardNavigable,
  makeTablistKeyboardNavigable
}; 