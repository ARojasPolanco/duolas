import { reportService } from '../trust/report.service.js';
import {
  validateAdminReportsQuery,
  validateResolveReport,
  validateSuspendUser,
  validateWarnUser,
} from '../trust/report.schema.js';
import { validateUuid } from '../../utils/validation.js';
import { catchAsync } from '../../errors/catchAsync.js';

export const getReports = catchAsync(async (req, res) => {
  const { hasError, errorMessages, data } = validateAdminReportsQuery(req.query);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const reports = await reportService.list(data);

  res.status(200).json({ status: 'success', reports, total: reports.length });
});

export const resolveReport = catchAsync(async (req, res) => {
  const {
    hasError: idError,
    errorMessages: idErrors,
    data: reportId,
  } = validateUuid(req.params.id, 'Reporte');
  if (idError) {
    return res.status(422).json({ status: 'fail', message: idErrors.join(', ') });
  }

  const { hasError, errorMessages, data } = validateResolveReport(req.body);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const result = await reportService.resolve(req.sessionUser.id, reportId, data);

  res.status(200).json({
    status: 'success',
    report: result.report,
    action: result.action,
    user: result.user,
  });
});

export const warnUser = catchAsync(async (req, res) => {
  const {
    hasError: idError,
    errorMessages: idErrors,
    data: userId,
  } = validateUuid(req.params.id, 'Usuario');
  if (idError) {
    return res.status(422).json({ status: 'fail', message: idErrors.join(', ') });
  }

  const { hasError, errorMessages, data } = validateWarnUser(req.body);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const user = await reportService.warn(req.sessionUser.id, userId, data.reason);

  res.status(200).json({ status: 'success', user });
});

export const suspendUser = catchAsync(async (req, res) => {
  const {
    hasError: idError,
    errorMessages: idErrors,
    data: userId,
  } = validateUuid(req.params.id, 'Usuario');
  if (idError) {
    return res.status(422).json({ status: 'fail', message: idErrors.join(', ') });
  }

  const { hasError, errorMessages, data } = validateSuspendUser(req.body);
  if (hasError) {
    return res.status(422).json({ status: 'fail', message: errorMessages.join(', ') });
  }

  const user = await reportService.suspend(req.sessionUser.id, userId, data);

  res.status(200).json({ status: 'success', user });
});
