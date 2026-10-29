import { aramService } from './aram.service.js';
import {
  validateAramApplication,
  validateAramList,
  validateCreateAramPost,
} from './aram.schema.js';
import { validateUuid } from '../../utils/validation.js';
import { catchAsync } from '../../errors/catchAsync.js';

export const getPosts = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = validateAramList(req.query);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const posts = await aramService.list(req.sessionUser.id, data);

  res.status(200).json({ status: 'success', posts });
});

export const createPost = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = validateCreateAramPost(req.body);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const post = await aramService.create(req.sessionUser.id, data);

  res.status(201).json({ status: 'success', post });
});

export const getMine = catchAsync(async (req, res) => {
  const result = await aramService.getMine(req.sessionUser.id);

  res.status(200).json({ status: 'success', ...result });
});

export const applyToPost = catchAsync(async (req, res) => {
  const {
    hasError: idError,
    errorMessages: idErrors,
    data: postId,
  } = validateUuid(req.params.id, 'Publicación');
  if (idError) {
    return res.status(422).json({ status: 'fail', message: idErrors.join(', ') });
  }

  const { hasError, errorMessages, data } = validateAramApplication(req.body || {});
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const application = await aramService.apply(req.sessionUser.id, postId, data.message);

  res.status(201).json({ status: 'success', application });
});

export const acceptApplication = catchAsync(async (req, res) => {
  const {
    hasError: postError,
    errorMessages: postErrors,
    data: postId,
  } = validateUuid(req.params.postId, 'Publicación');
  if (postError) {
    return res.status(422).json({ status: 'fail', message: postErrors.join(', ') });
  }

  const {
    hasError: appError,
    errorMessages: appErrors,
    data: applicationId,
  } = validateUuid(req.params.applicationId, 'Postulación');
  if (appError) {
    return res.status(422).json({ status: 'fail', message: appErrors.join(', ') });
  }

  const result = await aramService.accept(req.sessionUser.id, postId, applicationId);

  res.status(200).json({ status: 'success', ...result });
});

export const rejectApplication = catchAsync(async (req, res) => {
  const {
    hasError: postError,
    errorMessages: postErrors,
    data: postId,
  } = validateUuid(req.params.postId, 'Publicación');
  if (postError) {
    return res.status(422).json({ status: 'fail', message: postErrors.join(', ') });
  }

  const {
    hasError: appError,
    errorMessages: appErrors,
    data: applicationId,
  } = validateUuid(req.params.applicationId, 'Postulación');
  if (appError) {
    return res.status(422).json({ status: 'fail', message: appErrors.join(', ') });
  }

  const application = await aramService.reject(req.sessionUser.id, postId, applicationId);

  res.status(200).json({ status: 'success', application });
});

export const withdrawApplication = catchAsync(async (req, res) => {
  const {
    hasError: postError,
    errorMessages: postErrors,
    data: postId,
  } = validateUuid(req.params.postId, 'Publicación');
  if (postError) {
    return res.status(422).json({ status: 'fail', message: postErrors.join(', ') });
  }

  const {
    hasError: appError,
    errorMessages: appErrors,
    data: applicationId,
  } = validateUuid(req.params.applicationId, 'Postulación');
  if (appError) {
    return res.status(422).json({ status: 'fail', message: appErrors.join(', ') });
  }

  const application = await aramService.withdraw(req.sessionUser.id, postId, applicationId);

  res.status(200).json({ status: 'success', application });
});

export const cancelPost = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data: postId } = validateUuid(req.params.id, 'Publicación');
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const post = await aramService.cancel(req.sessionUser.id, postId);

  res.status(200).json({ status: 'success', post });
});
