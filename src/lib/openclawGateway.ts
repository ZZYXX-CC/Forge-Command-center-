/**
 * OpenClaw Gateway — Browser WebSocket Client
 *
 * Connects to the OpenClaw Gateway (ws://localhost:18789) using the
 * gateway protocol v3. Handles challenge-response auth, message routing
 * to individual agents or broadcast, and automatic reconnection.
 *
 * Used by NeuralCommandMap chat view to replace mock responses.
 */

const PROTOCOL_VERSION = 3;
const DEFAULT_CLIENT_ID = 'forge-dashboard';
const DEFAULT_CLIENT_MODE = 'frontend';
const DEFAULT_CLIENT_VERSION = 'forge-1.4';
const DEFAULT_ROLE = 'operator';
const DEFAULT_SCOPES = ['operator.admin'];

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;
const PING_INTERVAL_MS = 30000;

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

interface GatewayRequestFrame {
  type: 'req';
  id: string;
  method: string;
  params?: unknown;
}

interface GatewayResponseFrame {
  type: 'res';
  id: string;
  ok: boolean;
  payload?: Record<string, unknown>;
  error?: { code?: string; message?: string };
}

interface GatewayEventFrame {
  type: 'event';
  event: string;
  payload?: Record<string, unknown>;
  seq?: number;
}

type GatewayFrame = GatewayResponseFrame | GatewayEventFrame;

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout> | null;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  time: string;
  isAgent: boolean;
  channel: string;
}

export interface GatewayConfig {
  url: string;
  token?: string;
  onMessage?: (msg: ChatMessage) => void;
  onStateChange?: (state: ConnectionState) => void;
  onError?: (error: string) => void;
  onAgentTyping?: (channel: string, isTyping: boolean) => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isResponseFrame(data: unknown): data is GatewayResponseFrame {
  const d = data as Record<string, unknown>;
  return d?.type === 'res' && typeof d.id === 'string' && typeof d.ok === 'boolean';
}

function isEventFrame(data: unknown): data is GatewayEventFrame {
  const d = data as Record<string, unknown>;
  return d?.type === 'event' && typeof d.event === 'string';
}

export class OpenClawGatewayClient {
  private ws: WebSocket | null = null;
  private pending = new Map<string, PendingRequest>();
  private state: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private challengeResolve: ((nonce: string) => void) | null = null;
  private challengeReject: ((err: Error) => void) | null = null;
  private trackedRunIds = new Set<string>();
  private disposed = false;

  constructor(private readonly config: GatewayConfig) {}

  get connectionState(): ConnectionState {
    return this.state;
  }

  async connect(): Promise<void> {
    if (this.disposed) return;
    if (this.state === 'connected' || this.state === 'connecting') return;

    this.setState(this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting');

    try {
      await this.openSocket();
      const nonce = await this.waitForChallenge(10000);
      await this.sendConnect(nonce);
      this.setState('connected');
      this.reconnectAttempts = 0;
      this.startPing();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.config.onError?.(`Connection failed: ${message}`);
      this.scheduleReconnect();
    }
  }

  async sendChat(channel: string, text: string): Promise<void> {
    if (this.state !== 'connected') {
      throw new Error('Gateway not connected');
    }

    const sessionKey = channel === 'network'
      ? 'forge:broadcast'
      : `forge:agent:${channel}`;

    const params: Record<string, unknown> = {
      message: text,
      sessionKey,
      idempotencyKey: generateId(),
      timeout: 120000,
      paperclip: {
        source: 'forge-dashboard',
        channel,
        timestamp: new Date().toISOString(),
      },
    };

    if (channel !== 'network') {
      params.agentId = channel;
    }

    try {
      this.config.onAgentTyping?.(channel, true);

      const result = await this.request<Record<string, unknown>>('agent', params, 120000);

      const runId = typeof result?.runId === 'string' ? result.runId : null;
      if (runId) this.trackedRunIds.add(runId);

      const status = typeof result?.status === 'string' ? result.status.toLowerCase() : '';
      if (status !== 'ok' && status !== 'accepted') {
        if (result?.runId) {
          await this.request('agent.wait', {
            runId: result.runId,
            timeoutMs: 120000,
          }, 130000);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.config.onError?.(`Send failed: ${message}`);
    } finally {
      this.config.onAgentTyping?.(channel, false);
    }
  }

  disconnect(): void {
    this.disposed = true;
    this.cleanup();
    this.setState('disconnected');
  }

  private setState(state: ConnectionState): void {
    this.state = state;
    this.config.onStateChange?.(state);
  }

  private openSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(this.config.url);
      this.ws = ws;

      const cleanup = () => {
        ws.removeEventListener('open', onOpen);
        ws.removeEventListener('error', onError);
        ws.removeEventListener('close', onClose);
      };

      const onOpen = () => {
        cleanup();
        ws.addEventListener('message', (e) => this.handleMessage(e.data));
        ws.addEventListener('close', (e) => this.handleClose(e.code, e.reason));
        ws.addEventListener('error', () => this.handleError());
        resolve();
      };

      const onError = () => {
        cleanup();
        reject(new Error('WebSocket connection error'));
      };

      const onClose = (e: CloseEvent) => {
        cleanup();
        reject(new Error(`WebSocket closed: ${e.code} ${e.reason}`));
      };

      ws.addEventListener('open', onOpen);
      ws.addEventListener('error', onError);
      ws.addEventListener('close', onClose);
    });
  }

