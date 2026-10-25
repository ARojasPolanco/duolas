import jwt from 'jsonwebtoken';
import { envs } from '../enviroments.js';

export const generateJWT = (payload) =>
  jwt.sign(payload, envs.SECRET_JWT_SEED, { expiresIn: envs.JWT_EXPIRE_IN });

export const verifyJWT = (token) => jwt.verify(token, envs.SECRET_JWT_SEED);
