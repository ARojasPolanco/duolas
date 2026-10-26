import { Op } from 'sequelize';
import Block from './block.model.js';
import DuoConnection from '../matching/duoConnection.model.js';
import DuoLike from '../matching/duoLike.model.js';
import User from '../auth/auth.model.js';
import { AppError } from '../../errors/appError.js';
import { orderedPair } from '../matching/matching.utils.js';

export class BlockService {
  async block(blockerId, blockedId) {
    if (blockerId === blockedId) {
      throw new AppError('No podés bloquearte a vos mismo.', 400);
    }

    const target = await User.findOne({
      where: { id: blockedId, isDeleted: false },
      attributes: ['id'],
    });
    if (!target) {
      throw new AppError('No encontramos ese usuario.', 404);
    }

    let block = await Block.findOne({ where: { blockerId, blockedId } });

    if (block) {
      if (block.isDeleted) {
        await block.update({ isDeleted: false });
      }
    } else {
      block = await Block.create({ blockerId, blockedId });
    }

    const [low, high] = orderedPair(blockerId, blockedId);
    await DuoConnection.update(
      {
        status: 'archived',
        archivedAt: new Date(),
        archivedBy: blockerId,
      },
      {
        where: { userLowId: low, userHighId: high, status: 'active' },
      }
    );

    await DuoLike.update(
      { status: 'cancelled' },
      {
        where: {
          status: 'pending',
          [Op.or]: [
            { fromUserId: blockerId, toUserId: blockedId },
            { fromUserId: blockedId, toUserId: blockerId },
          ],
        },
      }
    );

    return block;
  }

  async unblock(blockerId, blockedId) {
    const block = await Block.findOne({
      where: { blockerId, blockedId, isDeleted: false },
    });

    if (block) {
      await block.update({ isDeleted: true });
    }

    return true;
  }

  async list(blockerId) {
    const rows = await Block.findAll({
      where: { blockerId, isDeleted: false },
      include: [
        {
          model: User,
          as: 'blocked',
          attributes: ['id', 'username'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });

    return rows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt,
      user: row.blocked ? { id: row.blocked.id, username: row.blocked.username } : null,
    }));
  }

  async getBlockedIds(userId) {
    const rows = await Block.findAll({
      where: {
        isDeleted: false,
        [Op.or]: [{ blockerId: userId }, { blockedId: userId }],
      },
      attributes: ['blockerId', 'blockedId'],
    });

    const ids = new Set();
    for (const row of rows) {
      ids.add(row.blockerId === userId ? row.blockedId : row.blockerId);
    }
    ids.delete(userId);
    return [...ids];
  }

  async isBlockedEither(a, b) {
    const block = await Block.findOne({
      where: {
        isDeleted: false,
        [Op.or]: [
          { blockerId: a, blockedId: b },
          { blockerId: b, blockedId: a },
        ],
      },
    });

    return Boolean(block);
  }
}

export const blockService = new BlockService();
