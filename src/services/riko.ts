import { RikoMessage, RikoResponse } from '../types';

const RIKO_BASE_URL = 'http://localhost:5000';

export class RikoService {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.initializeConnection();
  }

  private initializeConnection() {
    console.log('RikoService: Attempting to connect to Riko server...');
    
    try {
      this.ws = new WebSocket(`ws://localhost:5000/ws`);
      
      this.ws.onopen = () => {
        console.log('RikoService: WebSocket connection established');
        this.reconnectAttempts = 0;
        this.emit('connection', { status: 'connected' });
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('RikoService: Failed to parse message', error);
        }
      };
      
      this.ws.onerror = (error) => {
        console.warn('RikoService: WebSocket error (Riko server may not be running)', error);
      };
      
      this.ws.onclose = () => {
        console.log('RikoService: WebSocket connection closed');
        this.emit('connection', { status: 'disconnected' });
        this.attemptReconnect();
      };
    } catch (error) {
      console.warn('RikoService: Failed to initialize WebSocket connection', error);
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`RikoService: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.initializeConnection();
      }, delay);
    } else {
      console.warn('RikoService: Max reconnection attempts reached. Riko server appears to be offline.');
    }
  }

  private handleMessage(data: any) {
    const msg: RikoMessage = data;
    
    if (msg.type === 'speaking') {
      this.emit('speaking', msg);
      this.triggerMouthAnimation(msg.duration || 2000);
    } else if (msg.type === 'listening') {
      this.emit('listening', msg);
    } else if (msg.type === 'idle') {
      this.emit('idle', msg);
      this.triggerMouthAnimation(0);
    }
  }

  async sendMessage(message: string): Promise<RikoResponse | null> {
    console.log('RikoService: Sending message to Riko:', message);
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const payload = {
        type: 'text',
        content: message,
        timestamp: Date.now()
      };
      
      this.ws.send(JSON.stringify(payload));
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          resolve(null);
        }, 10000);
        
        const handleResponse = (data: any) => {
          clearTimeout(timeout);
          this.off('speaking', handleResponse);
          resolve({ text: data.text || '', emotion: 'neutral' });
        };
        
        this.on('speaking', handleResponse);
      });
    } else {
      console.warn('RikoService: WebSocket not connected, falling back to HTTP');
      return this.sendHTTPMessage(message);
    }
  }

  private async sendHTTPMessage(message: string): Promise<RikoResponse | null> {
    try {
      const response = await fetch(`${RIKO_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, timestamp: Date.now() }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('RikoService: HTTP request failed (Riko server may not be running)', error);
      return null;
    }
  }

  triggerMouthAnimation(duration: number) {
    if (typeof (window as any).__triggerMouthAnimation === 'function') {
      (window as any).__triggerMouthAnimation(duration);
    }
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (data: any) => void) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => callback(data));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }
}

export const rikoService = new RikoService();
