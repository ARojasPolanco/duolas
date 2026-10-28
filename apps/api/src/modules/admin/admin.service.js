import { Op } from 'sequelize';
import User from '../auth/auth.model.js';
import PlayerProfile from '../profiles/profile.model.js';
import Report from '../trust/report.model.js';
import Sanction from '../trust/sanction.model.js';
import DuoConnection from '../matching/duoConnection.model.js';
import AvailabilitySession from '../availability/availability.model.js';
import { AppError } from '../../errors/appError.js';

const USER_ATTRIBUTES = [
  'id',
  'username',
  'email',
  'role',
  'status',
  'emailVerified',
  'warningCount',
  'suspendedUntil',
  'suspensionReason',
  'lastLoginAt',
  'lastActiveAt',
  'isDeleted',
  'deletionRequestedAt',
  'deletionScheduledFor',
  'createdAt',
];

const PROFILE_LIST_ATTRIBUTES = [
  'id',
  'country',
  'rankTier',
  'rankDivision',
  'rankIndex',
  'primaryRole',
  'secondaryRole',
  'reputationScore',
  'reputationPositive',
  'reputationNegative',
  'profileCompletedAt',
  'isDeleted',
];

const PROFILE_DETAIL_ATTRIBUTES = [
  ...PROFILE_LIST_ATTRIBUTES,
  'riotId',
  'server',
  'rankLp',
  'playStyle',
  'languages',
  'hasMic',
  'scheduleBlocks',
  'bio',
  'discordTag',
  'reputationPositive',
  'reputationNegative',
  'rankSource',
  'createdAt',
  'updatedAt',
];

const toProfileView = (profile) => {
  if (!profile) return null;

  return {
    id: profile.id,
    riotId: profile.riotId,
    server: profile.server,
    country: profile.country,
    primaryRole: profile.primaryRole,
    secondaryRole: profile.secondaryRole,
    rankTier: profile.rankTier,
    rankDivision: profile.rankDivision,
    rankLp: profile.rankLp,
    rankIndex: profile.rankIndex,
    playStyle: profile.playStyle,
    languages: profile.languages,
    hasMic: profile.hasMic,
    scheduleBlocks: profile.scheduleBlocks,
    bio: profile.bio,
    discordTag: profile.discordTag,
    reputation: {
      score: profile.reputationScore,
      positive: profile.reputationPositive,
      negative: profile.reputationNegative,
    },
    rankSource: profile.rankSource,
    profileCompletedAt: profile.profileCompletedAt,
    isDeleted: profile.isDeleted,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
};

const toUserView = (user) => ({
  id: user.id,
  username: user.username,
  email: user.email,
  role: user.role,
  status: user.status,
  emailVerified: user.emailVerified,
  warningCount: user.warningCount,
  suspendedUntil: user.suspendedUntil,
  suspensionReason: user.suspensionReason,
  lastLoginAt: user.lastLoginAt,
  lastActiveAt: user.lastActiveAt,
  isDeleted: user.isDeleted,
  deletionRequestedAt: user.deletionRequestedAt,
  deletionScheduledFor: user.deletionScheduledFor,
  createdAt: user.createdAt,
});

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
});

const toSanctionView = (sanction) => ({
  id: sanction.id,
  action: sanction.action,
  reason: sanction.reason,
  expiresAt: sanction.expiresAt,
  createdAt: sanction.createdAt,
  admin: sanction.admin ? { id: sanction.admin.id, username: sanction.admin.username } : null,
});

const emptyCounts = () => ({
  openReports: 0,
  activeConnections: 0,
  sanctions: 0,
});

export class AdminService {
  buildWhere({ search, role, status, account, emailVerified, profileCompleted }) {
    const where = {};

    if (search) {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (role) where.role = role;
    if (status) where.status = status;
    if (typeof emailVerified === 'boolean') where.emailVerified = emailVerified;

    if (account === 'active') {
      where.isDeleted = false;
    } else if (account === 'pending_deletion') {
      where.isDeleted = true;
      where.deletionScheduledFor = { [Op.gt]: new Date() };
    } else if (account === 'deleted') {
      where.isDeleted = true;
    }

    if (typeof profileCompleted === 'boolean') {
      where['$profile.profile_completed_at$'] = profileCompleted
        ? { [Op.ne]: null }
        : { [Op.is]: null };
    }

    return where;
  }

  async countsForUsers(userIds) {
    if (!userIds.length) return new Map();

    const counts = new Map(userIds.map((id) => [id, emptyCounts()]));

    const [reports, connections, sanctions] = await Promise.all([
      Report.findAll({
        where: {
          reportedId: { [Op.in]: userIds },
          status: { [Op.in]: ['open', 'reviewing'] },
        },
        attributes: ['reportedId'],
        raw: true,
      }),
      DuoConnection.findAll({
        where: {
          status: 'active',
          [Op.or]: [{ userLowId: { [Op.in]: userIds } }, { userHighId: { [Op.in]: userIds } }],
        },
        attributes: ['userLowId', 'userHighId'],
        raw: true,
      }),
      Sanction.findAll({
        where: { userId: { [Op.in]: userIds } },
        attributes: ['userId'],
        raw: true,
      }),
    ]);

    for (const report of reports) {
      const current = counts.get(report.reportedId);
      if (current) current.openReports += 1;
    }

    for (const connection of connections) {
      const low = counts.get(connection.userLowId);
      const high = counts.get(connection.userHighId);
      if (low) low.activeConnections += 1;
      if (high) high.activeConnections += 1;
    }

    for (const sanction of sanctions) {
      const current = counts.get(sanction.userId);
      if (current) current.sanctions += 1;
    }

    return counts;
  }

  async list({ page, limit, ...filters }) {
    const where = this.buildWhere(filters);

    const { rows, count } = await User.findAndCountAll({
      where,
      attributes: USER_ATTRIBUTES,
      include: [
        {
          model: PlayerProfile,
          as: 'profile',
          attributes: PROFILE_LIST_ATTRIBUTES,
          required: false,
        },
      ],
      order: [['createdAt', 'DESC']],
      limit,
      offset: (page - 1) * limit,
      distinct: true,
      subQuery: false,
    });

    const counts = await this.countsForUsers(rows.map((user) => user.id));

    return {
      users: rows.map((user) => ({
        ...toUserView(user),
        profileCompleted: Boolean(user.profile?.profileCompletedAt && !user.profile.isDeleted),
        profile: toProfileView(user.profile),
        counts: counts.get(user.id) || emptyCounts(),
      })),
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.max(1, Math.ceil(count / limit)),
      },
    };
  }

