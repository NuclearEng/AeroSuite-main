import { isOnline } from '../utils/serviceWorkerUtils';
import persistenceService from './persistenceService';

// Interface for message handlers
interface MessageHandler {
  type: string;
  handler: (data: any) => void;
}

// WebSocket events to listen for
export const WS_EVENTS = {
  DATA_UPDATED: 'data_updated',
  DATA_CREATED: 'data_created',
  DATA_DELETED: 'data_deleted',
  NOTIFICATION: 'notification',
  USER_ACTIVITY: 'user_activity',
  CONNECTION_STATE: 'connection_state',
  SYNC_REQUEST: 'sync_request',
  SYNC_RESPONSE: 'sync_response',
};

// WebSocket status
export enum WebSocketStatus {
  CONNECTING = 'connecting',
  OPEN = 'open',
  CLOSING = 'closing',
  CLOSED = 'closed',
  RECONNECTING = 'reconnecting',
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private messageHandlers: MessageHandler[] = [];
  private statusListeners: ((status: WebSocketStatus) => void)[] = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectInterval = 3000; // 3 seconds
  private pingInterval: NodeJS.Timeout | null = null;
  private status: WebSocketStatus = WebSocketStatus.CLOSED;
  private url: string = '';
  private isReconnecting = false;
  private autoReconnect = true;
  private pendingMessages: { type: string; data: any }[] = [];

  /**
   * Initialize the WebSocket connection
   * @param url WebSocket URL
   * @param token Authentication token
   * @param autoReconnect Whether to automatically reconnect
   */
  public connect(url: string, token?: string, autoReconnect = true): void {
    if (this.socket && (this.status === WebSocketStatus.OPEN || this.status === WebSocketStatus.CONNECTING)) {
      console.warn('WebSocket connection already exists');
      return;
    }

    // Don't attempt to connect if offline
    if (!isOnline()) {
      this.setStatus(WebSocketStatus.CLOSED);
      this.savePendingMessagesOffline();
      return;
    }

    this.url = url;
    this.autoReconnect = autoReconnect;
    this.reconnectAttempts = 0;

    // Add token to URL if provided
    const wsUrl = token ? `${url}?token=${token}` : url;

    try {
      this.socket = new WebSocket(wsUrl);
      this.setStatus(WebSocketStatus.CONNECTING);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (_error) {
      console.error('Failed to create WebSocket connection:', error);
      this.setStatus(WebSocketStatus.CLOSED);
      this.attemptReconnect();
    }
  }

  /**
   * Close the WebSocket connection
   */
  public disconnect(): void {
    this.autoReconnect = false;
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.socket) {
      this.setStatus(WebSocketStatus.CLOSING);
      this.socket.close();
      this.socket = null;
    }
    
    this.setStatus(WebSocketStatus.CLOSED);
  }

  /**
   * Add a message handler for a specific message type
   * @param type Message type
   * @param handler Handler function
   */
  public addMessageHandler(type: string, handler: (data: any) => void): void {
    this.messageHandlers.push({ type, handler });
  }

  /**
   * Remove a message handler
   * @param type Message type
   * @param handler Handler function
   */
  public removeMessageHandler(type: string, handler: (data: any) => void): void {
    this.messageHandlers = this.messageHandlers.filter(
      (h) => h.type !== type || h.handler !== handler
    );
  }

  /**
   * Add a status listener
   * @param listener Status listener function
   */
  public addStatusListener(listener: (status: WebSocketStatus) => void): void {
    this.statusListeners.push(listener);
    // Immediately notify the listener of the current status
    listener(this.status);
  }

  /**
   * Remove a status listener
   * @param listener Status listener function
   */
  public removeStatusListener(listener: (status: WebSocketStatus) => void): void {
    this.statusListeners = this.statusListeners.filter((l) => l !== listener);
  }

  /**
   * Send a message to the server
   * @param type Message type
   * @param data Message data
   */
  public send(type: string, data: any): void {
    if (!this.socket || this.status !== WebSocketStatus.OPEN) {
      console.warn(`Cannot send message, WebSocket is not open. Status: ${this.status}`);
      // Queue message to be sent when connection is established
      this.pendingMessages.push({ type, data });
      return;
    }

    try {
      this.socket.send(JSON.stringify({ type, data }));
    } catch (_error) {
      console.error('Failed to send message:', error);
      this.pendingMessages.push({ type, data });
    }
  }

