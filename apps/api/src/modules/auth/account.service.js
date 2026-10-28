import crypto from 'node:crypto';
import { Op } from 'sequelize';
import sequelize from '../../config/database/database.js';
import { comparePassword } from '../../config/plugins/encrypted-password.js';
import logger from '../../config/logger.js';
import { AppError } from '../../errors/appError.js';
import User from './auth.model.js';
import PlayerProfile from '../profiles/profile.model.js';
import AvailabilitySession from '../availability/availability.model.js';
import Invite from '../invites/invite.model.js';
import DuoPost from '../duoPosts/duoPost.model.js';
import PostApplication from '../duoPosts/postApplication.model.js';
import PushSubscription from '../push/pushSubscription.model.js';
import Notification from '../notifications/notification.model.js';
import DuoLike from '../matching/duoLike.model.js';
import Block from '../trust/block.model.js';

const GRACE_DAYS = 30;
const GRACE_MS = GRACE_DAYS * 24 * 60 * 60 * 1000;

export class AccountService {
  async requestDeletion(userId, password) {
    const user = await User.findOne({ where: { id: userId, isDeleted: false } });
    if (!user) {
      throw new AppError('La cuenta no está disponible.', 404);
    }

    const passwordOk = await comparePassword(password, user.password);
    if (!passwordOk) {
      throw new AppError('La contraseña actual es incorrecta.', 401);
    }

    const now = new Date();
    const scheduledFor = new Date(now.getTime() + GRACE_MS);

    await sequelize.transaction(async (transaction) => {
      await user.update(
        {
          isDeleted: true,
          deletionRequestedAt: now,
          deletionScheduledFor: scheduledFor,
          changedPasswordAt: now,
          emailVerificationToken: null,
          emailVerificationExpires: null,
          passwordResetToken: null,
          passwordResetExpires: null,
        },
        { transaction }
      );

      await AvailabilitySession.update(
        {
          status: 'closed',
          endedAt: now,
          closedReason: 'manual',
        },
        {
          where: { userId, status: 'active' },
          transaction,
        }
      );

      await Invite.update(
        {
          status: 'cancelled',
          respondedAt: now,
        },
        {
          where: {
            status: 'pending',
            [Op.or]: [{ fromUserId: userId }, { toUserId: userId }],
          },
          transaction,
        }
      );

      await DuoPost.update(
        { status: 'cancelled' },
        {
          where: { ownerId: userId, status: 'active' },
          transaction,
        }
      );

      await PostApplication.update(
        { status: 'withdrawn' },
        {
          where: { applicantId: userId, status: 'pending' },
          transaction,
        }
      );

      await PushSubscription.destroy({ where: { userId }, transaction });
      await Notification.destroy({ where: { userId }, transaction });
    });

    return { scheduledFor };
  }

  async restorePendingDeletion(user) {
    await user.update({
      isDeleted: false,
      deletionRequestedAt: null,
      deletionScheduledFor: null,
      status: 'active',
      suspendedUntil: null,
      suspensionReason: null,
    });
  }

  async purgeExpiredDeletions() {
    const users = await User.findAll({
      where: {
        isDeleted: true,
        deletionScheduledFor: { [Op.lte]: new Date() },
      },
    });

    let purged = 0;

    for (const user of users) {
      try {
        await this.purgeUser(user);
        purged += 1;
      } catch (error) {
        logger.warn('No se pudo purgar la cuenta', {
          userId: user.id,
          message: error.message,
        });
      }
    }

    return purged;
  }

  async purgeUser(user) {
    const userId = user.id;
    const now = new Date();
    const randomPassword = crypto.randomBytes(32).toString('hex');
    const anonymizedUsername = `deleted_${userId.replace(/-/g, '').slice(0, 12)}`;
    const anonymizedEmail = `deleted+${userId}@deleted.duolas.invalid`;

    await sequelize.transaction(async (transaction) => {
      await Invite.destroy({
        where: { [Op.or]: [{ fromUserId: userId }, { toUserId: userId }] },
        transaction,
      });
      await AvailabilitySession.destroy({ where: { userId }, transaction });
      await PostApplication.destroy({ where: { applicantId: userId }, transaction });
      await DuoPost.destroy({ where: { ownerId: userId }, transaction });
      await DuoLike.destroy({
        where: { [Op.or]: [{ fromUserId: userId }, { toUserId: userId }] },
        transaction,
      });
      await Block.destroy({
        where: { [Op.or]: [{ blockerId: userId }, { blockedId: userId }] },
        transaction,
      });
      await Notification.destroy({ where: { userId }, transaction });
      await PushSubscription.destroy({ where: { userId }, transaction });
      await PlayerProfile.destroy({ where: { userId }, transaction });

      await user.update(
        {
          username: anonymizedUsername,
          email: anonymizedEmail,
          password: randomPassword,
          role: 'player',
          emailVerified: false,
          status: 'active',
          suspendedUntil: null,
          suspensionReason: null,
          isDeleted: true,
          deletionRequestedAt: user.deletionRequestedAt || now,
          deletionScheduledFor: null,
          changedPasswordAt: now,
          lastLoginAt: null,
          lastActiveAt: null,
          emailVerificationToken: null,
          emailVerificationExpires: null,
          passwordResetToken: null,
          passwordResetExpires: null,
        },
        { transaction }
      );
    });
  }
}

export const accountService = new AccountService();
