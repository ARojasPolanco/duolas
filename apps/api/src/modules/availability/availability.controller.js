import { availabilityService } from './availability.service.js';
import {
  validateAvailabilityList,
  validateCreateAvailability,
  validateInvite,
} from './availability.schema.js';
import { validateUuid } from '../../utils/validation.js';
import { catchAsync } from '../../errors/catchAsync.js';

const toSessionView = (session) => ({
  id: session.id,
  roles: session.roles,
  queue: session.queue,
  note: session.note,
  status: session.status,
  startedAt: session.startedAt,
  expiresAt: session.expiresAt,
  endedAt: session.endedAt,
  closedReason: session.closedReason,
});

export const createAvailability = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = validateCreateAvailability(req.body);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const session = await availabilityService.create(req.sessionUser.id, data);

  res.status(201).json({ status: 'success', session: toSessionView(session) });
});

export const closeAvailability = catchAsync(async (req, res) => {
  await availabilityService.close(req.sessionUser.id);
  res.status(200).json({ status: 'success', message: 'Disponibilidad cerrada.' });
});

export const getMyAvailability = catchAsync(async (req, res) => {
  const session = await availabilityService.getMine(req.sessionUser.id);

  res.status(200).json({
    status: 'success',
    session: session ? toSessionView(session) : null,
  });
});

export const listAvailability = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = validateAvailabilityList(req.query);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const players = await availabilityService.list(req.sessionUser.id, data);

  res.status(200).json({
    status: 'success',
    players,
    total: players.length,
  });
});

export const invitePlayer = catchAsync(async (req, res) => {
  const {
    hasError: idError,
    errorMessages: idErrors,
    data: id,
  } = validateUuid(req.params.id, 'Disponibilidad');
  if (idError) {
    return res.status(422).json({ status: 'fail', message: idErrors.join(', ') });
  }

  const { hasError, errorMessages, data } = validateInvite(req.body);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const { invite } = await availabilityService.invite(req.sessionUser.id, id, data);

  res.status(201).json({
    status: 'success',
    invite: {
      id: invite.id,
      role: invite.role,
      message: invite.message,
      status: invite.status,
      expiresAt: invite.expiresAt,
      createdAt: invite.createdAt,
    },
  });
});
