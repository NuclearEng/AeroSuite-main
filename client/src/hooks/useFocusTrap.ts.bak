import { useRef, useEffect } from 'react';

/**
 * Hook to trap focus within a container for accessibility
 * Useful for modals, dialogs, and other components that need to trap focus
 * 
 * @param isActive - Whether the focus trap is active
 * @param onEscape - Optional callback to execute when Escape key is pressed
 * @returns ref - Ref to attach to the container element
 */
const useFocusTrap = (
  isActive: boolean = false,
  onEscape?: () => void
): React.RefObject<HTMLDivElement> => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    // Save the element that had focus before the modal was opened
    const previouslyFocused = document.activeElement as HTMLElement;

    // Find all focusable elements within the container
    const getFocusableElements = (): HTMLElement[] => {
      if (!containerRef.current) return [];
      
      const focusableSelectors = [
        'a[href]',
        'button:not([disabled])',
        'textarea:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        '[tabindex]:not([tabindex="-1"])'
      ];
      
      const elements = containerRef.current.querySelectorAll(
        focusableSelectors.join(',')
      );
      
      return Array.from(elements) as HTMLElement[];
    };

    // Focus the first focusable element in the modal
    const focusFirstElement = () => {
      const focusableElements = getFocusableElements();
      if (focusableElements.length > 0) {
        focusableElements[0].focus();
      } else if (containerRef.current) {
        // If no focusable elements, focus the container itself
        containerRef.current.setAttribute('tabindex', '-1');
        containerRef.current.focus();
      }
    };

    // Handle tab key to keep focus within the container
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      const focusableElements = getFocusableElements();
      if (focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      // If shift+tab on first element, move to last element
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } 
      // If tab on last element, move to first element
      else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    // Handle escape key
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onEscape) {
        onEscape();
      }
    };

    // Event handler for keydown events
    const handleKeyDown = (e: KeyboardEvent) => {
      handleTabKey(e);
      handleEscapeKey(e);
    };

    // Set up event listeners and initial focus
    document.addEventListener('keydown', handleKeyDown);
    focusFirstElement();

    // Clean up
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      
      // Restore focus to previously focused element when the modal closes
      if (previouslyFocused && 'focus' in previouslyFocused) {
        previouslyFocused.focus();
      }
    };
  }, [isActive, onEscape]);

  return containerRef;
};

export default useFocusTrap; 