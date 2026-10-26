export const SSE_MAX_PER_USER = 5;
export const SSE_MAX_GLOBAL = 1000;
export const SSE_HEARTBEAT_MS = 25 * 1000;

class EventBus {
  constructor() {
    this.connections = new Map();
    this.total = 0;
    this.heartbeatTimer = null;
  }

  add(userId, response) {
    if (this.total >= SSE_MAX_GLOBAL) {
      return { ok: false, reason: 'global' };
    }

    const userConnections = this.connections.get(userId) || new Set();

    if (userConnections.size >= SSE_MAX_PER_USER) {
      return { ok: false, reason: 'user' };
    }

    userConnections.add(response);
    this.connections.set(userId, userConnections);
    this.total += 1;

    return { ok: true, count: userConnections.size };
  }

  remove(userId, response) {
    const userConnections = this.connections.get(userId);
    if (!userConnections) return;

    if (userConnections.delete(response)) {
      this.total -= 1;
    }

    if (!userConnections.size) {
      this.connections.delete(userId);
    }
  }

  emitToUser(userId, type, data) {
    const userConnections = this.connections.get(userId);
    if (!userConnections?.size) return 0;

    const payload = `event: ${type}\ndata: ${JSON.stringify({ type, data })}\n\n`;
    let delivered = 0;

    for (const response of [...userConnections]) {
      if (response.writableEnded || response.destroyed) {
        this.remove(userId, response);
        continue;
      }

      try {
        response.write(payload);
        delivered += 1;
      } catch (_error) {
        this.remove(userId, response);
      }
    }

    return delivered;
  }

  startHeartbeat() {
    if (this.heartbeatTimer) return;

    this.heartbeatTimer = setInterval(() => {
      for (const userConnections of this.connections.values()) {
        for (const response of [...userConnections]) {
          if (response.writableEnded || response.destroyed) continue;

          try {
            response.write(': ping\n\n');
          } catch (error) {
            void error;
          }
        }
      }
    }, SSE_HEARTBEAT_MS);

    this.heartbeatTimer.unref();
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  closeAll() {
    for (const userConnections of this.connections.values()) {
      for (const response of userConnections) {
        try {
          response.end();
        } catch (error) {
          void error;
        }
      }
    }

    this.connections.clear();
    this.total = 0;
    this.stopHeartbeat();
  }

  stats() {
    return {
      users: this.connections.size,
      connections: this.total,
    };
  }

  reset() {
    this.closeAll();
  }
}

export const eventBus = new EventBus();
