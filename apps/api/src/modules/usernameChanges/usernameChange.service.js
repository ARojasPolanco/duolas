import { Op } from 'sequelize';
import { usernameSchema } from '@duo-las/shared';
import sequelize from '../../config/database/database.js';
import User from '../auth/auth.model.js';
import { notificationService } from '../notifications/notification.service.js';
import { AppError } from '../../errors/appError.js';
import UsernameChangeRequest from './usernameChangeRequest.model.js';

const OPEN_STATUSES = ['pending_user', 'pending_admin'];

const toRequestView = (request) => ({
  id: request.id,
  status: request.status,
  suggestedUsername: request.suggestedUsername,
  adminNote: request.adminNote,
  resolutionNote: request.resolutionNote,
  resolvedAt: request.resolvedAt,
  createdAt: request.createdAt,
  updatedAt: request.updatedAt,
});

const validateSuggestedUsername = (value) => {
  const result = usernameSchema.safeParse(value);
  if (!result.success) {
    throw new AppError(result.error.issues.map((issue) => issue.message).join(', '), 422);
  }
  return result.data;
};

const findUser = async (userId, transaction) => {
  const user = await User.findOne({
    where: { id: userId, isDeleted: false },
    transaction,
    lock: transaction?.LOCK.UPDATE,
  });

  if (!user) {
    throw new AppError('No encontramos ese usuario.', 404);
  }

  return user;
};

const assertUsernameAvailable = async (userId, username, transaction) => {
  const existing = await User.findOne({
    where: { username: { [Op.iLike]: username } },
    transaction,
  });

  if (existing && existing.id !== userId) {
    throw new AppError('Ese nombre de usuario ya está en uso.', 409);
  }
};

export class UsernameChangeService {
  async createRequest(adminId, userId, { note } = {}) {
    if (adminId === userId) {
      throw new AppError('No podés solicitar un cambio para tu propia cuenta.', 400);
    }

    await findUser(userId);
    const openRequest = await UsernameChangeRequest.findOne({
      where: { userId, status: { [Op.in]: OPEN_STATUSES } },
    });

    if (openRequest) {
      throw new AppError('Ese usuario ya tiene una solicitud de username abierta.', 409);
    }

    let request;

    try {
      request = await UsernameChangeRequest.create({
        userId,
        adminId,
        status: 'pending_user',
        adminNote: note?.trim() || null,
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new AppError('Ese usuario ya tiene una solicitud de username abierta.', 409);
      }
      throw error;
    }

    await notificationService.create({
      userId,
      type: 'username_change_requested',
      title: 'Actualizá tu nombre de usuario',
      message:
        note?.trim() ||
        'Tu nombre de usuario puede confundirse con la marca Duo LAS. Elegí uno nuevo y lo revisamos.',
      data: { url: '/solicitud-username', requestId: request.id },
    });

    return toRequestView(request);
  }

  async getMine(userId) {
    const request = await UsernameChangeRequest.findOne({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    return request ? toRequestView(request) : null;
  }

  async suggest(userId, requestId, username) {
    const request = await UsernameChangeRequest.findOne({
      where: { id: requestId, userId },
    });

    if (!request) {
      throw new AppError('No encontramos esa solicitud.', 404);
    }

    if (request.status !== 'pending_user') {
      throw new AppError('Esa solicitud ya no está esperando un nombre.', 409);
    }

    const user = await findUser(userId);
    const suggested = validateSuggestedUsername(username);

    if (suggested.toLowerCase() === user.username.toLowerCase()) {
      throw new AppError('Elegí un nombre de usuario distinto al actual.', 422);
    }

    await assertUsernameAvailable(userId, suggested);

    const updated = await request.update({
      suggestedUsername: suggested,
      status: 'pending_admin',
      resolutionNote: null,
      resolvedAt: null,
    });

    if (request.adminId) {
      await notificationService.create({
        userId: request.adminId,
        type: 'username_change_suggested',
        title: 'Nueva propuesta de username',
        message: `@${user.username} propuso @${suggested}. Revisala desde el panel de usuarios.`,
        data: { url: `/admin/usuarios/${userId}`, requestId: request.id },
      });
    }

    return toRequestView(updated);
  }

  async approve(adminId, requestId, { username, note } = {}) {
    try {
      return await sequelize.transaction(async (transaction) => {
        const request = await UsernameChangeRequest.findByPk(requestId, {
          transaction,
          lock: transaction.LOCK.UPDATE,
        });

        if (!request) {
          throw new AppError('No encontramos esa solicitud.', 404);
        }

        if (request.status !== 'pending_admin') {
          throw new AppError('La solicitud no tiene una propuesta pendiente.', 409);
        }

        const user = await findUser(request.userId, transaction);
        const finalUsername = validateSuggestedUsername(username || request.suggestedUsername);

        if (finalUsername.toLowerCase() === user.username.toLowerCase()) {
          throw new AppError('El nuevo nombre debe ser distinto al actual.', 422);
        }

        await assertUsernameAvailable(user.id, finalUsername, transaction);
        await user.update({ username: finalUsername }, { transaction });

        const updated = await request.update(
          {
            suggestedUsername: finalUsername,
            status: 'approved',
            resolutionNote: note?.trim() || null,
            resolvedAt: new Date(),
          },
          { transaction }
        );

        await notificationService.create(
          {
            userId: user.id,
            type: 'username_changed',
            title: 'Nombre de usuario actualizado',
            message: `Tu nombre de usuario ahora es @${finalUsername}.`,
            data: { url: '/inicio' },
          },
          transaction
        );

        return {
          request: toRequestView(updated),
          username: user.username,
          approvedBy: adminId,
        };
      });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        throw new AppError('Ese nombre de usuario ya está en uso.', 409);
      }
      throw error;
    }
  }

  async reject(adminId, requestId, { note } = {}) {
    const request = await UsernameChangeRequest.findByPk(requestId);

    if (!request) {
      throw new AppError('No encontramos esa solicitud.', 404);
    }

    if (!OPEN_STATUSES.includes(request.status)) {
      throw new AppError('Esa solicitud ya está resuelta.', 409);
    }

    const updated = await request.update({
      status: 'rejected',
      resolutionNote: note?.trim() || null,
      resolvedAt: new Date(),
    });

    await notificationService.create({
      userId: request.userId,
      type: 'username_change_rejected',
      title: 'Solicitud de username rechazada',
      message:
        note?.trim() ||
        'Tu propuesta de nombre de usuario no fue aprobada. Un admin puede enviarte una nueva solicitud.',
      data: { url: '/solicitud-username' },
    });

    return { request: toRequestView(updated), rejectedBy: adminId };
  }

  async getLatestForAdmin(userId) {
    const request = await UsernameChangeRequest.findOne({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });

    return request ? toRequestView(request) : null;
  }
}

export const usernameChangeService = new UsernameChangeService();
export { toRequestView };
