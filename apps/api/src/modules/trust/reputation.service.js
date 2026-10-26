import { Op } from 'sequelize';
import PlayerProfile from '../profiles/profile.model.js';
import Feedback from './feedback.model.js';

export const computeReputation = (positive, negative) => {
  const total = positive + negative;
  return Math.round(((positive + 2) / (total + 4)) * 100);
};

export class ReputationService {
  async recalculate(userId, transaction) {
    const profile = await PlayerProfile.findOne({
      where: { userId, isDeleted: false },
      transaction,
    });

    if (!profile) return null;

    const [positive, negative] = await Promise.all([
      Feedback.count({
        where: {
          targetId: userId,
          visibleAt: { [Op.ne]: null },
          sentiment: 'positive',
        },
        transaction,
      }),
      Feedback.count({
        where: {
          targetId: userId,
          visibleAt: { [Op.ne]: null },
          sentiment: 'negative',
        },
        transaction,
      }),
    ]);

    const score = computeReputation(positive, negative);

    await profile.update(
      {
        reputationPositive: positive,
        reputationNegative: negative,
        reputationScore: score,
        reputationCalculatedAt: new Date(),
      },
      { transaction }
    );

    return { positive, negative, score };
  }

  async recalculateMany(userIds, transaction) {
    const uniqueIds = [...new Set(userIds)];
    const results = [];

    for (const userId of uniqueIds) {
      const result = await this.recalculate(userId, transaction);
      if (result) results.push({ userId, ...result });
    }

    return results;
  }
}

export const reputationService = new ReputationService();
