import { Op } from 'sequelize';
import User from './auth.model.js';

export class AuthService {
  async findOneByEmail(email) {
    return User.findOne({
      where: { email: email.toLowerCase(), isDeleted: false },
      attributes: { exclude: ['password'] },
    });
  }

  async findOneByEmailWithPassword(email) {
    return User.findOne({
      where: { email: email.toLowerCase(), isDeleted: false },
    });
  }

  async findOneByUsername(username) {
    return User.findOne({
      where: { username: { [Op.iLike]: username }, isDeleted: false },
      attributes: { exclude: ['password'] },
    });
  }

  async findPendingDeletionByEmail(email) {
    return User.findOne({
      where: {
        email: email.toLowerCase(),
        isDeleted: true,
        deletionScheduledFor: { [Op.gt]: new Date() },
      },
      attributes: ['id'],
    });
  }

  async findPendingDeletionByUsername(username) {
    return User.findOne({
      where: {
        username: { [Op.iLike]: username },
        isDeleted: true,
        deletionScheduledFor: { [Op.gt]: new Date() },
      },
      attributes: ['id'],
    });
  }

  async findByIdentifierWithPassword(identifier) {
    const where = identifier.includes('@')
      ? { email: identifier.toLowerCase() }
      : { username: { [Op.iLike]: identifier } };

    return User.findOne({ where: { ...where, isDeleted: false } });
  }

  async findPendingDeletionByIdentifierWithPassword(identifier) {
    const where = identifier.includes('@')
      ? { email: identifier.toLowerCase() }
      : { username: { [Op.iLike]: identifier } };

    return User.findOne({
      where: {
        ...where,
        isDeleted: true,
        deletionScheduledFor: { [Op.gt]: new Date() },
      },
    });
  }

  async findOneById(id) {
    return User.findOne({
      where: { id, isDeleted: false },
      attributes: { exclude: ['password'] },
    });
  }

  async findByVerificationTokenHash(tokenHash) {
    return User.findOne({
      where: { emailVerificationToken: tokenHash, isDeleted: false },
      attributes: { exclude: ['password'] },
    });
  }

  async findByResetToken(tokenHash) {
    return User.findOne({
      where: { passwordResetToken: tokenHash, isDeleted: false },
      attributes: { exclude: ['password'] },
    });
  }

  async create(data) {
    return User.create(data);
  }

  async update(id, data) {
    const user = await User.findByPk(id);
    if (!user) return null;
    return user.update(data);
  }

  async touchLastActive(id) {
    await User.update({ lastActiveAt: new Date() }, { where: { id, isDeleted: false } });
  }
}

export const authService = new AuthService();
