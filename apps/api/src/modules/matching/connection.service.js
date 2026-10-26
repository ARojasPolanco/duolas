import { Op } from 'sequelize';
import DuoConnection from './duoConnection.model.js';
import AvailabilitySession from '../availability/availability.model.js';
import { notificationService } from '../notifications/notification.service.js';
import { orderedPair } from './matching.utils.js';

export class ConnectionService {
  async createConnection({
    userIds,
    source,
    transaction,
    closeAvailability = true,
    notify = true,
  }) {
    const [userAId, userBId] = userIds;
    const [low, high] = orderedPair(userAId, userBId);
    const now = new Date();

    let connection = await DuoConnection.findOne({
      where: { userLowId: low, userHighId: high },
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    let created = false;
    let reactivated = false;

    if (!connection) {
      connection = await DuoConnection.create(
        {
          userLowId: low,
          userHighId: high,
          source,
          status: 'active',
          contactRevealedAt: now,
        },
        { transaction }
      );
      created = true;
    } else if (connection.status === 'archived') {
      await connection.update(
        {
          status: 'active',
          archivedAt: null,
          archivedBy: null,
          contactRevealedAt: now,
        },
        { transaction }
      );
      reactivated = true;
    }

    if (closeAvailability) {
      await AvailabilitySession.update(
        {
          status: 'closed',
          endedAt: now,
          closedReason: 'matched',
        },
        {
          where: {
            userId: { [Op.in]: [userAId, userBId] },
            status: 'active',
          },
          transaction,
        }
      );
    }

    if (notify && (created || reactivated)) {
      const notificationData = {
        type: 'match_created',
        title: 'Es un match',
        message: 'Ya pueden coordinar su duo.',
        data: { connectionId: connection.id, url: '/matches' },
      };

      await notificationService.create({ userId: userAId, ...notificationData }, transaction);
      await notificationService.create({ userId: userBId, ...notificationData }, transaction);
    }

    return { connection, created, reactivated };
  }
}

export const connectionService = new ConnectionService();
