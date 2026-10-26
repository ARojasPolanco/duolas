import { duoPostService } from './duoPost.service.js';
import { validateApplication, validateCreatePost, validatePostsQuery } from './duoPost.schema.js';
import { validateUuid } from '../../utils/validation.js';
import { catchAsync } from '../../errors/catchAsync.js';

const toApplicationView = (application) => ({
  id: application.id,
  message: application.message,
  status: application.status,
  createdAt: application.createdAt,
});

export const createPost = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = validateCreatePost(req.body);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const created = await duoPostService.create(req.sessionUser.id, data);
  const post = await duoPostService.getDetail(req.sessionUser.id, created.id);

  res.status(201).json({ status: 'success', post });
});

export const getPosts = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = validatePostsQuery(req.query);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const posts = await duoPostService.list(req.sessionUser.id, data);

  res.status(200).json({ status: 'success', posts, total: posts.length });
});

export const getMyPosts = catchAsync(async (req, res) => {
  const posts = await duoPostService.getMine(req.sessionUser.id);

  res.status(200).json({ status: 'success', posts });
});

export const getPost = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = validateUuid(req.params.id, 'Publicación');
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const post = await duoPostService.getDetail(req.sessionUser.id, data);

  res.status(200).json({ status: 'success', post });
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

  const { hasError, errorMessages, data } = validateApplication(req.body);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const application = await duoPostService.apply(req.sessionUser.id, postId, data);

  res.status(201).json({
    status: 'success',
    application: toApplicationView(application),
  });
});

export const getApplications = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = validateUuid(req.params.id, 'Publicación');
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const applications = await duoPostService.getApplications(req.sessionUser.id, data);

  res.status(200).json({ status: 'success', applications });
});

export const acceptApplication = catchAsync(async (req, res) => {
  const {
    hasError: postError,
    errorMessages: postErrors,
    data: postId,
  } = validateUuid(req.params.id, 'Publicación');
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

  const result = await duoPostService.acceptApplication(req.sessionUser.id, postId, applicationId);

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

export const rejectApplication = catchAsync(async (req, res) => {
  const {
    hasError: postError,
    errorMessages: postErrors,
    data: postId,
  } = validateUuid(req.params.id, 'Publicación');
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

  await duoPostService.rejectApplication(req.sessionUser.id, postId, applicationId);

  res.status(200).json({ status: 'success', message: 'Postulación rechazada.' });
});

export const withdrawApplication = catchAsync(async (req, res) => {
  const {
    hasError: postError,
    errorMessages: postErrors,
    data: postId,
  } = validateUuid(req.params.id, 'Publicación');
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

  await duoPostService.withdrawApplication(req.sessionUser.id, postId, applicationId);

  res.status(200).json({ status: 'success', message: 'Postulación retirada.' });
});

export const cancelPost = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = validateUuid(req.params.id, 'Publicación');
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  await duoPostService.cancel(req.sessionUser.id, data);

  res.status(200).json({ status: 'success', message: 'Publicación cancelada.' });
});
