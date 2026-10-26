import { Op } from 'sequelize';
import sequelize from '../../config/database/database.js';
import Report from './report.model.js';
import Sanction from './sanction.model.js';
import User from '../auth/auth.model.js';
import { blockService } from './block.service.js';
import { notificationService } from '../notifications/notification.service.js';
import { mailService } from '../../config/resend/resend.js';
import { metricsService } from '../metrics/metrics.service.js';
import logger from '../../config/logger.js';
import { AppError } from '../../errors/appError.js';

const USER_ATTRIBUTES = [
  'id',
  'username',
  'role',
  'status',
  'warningCount',
  'suspendedUntil',
  'suspensionReason',
  'createdAt',
];

const SUSPENSION_DAYS = {
  suspended_7d: 7,
  suspended_30d: 30,
  suspended_permanent: null,
};

const toReportView = (report) => ({
  id: report.id,
  reason: report.reason,
  details: report.details,
  status: report.status,
  priority: report.priority,
  adminNote: report.adminNote,
  resolvedAt: report.resolvedAt,
  createdAt: report.createdAt,
  reporter: report.reporter ? { id: report.reporter.id, username: report.reporter.username } : null,
  reported: report.reported
    ? {
        id: report.reported.id,
        username: report.reported.username,
        status: report.reported.status,
        warningCount: report.reported.warningCount,
        suspendedUntil: report.reported.suspendedUntil,
      }
    : null,
  admin: report.admin ? { id: report.admin.id, username: report.admin.username } : null,
});

