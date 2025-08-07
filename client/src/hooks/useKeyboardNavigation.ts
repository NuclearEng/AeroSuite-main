import { useRef, useEffect, useState } from 'react';
import { 
  KeyboardNavigationOptions, 
  KeyboardNavigationController,
  createKeyboardNavigation
} from '../utils/keyboardNavigation';

/**
 * Hook for keyboard navigation in React components
 * 
 * @param options - Keyboard navigation options (without container)
 * @returns Keyboard navigation controller and container ref
 */
export function useKeyboardNavigation(
  options: Omit<KeyboardNavigationOptions, 'container'>
): {
  containerRef: React.RefObject<HTMLElement>;
  controller: KeyboardNavigationController | null;
} {
  const containerRef = useRef<HTMLElement>(null);
  const [controller, setController] = useState<KeyboardNavigationController | null>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create controller
    const navigationController = createKeyboardNavigation({
      container: containerRef.current,
      ...options
    });
    
    // Initialize controller
    navigationController.init();
    
    // Store controller
    setController(navigationController);
    
    // Cleanup on unmount
    return () => {
      navigationController.destroy();
      setController(null);
    };
  }, [
    options.itemSelector,
    options.vertical,
    options.horizontal,
    options.wrap,
    options.autoFocus
  ]);
  
  return { containerRef, controller };
}

/**
 * Hook for keyboard navigable lists
 * 
 * @param options - List options
 * @returns List container ref and controller
 */
export function useKeyboardNavigableList(
  options: Omit<KeyboardNavigationOptions, 'container' | 'itemSelector' | 'vertical'> = {}
) {
  return useKeyboardNavigation({
    itemSelector: 'li',
    vertical: true,
    wrap: true,
    ...options
  });
}

/**
 * Hook for keyboard navigable grids
 * 
 * @param options - Grid options
 * @returns Grid container ref and controller
 */
export function useKeyboardNavigableGrid(
  options: Omit<KeyboardNavigationOptions, 'container' | 'itemSelector' | 'vertical' | 'horizontal'> = {}
) {
  return useKeyboardNavigation({
    itemSelector: '[role="gridcell"], [role="cell"], td',
    vertical: true,
    horizontal: true,
    wrap: true,
    ...options
  });
}

/**
 * Hook for keyboard navigable menus
 * 
 * @param options - Menu options
 * @returns Menu container ref and controller
 */
export function useKeyboardNavigableMenu(
  options: Omit<KeyboardNavigationOptions, 'container' | 'itemSelector' | 'vertical'> = {}
) {
  return useKeyboardNavigation({
    itemSelector: '[role="menuitem"], li',
    vertical: true,
    wrap: true,
    ...options
  });
}

/**
 * Hook for keyboard navigable tablists
 * 
 * @param options - Tablist options
 * @returns Tablist container ref and controller
 */
export function useKeyboardNavigableTablist(
  options: Omit<KeyboardNavigationOptions, 'container' | 'itemSelector' | 'horizontal'> = {}
) {
  return useKeyboardNavigation({
    itemSelector: '[role="tab"]',
    horizontal: true,
    wrap: true,
    ...options
  });
}

export default useKeyboardNavigation; 