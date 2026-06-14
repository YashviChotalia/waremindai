/**
 * wsService.ts — WebSocket client for real-time warehouse telemetry.
 *
 * Connects to the FastAPI WebSocket endpoint per warehouse.
 * Dispatches typed messages to the Zustand store.
 *
 * Usage (in App.tsx or useWarehouseStore):
 *   wsService.connect('WH-01');
 *   wsService.onMessage((msg) => handleMessage(msg));
 */

export type WsMessageType =
  | 'CONNECTED'
  | 'STAGE_UPDATE'
  | 'ALERT'
  | 'BOTTLENECK'
  | 'FORECAST_UPDATE'
  | 'HEALTH_UPDATE'
  | 'SUPERVISOR_STATUS'
  | 'KEEPALIVE'
  | 'PONG';

export interface WsMessage {
  type: WsMessageType;
  warehouse_id?: string;
  payload?: unknown;
}

type MessageHandler = (msg: WsMessage) => void;
type StatusHandler = (status: 'connecting' | 'connected' | 'disconnected' | 'error') => void;

const WS_BASE_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000';
const RECONNECT_DELAY_MS = 3000;
const MAX_RECONNECT_ATTEMPTS = 5;

class WarehouseWebSocketService {
  private ws: WebSocket | null = null;
  private warehouseId: string | null = null;
  private messageHandlers: Set<MessageHandler> = new Set();
  private statusHandlers: Set<StatusHandler> = new Set();
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private intentionalClose = false;

  /** Connect to a specific warehouse's telemetry feed. */
  connect(warehouseId: string): void {
    // Disconnect from previous warehouse if switching
    if (this.warehouseId !== warehouseId && this.ws) {
      this.intentionalClose = true;
      this.ws.close();
    }

    this.warehouseId = warehouseId;
    this.intentionalClose = false;
    this._open();
  }

  /** Disconnect cleanly. */
  disconnect(): void {
    this.intentionalClose = true;
    this._clearTimers();
    this.ws?.close();
    this.ws = null;
  }

  /** Subscribe to incoming messages. */
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  /** Subscribe to connection status changes. */
  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  // ─────────────────── Private ───────────────────

  private _open(): void {
    if (!this.warehouseId) return;

    this._emit('connecting');
    const url = `${WS_BASE_URL}/ws/telemetry/${this.warehouseId}`;

    try {
      this.ws = new WebSocket(url);
    } catch {
      this._emit('error');
      this._scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this._emit('connected');
      this._startPing();
    };

    this.ws.onmessage = (event) => {
      try {
        const msg: WsMessage = JSON.parse(event.data as string);
        if (msg.type === 'KEEPALIVE' || msg.type === 'PONG') return;
        this.messageHandlers.forEach((h) => h(msg));
      } catch {
        // Ignore malformed messages
      }
    };

    this.ws.onerror = () => {
      this._emit('error');
    };

    this.ws.onclose = () => {
      this._clearTimers();
      this._emit('disconnected');
      if (!this.intentionalClose) {
        this._scheduleReconnect();
      }
    };
  }

  private _scheduleReconnect(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;
    this.reconnectAttempts++;
    const delay = RECONNECT_DELAY_MS * this.reconnectAttempts;
    this.reconnectTimer = setTimeout(() => this._open(), delay);
  }

  private _startPing(): void {
    this._clearTimers();
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'PING' }));
      }
    }, 25_000);
  }

  private _clearTimers(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.pingInterval) clearInterval(this.pingInterval);
  }

  private _emit(status: Parameters<StatusHandler>[0]): void {
    this.statusHandlers.forEach((h) => h(status));
  }
}

export const wsService = new WarehouseWebSocketService();
