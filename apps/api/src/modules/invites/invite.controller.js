import { inviteService } from './invite.service.js';
import { validateInvitesList } from '../availability/availability.schema.js';
import { validateUuid } from '../../utils/validation.js';
import { catchAsync } from '../../errors/catchAsync.js';

export const getInvites = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = validateInvitesList(req.query);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const invites = await inviteService.list(req.sessionUser.id, data.box);

  res.status(200).json({ status: 'success', invites });
});

export const acceptInvite = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = validateUuid(req.params.id, 'Invitación');
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const result = await inviteService.accept(req.sessionUser.id, data);

  res.status(200).json({
    status: 'success',
    connection: {
      id: result.connection.id,
      source: result.connection.source,
      createdAt: result.connection.createdAt,
    },
    contact: result.contact,
  });
});

export const declineInvite = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = validateUuid(req.params.id, 'Invitación');
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  await inviteService.decline(req.sessionUser.id, data);
  res.status(200).json({ status: 'success', message: 'Invitación rechazada.' });
});

export const cancelInvite = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = validateUuid(req.params.id, 'Invitación');
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  await inviteService.cancel(req.sessionUser.id, data);
  res.status(200).json({ status: 'success', message: 'Invitación cancelada.' });
});
