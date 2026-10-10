/**
 * Spine client — framework-free.
 *
 * The five surfaces are also deployed as static sites, so this client MUST
 * degrade cleanly: when the spine is absent it reports `local` and the surface
 * falls back to its bundled sample data. Shared mode is a capability, not a
 * requirement.
 */

export type SpineMode = 'probing' | 'shared' | 'local';

export interface SpineSnapshot {
  units: any[];
  requests: any[];
  issues: any[];
  staff: any[];
  blocks: any[];
  donors: any[];
  rev: number;
}

export interface SpineEventMessage {
  id: string;
  type: string;
  din?: string;
  at: string;
  source?: string;
  summary?: string;
}

export interface SpineHealth {
  ok: boolean;
  rev: number;
  counts: Record<string, number>;
  at: string;
}

const DEFAULT_TIMEOUT_MS = 4000;

export class SpineClient {
  readonly baseUrl: string;
  private controller: AbortController | null = null;

  constructor(baseUrl?: string) {
    const configured =
      baseUrl ??
      (typeof import.meta !== 'undefined' ? (import.meta as any).env?.VITE_SPINE_URL : undefined) ??
      '';
    this.baseUrl = String(configured).replace(/\/$/, '');
  }

  private url(path: string): string {
    return `${this.baseUrl}/api/spine${path}`;
  }

  private async request<T>(path: string, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(this.url(path), {
        ...init,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-spine-client': this.clientName(),
          ...(init.headers || {})
        }
      });
      const text = await res.text();
      const body = text ? JSON.parse(text) : {};
      if (!res.ok) {
        const err: any = new Error(body?.error || `Spine responded ${res.status}`);
        err.status = res.status;
        err.body = body;
        throw err;
      }
      return body as T;
    } finally {
      clearTimeout(timer);
    }
  }

  private clientName(): string {
    try {
      return (window as any).__spineClientName || (typeof document !== 'undefined' ? document.title : 'surface').slice(0, 40);
    } catch {
      return 'surface';
    }
  }

  /** Probe the service. Returns null when it is not reachable. */
  async health(): Promise<SpineHealth | null> {
    try {
      return await this.request<SpineHealth>('/health', { method: 'GET' }, 2500);
    } catch {
      return null;
    }
  }

  async snapshot(): Promise<SpineSnapshot> {
    return this.request<SpineSnapshot>('/snapshot', { method: 'GET' });
  }

  async patchUnit(din: string, patch: Record<string, unknown>, expectedRev?: number) {
    return this.request<{ unit: any }>(`/units/${encodeURIComponent(din)}`, {
      method: 'PATCH',
      body: JSON.stringify({ ...patch, expectedRev })
    });
  }

  async recordTelemetry(din: string, temperatureCelsius: number, locationName?: string) {
    return this.request<{ unit: any; breachDetected: boolean }>(`/units/${encodeURIComponent(din)}/telemetry`, {
      method: 'POST',
      body: JSON.stringify({ temperatureCelsius, locationName })
    });
  }

  async appendEvent(din: string, eventType: string, actor: Record<string, unknown>, payload: Record<string, unknown>) {
    return this.request<{ block: any }>(`/units/${encodeURIComponent(din)}/events`, {
      method: 'POST',
      body: JSON.stringify({ eventType, actor, payload })
    });
  }

  async createRequest(payload: Record<string, unknown>) {
    return this.request<{ request: any }>('/requests', { method: 'POST', body: JSON.stringify(payload) });
  }

  async createIssue(payload: Record<string, unknown>) {
    return this.request<{ issue: any }>('/issues', { method: 'POST', body: JSON.stringify(payload) });
  }

  async updateRequest(id: string, patch: Record<string, unknown>) {
    return this.request<{ request: any }>(`/requests/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    });
  }

  async updateIssue(id: string, patch: Record<string, unknown>) {
    return this.request<{ issue: any }>(`/issues/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    });
  }

  async addStaff(payload: Record<string, unknown>) {
    return this.request<{ staff: any }>('/staff', { method: 'POST', body: JSON.stringify(payload) });
  }

  async updateStaff(id: string, patch: Record<string, unknown>) {
    return this.request<{ staff: any }>(`/staff/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    });
  }

  async login(email: string) {
    return this.request<{ staff: any }>('/auth/login', { method: 'POST', body: JSON.stringify({ email }) });
  }

  async chain() {
    return this.request<{ blocks: any[]; verdict: any }>('/chain', { method: 'GET' });
  }

  /**
   * Subscribe to live changes. Uses SSE where available and falls back to
   * polling, so a surface still updates on a proxy that blocks event streams.
   * Returns an unsubscribe function.
   */
  subscribe(onEvent: (e: SpineEventMessage) => void, onSnapshot: (s: SpineSnapshot) => void): () => void {
    this.controller?.abort();
    this.controller = new AbortController();
    const signal = this.controller.signal;

    let closed = false;
    let pollTimer: any = null;

    const startPolling = () => {
      if (closed || pollTimer) return;
      let lastRev = -1;
      pollTimer = setInterval(async () => {
        if (closed) return;
        try {
          const snap = await this.snapshot();
          if (snap.rev !== lastRev) {
            lastRev = snap.rev;
            onSnapshot(snap);
          }
        } catch {
          /* keep polling; a transient failure is not fatal */
        }
      }, 3000);
    };

    const connect = () => {
      if (closed) return;
      if (typeof EventSource === 'undefined') {
        startPolling();
        return;
      }
      try {
        const es = new EventSource(`${this.baseUrl}/api/spine/events`);
        (es as any).__signal = signal;
        es.onmessage = ev => {
          if (closed) return;
          try {
            onEvent(JSON.parse(ev.data));
          } catch {
            /* ignore a malformed frame */
          }
        };
        es.addEventListener('unit.updated', ev => {
          if (closed) return;
          try {
            onEvent(JSON.parse((ev as MessageEvent).data));
          } catch {
            /* ignore */
          }
        });
        es.onerror = () => {
          es.close();
          if (closed) return;
          startPolling();
        };
        this.controller?.signal.addEventListener('abort', () => es.close(), { once: true });
      } catch {
        startPolling();
      }
    };

    connect();

    return () => {
      closed = true;
      if (pollTimer) clearInterval(pollTimer);
      this.controller?.abort();
      this.controller = null;
    };
  }
}

export const createSpineClient = (baseUrl?: string) => new SpineClient(baseUrl);