  /**
   * Request data synchronization
   * @param entity Entity type (e.g., 'inspections', 'suppliers')
   * @param lastSyncTimestamp Last sync timestamp
   */
  public requestSync(entity: string, lastSyncTimestamp?: number): void {
    this.send(WS_EVENTS.SYNC_REQUEST, {
      entity,
      lastSyncTimestamp: lastSyncTimestamp || Date.now() - 86400000, // Default to 24 hours ago
    });
  }

  /**
   * Get the current connection status
   */
  public getStatus(): WebSocketStatus {
    return this.status;
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log('WebSocket connection established');
    this.setStatus(WebSocketStatus.OPEN);
    this.reconnectAttempts = 0;
    
    // Set up ping interval to keep connection alive
    this.pingInterval = setInterval(() => {
      this.sendPing();
    }, 30000); // Every 30 seconds
    
    // Send any pending messages
    this.sendPendingMessages();
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      const { type, data } = message;
      
      if (type === 'pong') {
        // Handle ping response
        return;
      }
      
      // Notify all handlers that match this message type
      this.messageHandlers
        .filter((handler) => handler.type === type)
        .forEach((handler) => handler.handler(data));
    } catch (_error) {
      console.error('Failed to handle WebSocket message:', error);
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    const { code, reason, wasClean } = event;
    console.log(`WebSocket connection closed: ${code} ${reason} (clean: ${wasClean})`);
    
    this.setStatus(WebSocketStatus.CLOSED);
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.autoReconnect && isOnline()) {
      this.attemptReconnect();
    } else {
      this.savePendingMessagesOffline();
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    
    // The error event is usually followed by a close event,
    // so we'll attempt to reconnect in the close handler
  }

  /**
   * Send a ping message to keep the connection alive
   */
  private sendPing(): void {
    if (this.socket && this.status === WebSocketStatus.OPEN) {
      try {
        this.socket.send(JSON.stringify({ type: 'ping' }));
      } catch (_error) {
        console.error('Failed to send ping:', error);
      }
    }
  }

  /**
   * Attempt to reconnect to the server
   */
  private attemptReconnect(): void {
    if (this.isReconnecting || !this.autoReconnect || !isOnline()) {
      return;
    }
    
    this.isReconnecting = true;
    this.setStatus(WebSocketStatus.RECONNECTING);
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Maximum reconnection attempts reached');
      this.isReconnecting = false;
      this.setStatus(WebSocketStatus.CLOSED);
      this.savePendingMessagesOffline();
      return;
    }
    
    const delay = this.reconnectInterval * Math.pow(1.5, this.reconnectAttempts);
    this.reconnectAttempts++;
    
    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
    
    this.reconnectTimeout = setTimeout(() => {
      this.isReconnecting = false;
      this.connect(this.url, undefined, this.autoReconnect);
    }, delay);
  }

  /**
   * Set the connection status and notify listeners
   */
  private setStatus(status: WebSocketStatus): void {
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }

  /**
   * Send all pending messages
   */
  private sendPendingMessages(): void {
    if (this.pendingMessages.length === 0) {
      return;
    }
    
    console.log(`Sending ${this.pendingMessages.length} pending messages`);
    
    const messages = [...this.pendingMessages];
    this.pendingMessages = [];
    
    messages.forEach(({ type, data }) => {
      this.send(type, data);
    });
  }

  /**
   * Save pending messages to be sent when online
   */
  private savePendingMessagesOffline(): void {
    if (this.pendingMessages.length === 0) {
      return;
    }
    
    console.log(`Saving ${this.pendingMessages.length} pending messages for offline mode`);
    
    // Store pending messages in IndexedDB
    this.pendingMessages.forEach(({ type, data }) => {
      persistenceService.addPendingRequest({
        url: '/ws',
        method: 'WS',
        data: { type, data }
      });
    });
    
    this.pendingMessages = [];
  }
}

// Create a singleton instance
const websocketService = new WebSocketService();

export default websocketService; 