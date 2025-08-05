import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../redux/store';
import { toggleSidebar, toggleDarkMode } from '../redux/slices/ui.slice';

// Define shortcut types
export type KeyboardShortcut = {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  description: string;
  action: () => void;
  scope?: 'global' | 'page' | 'modal' | 'component';
  disabled?: boolean;
};

export type ShortcutMap = {
  [key: string]: KeyboardShortcut;
};

export type ShortcutGroup = {
  name: string;
  shortcuts: ShortcutMap;
};

// Helper to generate a unique key for each shortcut combination
export const getShortcutKey = (shortcut: Omit<KeyboardShortcut, 'description' | 'action' | 'scope' | 'disabled'>) => {
  const modifiers = [
    shortcut.ctrlKey ? 'ctrl' : '',
    shortcut.altKey ? 'alt' : '',
    shortcut.shiftKey ? 'shift' : '',
    shortcut.metaKey ? 'meta' : '',
  ].filter(Boolean).join('+');
  
  return modifiers ? `${modifiers}+${shortcut.key}` : shortcut.key;
};

// Pretty format shortcut for display
export const formatShortcut = (shortcut: Omit<KeyboardShortcut, 'description' | 'action' | 'scope' | 'disabled'>) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  const modifiers = [
    shortcut.ctrlKey ? (isMac ? '⌃' : 'Ctrl') : '',
    shortcut.altKey ? (isMac ? '⌥' : 'Alt') : '',
    shortcut.shiftKey ? (isMac ? '⇧' : 'Shift') : '',
    shortcut.metaKey ? (isMac ? '⌘' : 'Win') : '',
  ].filter(Boolean);
  
  // Format special keys and single characters
  let keyDisplay = shortcut.key;
  
  switch (shortcut.key.toLowerCase()) {
    case 'arrowup':
      keyDisplay = '↑';
      break;
    case 'arrowdown':
      keyDisplay = '↓';
      break;
    case 'arrowleft':
      keyDisplay = '←';
      break;
    case 'arrowright':
      keyDisplay = '→';
      break;
    case 'escape':
      keyDisplay = 'Esc';
      break;
    case ' ':
      keyDisplay = 'Space';
      break;
    default:
      // Capitalize single letters for better readability
      if (shortcut.key.length === 1) {
        keyDisplay = shortcut.key.toUpperCase();
      }
  }
  
  return [...modifiers, keyDisplay].join(' + ');
};

// Hook to use application-wide keyboard shortcuts
export const useKeyboardShortcuts = (customShortcuts: ShortcutMap = {}) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Define global shortcuts
  const globalShortcuts: ShortcutMap = {
    'toggle-sidebar': {
      key: 'b',
      ctrlKey: true,
      description: 'Toggle sidebar',
      action: () => dispatch(toggleSidebar()),
      scope: 'global',
    },
    'toggle-theme': {
      key: 'd',
      ctrlKey: true,
      shiftKey: true,
      description: 'Toggle dark/light mode',
      action: () => dispatch(toggleDarkMode()),
      scope: 'global',
    },
    'go-home': {
      key: 'h',
      ctrlKey: true,
      description: 'Go to dashboard',
      action: () => navigate('/dashboard'),
      scope: 'global',
    },
    'go-settings': {
      key: ',',
      ctrlKey: true,
      description: 'Go to settings',
      action: () => navigate('/settings'),
      scope: 'global',
    },
    'search': {
      key: 'k',
      ctrlKey: true,
      description: 'Focus search',
      action: () => {
        const searchInput = document.querySelector('input[aria-label="search application"]') as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
      scope: 'global',
    },
    'help': {
      key: '?',
      description: 'Show keyboard shortcuts',
      action: () => {
        // This will be implemented later when we add the shortcuts dialog
        console.log('Show keyboard shortcuts dialog');
      },
      scope: 'global',
    },
    'escape': {
      key: 'Escape',
      description: 'Close dialogs/popups',
      action: () => {
        // This will close any open modal or popup
        document.dispatchEvent(new CustomEvent('app:escape'));
      },
      scope: 'global',
    },
  };
  
  // Combine global and custom shortcuts
  const allShortcuts = { ...globalShortcuts, ...customShortcuts };
  
  // Event handler for keyboard shortcuts
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Skip if the user is typing in an input field, textarea, or contentEditable element
    if (
      document.activeElement instanceof HTMLInputElement ||
      document.activeElement instanceof HTMLTextAreaElement ||
      document.activeElement instanceof HTMLSelectElement ||
      (document.activeElement as HTMLElement)?.isContentEditable
    ) {
      return;
    }
    
    // Check if the event matches any registered shortcuts
    Object.values(allShortcuts).forEach((shortcut) => {
      if (shortcut.disabled) return;
      
      const keyMatch = event.key === shortcut.key;
      const ctrlMatch = !!shortcut.ctrlKey === event.ctrlKey;
      const altMatch = !!shortcut.altKey === event.altKey;
      const shiftMatch = !!shortcut.shiftKey === event.shiftKey;
      const metaMatch = !!shortcut.metaKey === event.metaKey;
      
      if (keyMatch && ctrlMatch && altMatch && shiftMatch && metaMatch) {
        event.preventDefault();
        shortcut.action();
      }
    });
  }, [allShortcuts]);
  
  // Register the event listener
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
  
  return { shortcuts: allShortcuts };
};

// Shortcut groups for documentation and help display
export const shortcutGroups: ShortcutGroup[] = [
  {
    name: 'Navigation',
    shortcuts: {
      'go-home': {
        key: 'h',
        ctrlKey: true,
        description: 'Go to dashboard',
        action: () => {},
      },
      'go-settings': {
        key: ',',
        ctrlKey: true,
        description: 'Go to settings',
        action: () => {},
      },
    },
  },
  {
    name: 'UI Controls',
    shortcuts: {
      'toggle-sidebar': {
        key: 'b',
        ctrlKey: true,
        description: 'Toggle sidebar',
        action: () => {},
      },
      'toggle-theme': {
        key: 'd',
        ctrlKey: true,
        shiftKey: true,
        description: 'Toggle dark/light mode',
        action: () => {},
      },
    },
  },
  {
    name: 'Application',
    shortcuts: {
      'search': {
        key: 'k',
        ctrlKey: true,
        description: 'Focus search',
        action: () => {},
      },
      'help': {
        key: '?',
        description: 'Show keyboard shortcuts',
        action: () => {},
      },
      'escape': {
        key: 'Escape',
        description: 'Close dialogs/popups',
        action: () => {},
      },
    },
  },
];

// Export default hook for easy importing
export default useKeyboardShortcuts; 