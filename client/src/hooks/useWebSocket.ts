import { useState, useEffect, useCallback } from 'react';
import { WebSocketStatus } from '../services/websocketService';
import websocketService from '../services/websocketService';
import { useAuth } from './useAuth';
import { getConfig } from '../utils/config';

/**
 * Custom hook for WebSocket connections
 * Provides a simple interface to the websocketService
 */
export const useWebSocket = () => {
  const [status, setStatus] = useState<WebSocketStatus>(websocketService.getStatus());
  const { getToken } = useAuth();
  
  // Connect to WebSocket when the component mounts
  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        // Get authentication token
        const token = await getToken();
        
        // Get WebSocket URL from config
        const config = getConfig();
        const wsUrl = config.websocketUrl || 'wss://api.aerosuite.com/ws';
        
        // Connect to WebSocket
        websocketService.connect(wsUrl, token);
      } catch (_error) {
        console.error('Failed to connect to WebSocket:', error);
      }
    };
    
    // Add status listener
    websocketService.addStatusListener(setStatus);
    
    // Connect to WebSocket
    connectWebSocket();
    
    // Clean up when the component unmounts
    return () => {
      websocketService.removeStatusListener(setStatus);
    };
  }, [getToken]);
  
  /**
   * Subscribe to a specific event type
   * @param type Event type
   * @param handler Event handler
   * @returns Unsubscribe function
   */
  const subscribe = useCallback((type: string, handler: (data: any) => void) => {
    websocketService.addMessageHandler(type, handler);
    return () => {
      websocketService.removeMessageHandler(type, handler);
    };
  }, []);
  
  /**
   * Send a message to the WebSocket server
   * @param type Message type
   * @param data Message data
   */
  const send = useCallback((type: string, data: any) => {
    websocketService.send(type, data);
  }, []);
  
  /**
   * Request data synchronization
   * @param entity Entity type
   * @param lastSyncTimestamp Last sync timestamp
   */
  const requestSync = useCallback((entity: string, lastSyncTimestamp?: number) => {
    websocketService.requestSync(entity, lastSyncTimestamp);
  }, []);
  
  /**
   * Disconnect from the WebSocket server
   */
  const disconnect = useCallback(() => {
    websocketService.disconnect();
  }, []);
  
  /**
   * Reconnect to the WebSocket server
   */
  const reconnect = useCallback(async () => {
    try {
      // Get authentication token
      const token = await getToken();
      
      // Get WebSocket URL from config
      const config = getConfig();
      const wsUrl = config.websocketUrl || 'wss://api.aerosuite.com/ws';
      
      // Connect to WebSocket
      websocketService.connect(wsUrl, token);
    } catch (_error) {
      console.error('Failed to reconnect to WebSocket:', error);
    }
  }, [getToken]);
  
  return {
    status,
    subscribe,
    unsubscribe: subscribe, // Same function signature
    send,
    requestSync,
    disconnect,
    reconnect,
    isConnected: status === WebSocketStatus.OPEN,
    isConnecting: status === WebSocketStatus.CONNECTING || status === WebSocketStatus.RECONNECTING,
  };
};

export default useWebSocket; 