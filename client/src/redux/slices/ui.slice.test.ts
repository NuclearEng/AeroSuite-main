import reducer, {
  UiState,
  toggleDarkMode,
  setDarkMode,
  setThemeVariant,
  toggleSidebar,
  setSidebarOpen,
  addNotification,
  removeNotification,
  clearNotifications,
  setLoading
} from './ui.slice';
import { ThemeVariant } from '../../theme/themeConfig';

// Mock localStorage
const localStorageMock = (function() {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string): string | null => {
      return store[key] || null;
    }),
    setItem: jest.fn((key: string, value: string): void => {
      store[key] = value;
    }),
    clear: jest.fn((): void => {
      store = {};
    }),
    removeItem: jest.fn((key: string): void => {
      delete store[key];
    }),
    getAll: (): Record<string, string> => store
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('UI Slice', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
  });

  describe('Initial state', () => {
    it('should use localStorage values when available', () => {
      localStorageMock.getItem.mockImplementation((key: string): string | null => {
        if (key === 'darkMode') return 'true';
        if (key === 'themeVariant') return 'purple';
        if (key === 'sidebarOpen') return 'false';
        return null;
      });

      const initialState = reducer(undefined, { type: 'unknown' });
      
      expect(initialState.darkMode).toBe(true);
      expect(initialState.themeVariant).toBe('purple');
      expect(initialState.sidebarOpen).toBe(false);
    });

    it('should use default values when localStorage is empty', () => {
      localStorageMock.getItem.mockImplementation((): null => null);

      const initialState = reducer(undefined, { type: 'unknown' });
      
      expect(initialState.darkMode).toBe(false);
      expect(initialState.themeVariant).toBe('blue');
      expect(initialState.sidebarOpen).toBe(true);
      expect(initialState.notifications).toEqual([]);
      expect(initialState.isLoading).toEqual({});
    });
  });

  describe('Reducers', () => {
    it('should handle toggleDarkMode', () => {
      const initialState: UiState = {
        darkMode: false,
        themeVariant: 'blue',
        sidebarOpen: true,
        notifications: [],
        isLoading: {}
      };

      const nextState = reducer(initialState, toggleDarkMode());
      
      expect(nextState.darkMode).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('darkMode', 'true');
      
      const finalState = reducer(nextState, toggleDarkMode());
      expect(finalState.darkMode).toBe(false);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('darkMode', 'false');
    });

    it('should handle setDarkMode', () => {
      const initialState: UiState = {
        darkMode: false,
        themeVariant: 'blue',
        sidebarOpen: true,
        notifications: [],
        isLoading: {}
      };

      const nextState = reducer(initialState, setDarkMode(true));
      
      expect(nextState.darkMode).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('darkMode', 'true');
    });

    it('should handle setThemeVariant', () => {
      const initialState: UiState = {
        darkMode: false,
        themeVariant: 'blue',
        sidebarOpen: true,
        notifications: [],
        isLoading: {}
      };

      const nextState = reducer(initialState, setThemeVariant('purple'));
      
      expect(nextState.themeVariant).toBe('purple');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('themeVariant', 'purple');
    });

    it('should handle toggleSidebar', () => {
      const initialState: UiState = {
        darkMode: false,
        themeVariant: 'blue',
        sidebarOpen: false,
        notifications: [],
        isLoading: {}
      };

      const nextState = reducer(initialState, toggleSidebar());
      
      expect(nextState.sidebarOpen).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('sidebarOpen', 'true');
      
      const finalState = reducer(nextState, toggleSidebar());
      expect(finalState.sidebarOpen).toBe(false);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('sidebarOpen', 'false');
    });

    it('should handle setSidebarOpen', () => {
      const initialState: UiState = {
        darkMode: false,
        themeVariant: 'blue',
        sidebarOpen: false,
        notifications: [],
        isLoading: {}
      };

      const nextState = reducer(initialState, setSidebarOpen(true));
      
      expect(nextState.sidebarOpen).toBe(true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('sidebarOpen', 'true');
    });

    it('should handle addNotification', () => {
      const initialState: UiState = {
        darkMode: false,
        themeVariant: 'blue',
        sidebarOpen: true,
        notifications: [],
        isLoading: {}
      };

      // Mock Date.now() to return a predictable value
      const originalDateNow = Date.now;
      Date.now = jest.fn(() => 12345);

      const notification = {
        message: 'Test notification',
        type: 'success' as const,
        autoHide: true,
        duration: 3000
      };

      const nextState = reducer(initialState, addNotification(notification));
      
      expect(nextState.notifications).toHaveLength(1);
      expect(nextState.notifications[0]).toEqual({
        ...notification,
        id: '12345'
      });

      // Restore original Date.now
      Date.now = originalDateNow;
    });

    it('should handle removeNotification', () => {
      const initialState: UiState = {
        darkMode: false,
        themeVariant: 'blue',
        sidebarOpen: true,
        notifications: [
          { id: '1', message: 'First notification', type: 'info' },
          { id: '2', message: 'Second notification', type: 'success' }
        ],
        isLoading: {}
      };

      const nextState = reducer(initialState, removeNotification('1'));
      
      expect(nextState.notifications).toHaveLength(1);
      expect(nextState.notifications[0].id).toBe('2');
    });

    it('should handle clearNotifications', () => {
      const initialState: UiState = {
        darkMode: false,
        themeVariant: 'blue',
        sidebarOpen: true,
        notifications: [
          { id: '1', message: 'First notification', type: 'info' },
          { id: '2', message: 'Second notification', type: 'success' }
        ],
        isLoading: {}
      };

      const nextState = reducer(initialState, clearNotifications());
      
      expect(nextState.notifications).toHaveLength(0);
    });

    it('should handle setLoading', () => {
      const initialState: UiState = {
        darkMode: false,
        themeVariant: 'blue',
        sidebarOpen: true,
        notifications: [],
        isLoading: {}
      };

      const nextState = reducer(initialState, setLoading({ key: 'fetchUsers', isLoading: true }));
      
      expect(nextState.isLoading).toEqual({ fetchUsers: true });
      
      const finalState = reducer(nextState, setLoading({ key: 'fetchUsers', isLoading: false }));
      expect(finalState.isLoading).toEqual({ fetchUsers: false });
    });
  });
}); 