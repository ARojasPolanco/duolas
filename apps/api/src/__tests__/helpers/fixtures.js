import request from 'supertest';
import app from '../../app.js';
import User from '../../modules/auth/auth.model.js';

let counter = 0;

export const uniqueSuffix = () => {
  counter += 1;
  return `${Date.now().toString(36)}${counter}${Math.random().toString(36).slice(2, 5)}`;
};

export const uniqueUsername = () => `u${uniqueSuffix()}`;
export const uniqueEmail = () => `test_${uniqueSuffix()}@example.com`;
export const uniqueRiotId = () =>
  `Test${Math.random().toString(36).slice(2, 6)}#${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

export const authHeader = (token) => ({ Authorization: `Bearer ${token}` });

export const registerUser = async (overrides = {}) => {
  const payload = {
    username: uniqueUsername(),
    email: uniqueEmail(),
    password: 'password123',
    ageConfirmed: true,
    termsAccepted: true,
    ...overrides,
  };

  const res = await request(app).post('/api/v1/auth/register').send(payload);

  return {
    res,
    payload,
    user: res.body.user,
    token: res.body.token,
  };
};

export const loginUser = async (identifier, password = 'password123') => {
  return request(app).post('/api/v1/auth/login').send({ identifier, password });
};

export const markEmailVerified = async (userId) => {
  await User.update({ emailVerified: true }, { where: { id: userId } });
};

export const completeProfile = async (token, overrides = {}) => {
  const payload = {
    riotId: uniqueRiotId(),
    country: 'AR',
    primaryRole: 'mid',
    secondaryRole: 'jungle',
    rankTier: 'diamond',
    rankDivision: 'ii',
    rankLp: 42,
    playStyle: 'ranked',
    languages: ['es', 'en'],
    hasMic: true,
    scheduleBlocks: ['mon_night', 'tue_night'],
    bio: 'Busco duo para ranked.',
    discordTag: 'tester',
    ...overrides,
  };

  const res = await request(app).patch('/api/v1/profiles/me').set(authHeader(token)).send(payload);

  return { res, payload };
};

export const createMatchUser = async (profileOverrides = {}, { verify = true } = {}) => {
  const { token, user } = await registerUser();
  if (verify) {
    await markEmailVerified(user.id);
  }

  const profileResult = await completeProfile(token, profileOverrides);

  return {
    token,
    user,
    profile: profileResult.res.body.profile,
    payload: profileResult.payload,
    profileResponse: profileResult.res,
  };
};
