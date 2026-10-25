import { blockService } from './block.service.js';
import { validateBlockUser, validateUuidParam } from './block.schema.js';
import { catchAsync } from '../../errors/catchAsync.js';

export const createBlock = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = validateBlockUser(req.body);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const block = await blockService.block(req.sessionUser.id, data.userId);

  res.status(201).json({
    status: 'success',
    block: {
      id: block.id,
      blockedId: block.blockedId,
      createdAt: block.createdAt,
    },
  });
});

export const removeBlock = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = validateUuidParam(req.params.userId, 'Usuario');
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  await blockService.unblock(req.sessionUser.id, data);

  res.status(200).json({ status: 'success', message: 'Usuario desbloqueado.' });
});

export const listBlocks = catchAsync(async (req, res) => {
  const blocks = await blockService.list(req.sessionUser.id);

  res.status(200).json({ status: 'success', blocks });
});