  private waitForChallenge(timeoutMs: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      this.challengeResolve = resolve;
      this.challengeReject = reject;

      setTimeout(() => {
        if (this.challengeReject) {
          this.challengeReject(new Error('Challenge timeout'));
          this.challengeResolve = null;
          this.challengeReject = null;
        }
      }, timeoutMs);
    });
  }

  private async sendConnect(nonce: string): Promise<void> {
    const params: Record<string, unknown> = {
      minProtocol: PROTOCOL_VERSION,
      maxProtocol: PROTOCOL_VERSION,
      client: {
        id: DEFAULT_CLIENT_ID,
        version: DEFAULT_CLIENT_VERSION,
        platform: 'browser',
        mode: DEFAULT_CLIENT_MODE,
      },
      role: DEFAULT_ROLE,
      scopes: DEFAULT_SCOPES,
    };

    if (this.config.token) {
      params.auth = { token: this.config.token };
    }

    await this.request('connect', params, 10000);
  }

  private request<T>(method: string, params: unknown, timeoutMs: number): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not open'));
        return;
      }

      const id = generateId();
      const frame: GatewayRequestFrame = { type: 'req', id, method, params };

      const timer = timeoutMs > 0
        ? setTimeout(() => {
            this.pending.delete(id);
            reject(new Error(`Request timeout: ${method}`));
          }, timeoutMs)
        : null;

      this.pending.set(id, {
        resolve: (value) => resolve(value as T),
        reject,
        timer,
      });

      this.ws.send(JSON.stringify(frame));
    });
  }

  private handleMessage(raw: unknown): void {
    const data = typeof raw === 'string' ? raw : String(raw);
    let parsed: unknown;
    try {
      parsed = JSON.parse(data);
    } catch {
      return;
    }

    if (isEventFrame(parsed)) {
      this.handleEvent(parsed);
      return;
    }

    if (isResponseFrame(parsed)) {
      this.handleResponse(parsed);
    }
  }

  private handleEvent(frame: GatewayEventFrame): void {
    if (frame.event === 'connect.challenge') {
      const nonce = (frame.payload as Record<string, unknown>)?.nonce;
      if (typeof nonce === 'string' && this.challengeResolve) {
        this.challengeResolve(nonce);
        this.challengeResolve = null;
        this.challengeReject = null;
      }
      return;
    }

    if (frame.event === 'agent') {
      const payload = frame.payload ?? {};
      const runId = typeof payload.runId === 'string' ? payload.runId : null;
      if (!runId || !this.trackedRunIds.has(runId)) return;

      const eventData = payload.data as Record<string, unknown> | undefined;
      const stream = typeof payload.stream === 'string' ? payload.stream : '';

      if (stream === 'assistant') {
        const delta = typeof eventData?.delta === 'string' ? eventData.delta : '';
        const text = typeof eventData?.text === 'string' ? eventData.text : '';
        const content = delta || text;

        if (content) {
          const channel = typeof payload.channel === 'string' ? payload.channel : 'network';
          const sender = typeof payload.agentName === 'string'
            ? payload.agentName
            : typeof payload.agentId === 'string'
              ? payload.agentId.toUpperCase()
              : 'SYSTEM';

          this.config.onMessage?.({
            id: generateId(),
            sender,
            text: content,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isAgent: true,
            channel,
          });
        }
      }
    }
  }

  private handleResponse(frame: GatewayResponseFrame): void {
    const pending = this.pending.get(frame.id);
    if (!pending) return;

    if (pending.timer) clearTimeout(pending.timer);
    this.pending.delete(frame.id);

    if (frame.ok) {
      pending.resolve(frame.payload ?? null);
    } else {
      const message = frame.error?.message ?? frame.error?.code ?? 'Gateway request failed';
      pending.reject(new Error(message));
    }
  }

  private handleClose(code: number, reason: string): void {
    this.failPending(new Error(`Gateway closed: ${code} ${reason}`));
    if (!this.disposed && this.state === 'connected') {
      this.config.onError?.(`Connection lost (${code}). Reconnecting...`);
      this.scheduleReconnect();
    }
  }

  private handleError(): void {
    if (!this.disposed) {
      this.config.onError?.('WebSocket error');
    }
  }

  private failPending(err: Error): void {
    for (const [, p] of this.pending) {
      if (p.timer) clearTimeout(p.timer);
      p.reject(err);
    }
    this.pending.clear();
  }

  private scheduleReconnect(): void {
    if (this.disposed) return;

    this.cleanup();
    this.setState('reconnecting');

    const delay = Math.min(
      RECONNECT_BASE_MS * Math.pow(2, this.reconnectAttempts),
      RECONNECT_MAX_MS,
    );
    this.reconnectAttempts++;

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect();
    }, delay);
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.request('ping', {}, 5000).catch(() => {});
      }
    }, PING_INTERVAL_MS);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private cleanup(): void {
    this.stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.failPending(new Error('Client cleanup'));
    if (this.ws) {
      try { this.ws.close(1000, 'cleanup'); } catch { /* ignore */ }
      this.ws = null;
    }
    this.challengeResolve = null;
    this.challengeReject = null;
  }
}

export function createGatewayClient(config: GatewayConfig): OpenClawGatewayClient {
  return new OpenClawGatewayClient(config);
}

export function getGatewayUrl(): string {
  return import.meta.env.VITE_OPENCLAW_GATEWAY_URL || 'ws://localhost:18789';
}

export function getGatewayToken(): string | undefined {
  return import.meta.env.VITE_OPENCLAW_GATEWAY_TOKEN || undefined;
}
