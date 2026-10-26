import { pushService } from './push.service.js';
import { validateSubscribe, validateUnsubscribe } from './push.schema.js';
import { catchAsync } from '../../errors/catchAsync.js';

export const getPublicKey = catchAsync(async (_req, res) => {
  const publicKey = pushService.getPublicKey();

  res.status(200).json({
    status: 'success',
    publicKey,
    enabled: Boolean(publicKey),
  });
});

export const subscribe = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = validateSubscribe(req.body);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const subscription = await pushService.subscribe(req.sessionUser.id, data);

  res.status(201).json({
    status: 'success',
    subscription: {
      id: subscription.id,
      endpoint: subscription.endpoint,
      isActive: subscription.isActive,
    },
  });
});

export const unsubscribe = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = validateUnsubscribe(req.body);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  await pushService.unsubscribe(req.sessionUser.id, data.endpoint);

  res.status(200).json({ status: 'success', message: 'Push desactivado.' });
});