export class ReportService {
  async create(reporterId, { reportedUserId, reason, details }) {
    if (reporterId === reportedUserId) {
      throw new AppError('No podés reportarte a vos mismo.', 400);
    }

    const target = await User.findOne({
      where: { id: reportedUserId, isDeleted: false },
      attributes: ['id'],
    });

    if (!target) {
      throw new AppError('No encontramos ese usuario.', 404);
    }

    const existing = await Report.findOne({
      where: {
        reporterId,
        reportedId: reportedUserId,
        status: { [Op.in]: ['open', 'reviewing'] },
      },
    });

    if (existing) {
      throw new AppError('Ya tenés un reporte abierto contra este usuario.', 409);
    }

    try {
      return await sequelize.transaction(async (transaction) => {
        const report = await Report.create(
          {
            reporterId,
            reportedId: reportedUserId,
            reason,
            details: details?.trim() || null,
            status: 'open',
            priority: reason === 'underage',
          },
          { transaction }
        );

        await blockService.block(reporterId, reportedUserId, { transaction });

        await metricsService.track(
          'report_created',
          reporterId,
          { reportId: report.id, reason, priority: report.priority },
          transaction
        );

        return report;
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new AppError('Ya tenés un reporte abierto contra este usuario.', 409);
      }
      throw error;
    }
  }

  async list({ status, reason, priority, limit }) {
    const where = {};
    if (status) where.status = status;
    if (reason) where.reason = reason;
    if (typeof priority === 'boolean') where.priority = priority;

    const reports = await Report.findAll({
      where,
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'username'] },
        { model: User, as: 'reported', attributes: USER_ATTRIBUTES },
        { model: User, as: 'admin', attributes: ['id', 'username'] },
      ],
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'ASC'],
      ],
      limit,
    });

    return reports.map(toReportView);
  }

  async resolve(adminId, reportId, { resolution, note }) {
    let emailPayload = null;

    const result = await sequelize.transaction(async (transaction) => {
      const report = await Report.findOne({
        where: { id: reportId },
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      if (!report) {
        throw new AppError('No encontramos ese reporte.', 404);
      }

      if (['resolved', 'dismissed'].includes(report.status)) {
        throw new AppError('Ese reporte ya fue resuelto.', 409);
      }

      const target = await User.findOne({
        where: { id: report.reportedId, isDeleted: false },
        transaction,
      });

      if (!target) {
        throw new AppError('No encontramos al usuario reportado.', 404);
      }

      const actionReason = note?.trim() || `Resolución del reporte por ${report.reason}.`;
      let action = 'dismissed';

      if (resolution === 'warned') {
        await this.applyWarning(adminId, target, actionReason, {
          reportId: report.id,
          transaction,
        });
        action = 'warned';
      }

      if (resolution in SUSPENSION_DAYS) {
        const days = SUSPENSION_DAYS[resolution];
        const suspended = await this.applySuspension(adminId, target, {
          days,
          reason: actionReason,
          reportId: report.id,
          transaction,
        });
        action = suspended.action;
        emailPayload = {
          email: target.email,
          reason: actionReason,
          suspendedUntil: suspended.suspendedUntil,
        };
      }

      await report.update(
        {
          status: resolution === 'dismissed' ? 'dismissed' : 'resolved',
          adminId,
          adminNote: note?.trim() || null,
          resolvedAt: new Date(),
        },
        { transaction }
      );

      return { report, action, target };
    });

    if (emailPayload) {
      await this.sendSuspensionEmail(emailPayload);
    }

    const fullReport = await Report.findByPk(result.report.id, {
      include: [
        { model: User, as: 'reporter', attributes: ['id', 'username'] },
        { model: User, as: 'reported', attributes: USER_ATTRIBUTES },
        { model: User, as: 'admin', attributes: ['id', 'username'] },
      ],
    });

    return {
      report: toReportView(fullReport),
      action: result.action,
      user: {
        id: result.target.id,
        username: result.target.username,
        status: result.target.status,
        warningCount: result.target.warningCount,
        suspendedUntil: result.target.suspendedUntil,
      },
    };
  }

  async warn(adminId, userId, reason) {
    if (adminId === userId) {
      throw new AppError('No podés sancionarte a vos mismo.', 400);
    }

    const result = await sequelize.transaction(async (transaction) => {
      const target = await User.findOne({
        where: { id: userId, isDeleted: false },
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      if (!target) {
        throw new AppError('No encontramos ese usuario.', 404);
      }

      await this.applyWarning(adminId, target, reason, { transaction });
      return target;
    });

    return {
      id: result.id,
      username: result.username,
      warningCount: result.warningCount,
    };
  }

  async suspend(adminId, userId, { days, reason }) {
    if (adminId === userId) {
      throw new AppError('No podés suspenderte a vos mismo.', 400);
    }

    const result = await sequelize.transaction(async (transaction) => {
      const target = await User.findOne({
        where: { id: userId, isDeleted: false },
        lock: transaction.LOCK.UPDATE,
        transaction,
      });

      if (!target) {
        throw new AppError('No encontramos ese usuario.', 404);
      }

      return this.applySuspension(adminId, target, { days, reason, transaction });
    });

    await this.sendSuspensionEmail({
      email: result.target.email,
      reason,
      suspendedUntil: result.suspendedUntil,
    });

    return {
      id: result.target.id,
      username: result.target.username,
      status: result.target.status,
      suspendedUntil: result.suspendedUntil,
      action: result.action,
    };
  }

  async applyWarning(adminId, target, reason, { reportId = null, transaction } = {}) {
    target.warningCount += 1;
    await target.save({ transaction });

    const sanction = await Sanction.create(
      {
        userId: target.id,
        adminId,
        reportId,
        action: 'warned',
        reason,
        expiresAt: null,
      },
      { transaction }
    );

    await notificationService.create(
      {
        userId: target.id,
        type: 'warning_received',
        title: 'Advertencia',
        message: `Recibiste una advertencia: ${reason}`,
        data: { url: '/inicio' },
      },
      transaction
    );

    return sanction;
  }

  async applySuspension(adminId, target, { days, reason, reportId = null, transaction }) {
    const suspendedUntil = days ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : null;
    const action = days ? `suspended_${days}d` : 'suspended_permanent';

    await target.update(
      {
        status: 'suspended',
        suspendedUntil,
        suspensionReason: reason,
      },
      { transaction }
    );

    const sanction = await Sanction.create(
      {
        userId: target.id,
        adminId,
        reportId,
        action,
        reason,
        expiresAt: suspendedUntil,
      },
      { transaction }
    );

    await notificationService.create(
      {
        userId: target.id,
        type: 'account_suspended',
        title: 'Cuenta suspendida',
        message: `Tu cuenta fue suspendida. Motivo: ${reason}`,
        data: { url: '/login' },
      },
      transaction
    );

    await metricsService.track(
      'user_suspended',
      target.id,
      { days, permanent: days === null },
      transaction
    );

    return { target, sanction, action, suspendedUntil };
  }

  async sendSuspensionEmail({ email, reason, suspendedUntil }) {
    try {
      await mailService.sendSuspensionEmail(email, reason, suspendedUntil);
    } catch (error) {
      logger.warn('No se pudo enviar el email de suspensión', {
        message: error.message,
      });
    }
  }
}

export const reportService = new ReportService();