  async detail(userId) {
    const user = await User.findByPk(userId, {
      attributes: USER_ATTRIBUTES,
      include: [
        {
          model: PlayerProfile,
          as: 'profile',
          attributes: PROFILE_DETAIL_ATTRIBUTES,
          required: false,
        },
      ],
    });

    if (!user) {
      throw new AppError('No encontramos ese usuario.', 404);
    }

    const now = new Date();

    const [
      reports,
      totalReports,
      sanctions,
      totalSanctions,
      activeConnections,
      totalConnections,
      availability,
    ] = await Promise.all([
      Report.findAll({
        where: { reportedId: userId },
        include: [{ model: User, as: 'reporter', attributes: ['id', 'username'] }],
        order: [['createdAt', 'DESC']],
        limit: 10,
      }),
      Report.count({ where: { reportedId: userId } }),
      Sanction.findAll({
        where: { userId },
        include: [{ model: User, as: 'admin', attributes: ['id', 'username'] }],
        order: [['createdAt', 'DESC']],
        limit: 10,
      }),
      Sanction.count({ where: { userId } }),
      DuoConnection.count({
        where: {
          status: 'active',
          [Op.or]: [{ userLowId: userId }, { userHighId: userId }],
        },
      }),
      DuoConnection.count({
        where: { [Op.or]: [{ userLowId: userId }, { userHighId: userId }] },
      }),
      AvailabilitySession.findOne({
        where: {
          userId,
          status: 'active',
          expiresAt: { [Op.gt]: now },
        },
        attributes: ['id', 'roles', 'queue', 'note', 'startedAt', 'expiresAt'],
      }),
    ]);

    return {
      ...toUserView(user),
      profileCompleted: Boolean(user.profile?.profileCompletedAt && !user.profile.isDeleted),
      profile: toProfileView(user.profile),
      stats: {
        openReports: reports.filter((report) => ['open', 'reviewing'].includes(report.status))
          .length,
        totalReports,
        sanctions: totalSanctions,
        activeConnections,
        totalConnections,
      },
      reports: reports.map(toReportView),
      sanctions: sanctions.map(toSanctionView),
      availability: availability
        ? {
            id: availability.id,
            roles: availability.roles,
            queue: availability.queue,
            note: availability.note,
            startedAt: availability.startedAt,
            expiresAt: availability.expiresAt,
          }
        : null,
    };
  }

  async overview() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      users,
      players,
      admins,
      newUsers7d,
      emailVerified,
      profilesComplete,
      suspended,
      pendingDeletions,
      deletedUsers,
      openReports,
      activeConnections,
      activeAvailability,
    ] = await Promise.all([
      User.count({ where: { isDeleted: false } }),
      User.count({ where: { isDeleted: false, role: 'player' } }),
      User.count({ where: { isDeleted: false, role: 'admin' } }),
      User.count({ where: { isDeleted: false, createdAt: { [Op.gte]: weekAgo } } }),
      User.count({ where: { isDeleted: false, emailVerified: true } }),
      PlayerProfile.count({ where: { isDeleted: false, profileCompletedAt: { [Op.ne]: null } } }),
      User.count({ where: { isDeleted: false, status: 'suspended' } }),
      User.count({
        where: { isDeleted: true, deletionScheduledFor: { [Op.gt]: now } },
      }),
      User.count({ where: { isDeleted: true } }),
      Report.count({ where: { status: { [Op.in]: ['open', 'reviewing'] } } }),
      DuoConnection.count({ where: { status: 'active' } }),
      AvailabilitySession.count({
        where: { status: 'active', expiresAt: { [Op.gt]: now } },
      }),
    ]);

    return {
      users,
      players,
      admins,
      newUsers7d,
      emailVerified,
      profilesComplete,
      suspended,
      pendingDeletions,
      deletedUsers,
      openReports,
      activeConnections,
      activeAvailability,
    };
  }
}

export const adminService = new AdminService();
