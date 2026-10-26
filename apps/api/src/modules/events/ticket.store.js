import crypto from 'node:crypto';

export const SSE_TICKET_TTL_MS = 60 * 1000;

class TicketStore {
  constructor() {
    this.tickets = new Map();
  }

  issue(userId) {
    const ticket = crypto.randomBytes(32).toString('hex');
    this.tickets.set(ticket, {
      userId,
      expiresAt: Date.now() + SSE_TICKET_TTL_MS,
    });
    return ticket;
  }

  consume(ticket) {
    const entry = this.tickets.get(ticket);
    if (!entry) return null;

    this.tickets.delete(ticket);

    if (entry.expiresAt <= Date.now()) return null;

    return entry;
  }

  cleanup(now = Date.now()) {
    let removed = 0;

    for (const [ticket, entry] of this.tickets) {
      if (entry.expiresAt <= now) {
        this.tickets.delete(ticket);
        removed += 1;
      }
    }

    return removed;
  }

  size() {
    return this.tickets.size;
  }

  reset() {
    this.tickets.clear();
  }
}

export const ticketStore = new TicketStore();
