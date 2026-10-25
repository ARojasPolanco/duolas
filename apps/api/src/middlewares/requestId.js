import { randomUUID } from 'node:crypto';

export const requestId = (req, res, next) => {
  const incoming = req.get('x-request-id');
  const id = incoming ? String(incoming).slice(0, 100) : randomUUID();
  req.id = id;
  res.setHeader('X-Request-Id', id);
  next();
};
