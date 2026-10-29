import { catchAsync } from '../../errors/catchAsync.js';
import { validateUuidParam } from '../matching/matching.schema.js';
import { usernameChangeService } from './usernameChange.service.js';
import {
  validateApproveUsername,
  validateCreateUsernameRequest,
  validateRejectUsername,
  validateSuggestUsername,
} from './usernameChange.schema.js';

export const getMyUsernameChange = catchAsync(async (req, res) => {
  const request = await usernameChangeService.getMine(req.sessionUser.id);

  res.status(200).json({
    status: 'success',
    request,
    currentUsername: req.sessionUser.username,
  });
});

export const suggestUsername = catchAsync(async (req, res) => {
  const {
    hasError: idError,
    errorMessages: idErrors,
    data: requestId,
  } = validateUuidParam(req.params.id, 'Solicitud');
  if (idError) {
    return res.status(422).json({ status: 'fail', message: idErrors.join(', ') });
  }

  const { hasError, errorMessages, data } = validateSuggestUsername(req.body);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const request = await usernameChangeService.suggest(req.sessionUser.id, requestId, data.username);

  res.status(200).json({ status: 'success', request });
});

export const createUsernameRequest = catchAsync(async (req, res) => {
  const {
    hasError: idError,
    errorMessages: idErrors,
    data: userId,
  } = validateUuidParam(req.params.id, 'Usuario');
  if (idError) {
    return res.status(422).json({ status: 'fail', message: idErrors.join(', ') });
  }

  const { hasError, errorMessages, data } = validateCreateUsernameRequest(req.body);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const request = await usernameChangeService.createRequest(req.sessionUser.id, userId, data);

  res.status(201).json({ status: 'success', request });
});

export const approveUsernameRequest = catchAsync(async (req, res) => {
  const {
    hasError: idError,
    errorMessages: idErrors,
    data: requestId,
  } = validateUuidParam(req.params.id, 'Solicitud');
  if (idError) {
    return res.status(422).json({ status: 'fail', message: idErrors.join(', ') });
  }

  const { hasError, errorMessages, data } = validateApproveUsername(req.body);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const result = await usernameChangeService.approve(req.sessionUser.id, requestId, data);

  res.status(200).json({ status: 'success', ...result });
});

export const rejectUsernameRequest = catchAsync(async (req, res) => {
  const {
    hasError: idError,
    errorMessages: idErrors,
    data: requestId,
  } = validateUuidParam(req.params.id, 'Solicitud');
  if (idError) {
    return res.status(422).json({ status: 'fail', message: idErrors.join(', ') });
  }

  const { hasError, errorMessages, data } = validateRejectUsername(req.body);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const result = await usernameChangeService.reject(req.sessionUser.id, requestId, data);

  res.status(200).json({ status: 'success', ...result });
});
