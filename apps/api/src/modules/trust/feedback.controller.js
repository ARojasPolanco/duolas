import { feedbackService } from './feedback.service.js';
import { validateFeedback } from './feedback.schema.js';
import { toFeedbackView } from './feedback.utils.js';
import { validateUuid } from '../../utils/validation.js';
import { catchAsync } from '../../errors/catchAsync.js';

export const createFeedback = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = validateFeedback(req.body);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const result = await feedbackService.submit(req.sessionUser.id, data);

  res.status(201).json({
    status: 'success',
    feedback: toFeedbackView(result.feedback),
    revealed: result.revealed,
  });
});

export const getPendingFeedback = catchAsync(async (req, res) => {
  const pending = await feedbackService.getPending(req.sessionUser.id);

  res.status(200).json({ status: 'success', pending });
});

export const getConnectionFeedback = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = validateUuid(req.params.connectionId, 'Conexión');
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const detail = await feedbackService.getDetail(req.sessionUser.id, data);

  res.status(200).json({
    status: 'success',
    ...detail,
  });
});
