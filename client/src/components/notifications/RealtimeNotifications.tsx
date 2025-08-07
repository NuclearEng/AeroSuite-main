import React, { useEffect, useCallback, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useSnackbar, SnackbarKey } from 'notistack';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../../hooks/useAuth';
import { addNotification, setUnreadCount } from '../../redux/slices/notifications.slice';
import { Button } from '@mui/material';

// Define types
interface SystemAlert {
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
}

/**
 * Real-time notification component
 * 
 * This component establishes and maintains the WebSocket connection
 * for real-time notifications.
 */
const RealtimeNotifications: React.FC = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const { user, isAuthenticated, getToken } = useAuth();
  const dispatch = useDispatch();
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  
  // Configure and connect to Socket.IO server
  const connectSocket = useCallback(async () => {
    if (!isAuthenticated || !user || !user.id) {
      return;
    }
    
    try {
      // Close existing socket if any
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.disconnect();
      }
      
      // Get authentication token
      const token = await getToken();
      
      // Create a new socket connection
      socketRef.current = io(process.env.REACT_APP_API_URL || window.location.origin, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: false, // Don't connect automatically
        auth: {
          token
        }
      });
      
      // Connect manually
      socketRef.current.connect();
      
      // Set up event listeners
      socketRef.current.on('connect', handleConnect);
      socketRef.current.on('disconnect', handleDisconnect);
      socketRef.current.on('notification', handleNotification);
      socketRef.current.on('system-alert', handleSystemAlert);
      socketRef.current.on('authentication_error', handleAuthError);
      
      // Reset reconnect attempts on successful connection
      socketRef.current.on('connect', () => {
        reconnectAttemptsRef.current = 0;
      });
      
      // Handle reconnect failures
      socketRef.current.on('reconnect_failed', () => {
        console.error('Failed to reconnect to notification server after maximum attempts');
      });
    } catch (_error) {
      console.error("Error:", err);
    }
  }, [isAuthenticated, user, getToken]);
  
  // Handle successful connection
  const handleConnect = useCallback(() => {
    console.log('Connected to notification server');
    
    // Authenticate with the server
    if (socketRef.current && user) {
      socketRef.current.emit('authenticate', { userId: user.id });
    }
  }, [user]);
  
  // Handle disconnection
  const handleDisconnect = useCallback((reason: string) => {
    console.log(`Disconnected from notification server: ${reason}`);
  }, []);
  
  // Handle authentication error
  const handleAuthError = useCallback((error: { message: string }) => {
    console.error("Error:", _err)or.message);
    
    // Show error notification
    enqueueSnackbar(`Notification authentication error: ${error.message}`, {
      variant: 'error',
      autoHideDuration: 5000
    });
  }, [enqueueSnackbar]);
  
  // Handle incoming notification
  const handleNotification = useCallback((notification: any) => {
    console.log('Received notification:', notification);
    
    // Add notification to Redux store
    dispatch(addNotification(notification));
    
    // Increment unread count
    dispatch(setUnreadCount((count: number) => count + 1));
    
    // Create action button if there's a link
    const action = notification.link 
      ? (key: SnackbarKey) => (
          <Button 
            onClick={() => {
              window.location.href = notification.link;
              closeSnackbar(key);
            }}
            color="inherit"
          >
            View
          </Button>
        )
      : undefined;
    
    // Show snackbar notification
    enqueueSnackbar(notification.title, {
      variant: notification.type as 'default' | 'error' | 'success' | 'warning' | 'info',
      autoHideDuration: 5000, // 5 seconds
      action
    });
  }, [dispatch, enqueueSnackbar, closeSnackbar]);
  
  // Handle system alerts
  const handleSystemAlert = useCallback((alert: SystemAlert) => {
    console.log('Received system alert:', alert);
    
    // Show system alert
    enqueueSnackbar(alert.message, {
      variant: alert.type as 'default' | 'error' | 'success' | 'warning' | 'info',
      autoHideDuration: 8000, // 8 seconds
      persist: alert.type === 'error' // Persist error alerts
    });
  }, [enqueueSnackbar]);
  
  // Connect to socket when authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      connectSocket();
    }
    
    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [isAuthenticated, user, connectSocket]);
  
  // Reconnect socket when network status changes
  useEffect(() => {
    const handleOnline = () => {
      console.log('Network is online, reconnecting socket...');
      connectSocket();
    };
    
    const handleOffline = () => {
      console.log('Network is offline, socket will attempt to reconnect automatically');
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [connectSocket]);
  
  // This component doesn't render anything visible
  return null;
};

export default RealtimeNotifications; 