import { matchingService, toConnectionView, toLikeView } from './matching.service.js';
import { matchReminderService } from './matchReminder.service.js';
import { validateCandidatesQuery, validateLike, validateUuidParam } from './matching.schema.js';
import { catchAsync } from '../../errors/catchAsync.js';

export const getMatchReminder = catchAsync(async (req, res) => {
  const reminder = await matchReminderService.getReminderStatus(req.sessionUser.id);

  res.status(200).json({ status: 'success', reminder });
});

export const getCandidates = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = validateCandidatesQuery(req.query);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const result = await matchingService.getCandidates(req.sessionUser.id, data);

  res.status(200).json({
    status: 'success',
    candidates: result.candidates,
    total: result.total,
  });
});

export const likeUser = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = validateLike(req.body);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const result = await matchingService.like(req.sessionUser.id, data.targetUserId);
  const body = {
    status: 'success',
    matched: result.matched,
    like: result.like ? toLikeView(result.like) : null,
  };

  if (result.matched && result.connection) {
    body.connection = toConnectionView(result.connection, result.contact || {});
  }

  res.status(result.created ? 201 : 200).json(body);
});

export const unlikeUser = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = validateUuidParam(req.params.targetUserId, 'Usuario');
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  await matchingService.unlike(req.sessionUser.id, data);

  res.status(200).json({ status: 'success', message: 'Interés retirado.' });
});

export const getOutgoingLikes = catchAsync(async (req, res) => {
  const outgoing = await matchingService.getOutgoingLikes(req.sessionUser.id);

  res.status(200).json({ status: 'success', outgoing });
});

export const getMatches = catchAsync(async (req, res) => {
  const matches = await matchingService.getMatches(req.sessionUser.id);

  res.status(200).json({ status: 'success', matches });
});

export const getMatchDetail = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = validateUuidParam(req.params.id, 'Match');
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const match = await matchingService.getMatchDetail(req.sessionUser.id, data);

  res.status(200).json({ status: 'success', match });
});

export const archiveMatch = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = validateUuidParam(req.params.id, 'Match');
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  await matchingService.archiveMatch(req.sessionUser.id, data);

  res.status(200).json({ status: 'success', message: 'Match archivado.' });
});
