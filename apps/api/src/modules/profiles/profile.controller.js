import { profileService } from './profile.service.js';
import { validateUpdateProfile } from './profile.schema.js';
import { catchAsync } from '../../errors/catchAsync.js';
import { AppError } from '../../errors/appError.js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const getMyProfile = catchAsync(async (req, res) => {
  const data = await profileService.getMe(req.sessionUser);

  res.status(200).json({
    status: 'success',
    profile: data.profile,
    completeness: data.completeness,
  });
});

export const updateMyProfile = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = validateUpdateProfile(req.body);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  await profileService.upsert(req.sessionUser.id, data);
  const result = await profileService.getMe(req.sessionUser);

  res.status(200).json({
    status: 'success',
    profile: result.profile,
    completeness: result.completeness,
  });
});

export const getPublicProfile = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!UUID_REGEX.test(id)) {
    return next(new AppError('No encontramos ese perfil.', 400));
  }

  const profile = await profileService.getPublicById(id);
  if (!profile) {
    return next(new AppError('No encontramos ese perfil.', 404));
  }

  res.status(200).json({
    status: 'success',
    profile,
  });
});
