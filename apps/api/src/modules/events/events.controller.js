import { ticketStore } from './ticket.store.js';
import { SSE_MAX_GLOBAL, SSE_MAX_PER_USER, eventBus } from './event.bus.js';
import { catchAsync } from '../../errors/catchAsync.js';

export const issueTicket = catchAsync(async (req, res) => {
  const ticket = ticketStore.issue(req.sessionUser.id);

  res.status(200).json({
    status: 'success',
    ticket,
    expiresIn: 60,
  });
});

export const stream = (req, res) => {
  const ticket = typeof req.query.ticket === 'string' ? req.query.ticket : '';
  const entry = ticketStore.consume(ticket);

  if (!entry) {
    return res.status(401).json({
      status: 'fail',
      message: 'Ticket inválido o vencido.',
    });
  }

  const added = eventBus.add(entry.userId, res);

  if (!added.ok) {
    const message =
      added.reason === 'user'
        ? `Máximo ${SSE_MAX_PER_USER} conexiones por usuario.`
        : `Máximo ${SSE_MAX_GLOBAL} conexiones globales.`;

    return res.status(added.reason === 'user' ? 429 : 503).json({
      status: 'fail',
      message,
    });
  }

  res.status(200);
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  res.write('retry: 3000\n\n');
  res.write(': connected\n\n');

  if (res.socket) {
    res.socket.setNoDelay(true);
  }

  const cleanup = () => {
    eventBus.remove(entry.userId, res);
  };

  req.on('close', cleanup);
  res.on('close', cleanup);
};

export const getStreamStats = catchAsync(async (_req, res) => {
  res.status(200).json({
    status: 'success',
    ...eventBus.stats(),
    tickets: ticketStore.size(),
  });
});
