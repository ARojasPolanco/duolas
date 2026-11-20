import { clashService } from './clash.service.js';
import {
  validateClashApplication,
  validateClashPostsQuery,
  validateCreateClashPost,
} from './clash.schema.js';
import { validateUuid } from '../../utils/validation.js';
import { catchAsync } from '../../errors/catchAsync.js';

const uuidParam = (value, label) => validateUuid(value, label);

export const createPost = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = validateCreateClashPost(req.body);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const created = await clashService.create(req.sessionUser.id, data);
  const post = await clashService.getDetail(req.sessionUser.id, created.id);
  res.status(201).json({ status: 'success', post });
});

export const getPosts = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = validateClashPostsQuery(req.query);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const posts = await clashService.list(req.sessionUser.id, data);
  res.status(200).json({ status: 'success', posts, total: posts.length });
});

export const getMine = catchAsync(async (req, res) => {
  const posts = await clashService.getMine(req.sessionUser.id);
  res.status(200).json({ status: 'success', posts });
});

export const getMyApplications = catchAsync(async (req, res) => {
  const applications = await clashService.getMyApplications(req.sessionUser.id);
  res.status(200).json({ status: 'success', applications });
});

export const getPost = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = uuidParam(req.params.id, 'Equipo Clash');
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const post = await clashService.getDetail(req.sessionUser.id, data);
  res.status(200).json({ status: 'success', post });
});

export const applyToPost = catchAsync(async (req, res) => {
  const {
    hasError: idError,
    errorMessages: idErrors,
    data: postId,
  } = uuidParam(req.params.id, 'Equipo Clash');
  if (idError) {
    return res.status(422).json({ status: 'fail', message: idErrors.join(', ') });
  }

  const { hasError, errorMessages, data } = validateClashApplication(req.body);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const application = await clashService.apply(req.sessionUser.id, postId, data);
  res.status(201).json({ status: 'success', application });
});

export const getApplications = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = uuidParam(req.params.id, 'Equipo Clash');
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const applications = await clashService.getApplications(req.sessionUser.id, data);
  res.status(200).json({ status: 'success', applications });
});

export const acceptApplication = catchAsync(async (req, res) => {
  const postResult = uuidParam(req.params.id, 'Equipo Clash');
  const appResult = uuidParam(req.params.applicationId, 'Postulación');
  if (postResult.hasError || appResult.hasError) {
    return res.status(422).json({
      status: 'fail',
      message: [...postResult.errorMessages, ...appResult.errorMessages].join(', '),
    });
  }

  const result = await clashService.acceptApplication(
    req.sessionUser.id,
    postResult.data,
    appResult.data
  );
  res.status(200).json({
    status: 'success',
    connection: result.connection,
    isFull: result.isFull,
  });
});

export const rejectApplication = catchAsync(async (req, res) => {
  const postResult = uuidParam(req.params.id, 'Equipo Clash');
  const appResult = uuidParam(req.params.applicationId, 'Postulación');
  if (postResult.hasError || appResult.hasError) {
    return res.status(422).json({
      status: 'fail',
      message: [...postResult.errorMessages, ...appResult.errorMessages].join(', '),
    });
  }

  await clashService.rejectApplication(req.sessionUser.id, postResult.data, appResult.data);
  res.status(200).json({ status: 'success', message: 'Postulación rechazada.' });
});

export const withdrawApplication = catchAsync(async (req, res) => {
  const postResult = uuidParam(req.params.id, 'Equipo Clash');
  const appResult = uuidParam(req.params.applicationId, 'Postulación');
  if (postResult.hasError || appResult.hasError) {
    return res.status(422).json({
      status: 'fail',
      message: [...postResult.errorMessages, ...appResult.errorMessages].join(', '),
    });
  }

  await clashService.withdrawApplication(req.sessionUser.id, postResult.data, appResult.data);
  res.status(200).json({ status: 'success', message: 'Postulación retirada.' });
});

export const cancelPost = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = uuidParam(req.params.id, 'Equipo Clash');
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  await clashService.cancel(req.sessionUser.id, data);
  res.status(200).json({ status: 'success', message: 'Equipo Clash cancelado.' });
});
