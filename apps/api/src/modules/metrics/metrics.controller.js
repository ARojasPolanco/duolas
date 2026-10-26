import { metricsService } from './metrics.service.js';
import { validateMetricsSummary } from './metrics.schema.js';
import { catchAsync } from '../../errors/catchAsync.js';
import { AppError } from '../../errors/appError.js';

const DEFAULT_RANGE_DAYS = 30;

export const getMetricsSummary = catchAsync(async (req, res, next) => {
  const { hasError, errorMessages, data } = validateMetricsSummary(req.query);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const to = data.to ? new Date(data.to) : new Date();
  const from = data.from
    ? new Date(data.from)
    : new Date(to.getTime() - DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000);

  if (from >= to) {
    return next(new AppError('El rango de fechas no es válido.', 422));
  }

  const metrics = await metricsService.summary(from, to);

  res.status(200).json({
    status: 'success',
    range: { from: from.toISOString(), to: to.toISOString() },
    metrics,
  });
});
