import { reportService } from './report.service.js';
import { validateReport } from './report.schema.js';
import { catchAsync } from '../../errors/catchAsync.js';

export const createReport = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = validateReport(req.body);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const report = await reportService.create(req.sessionUser.id, data);

  res.status(201).json({
    status: 'success',
    report: {
      id: report.id,
      status: report.status,
      reason: report.reason,
      priority: report.priority,
    },
    blocked: true,
  });
});
