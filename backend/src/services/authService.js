import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../models/index.js';
import { env } from '../config/env.js';

function issueToken(userId) {
  return jwt.sign({ userId }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

function publicUser(user) {
  return { id: user.id, email: user.email, name: user.name };
}

export async function register(data) {
  if (await prisma.user.findUnique({ where: { email: data.email } })) {
    const error = new Error('Email already registered');
    error.status = 409;
    throw error;
  }
  const password = await bcrypt.hash(data.password, 12);
  const user = await prisma.user.create({ data: { email: data.email, password, name: data.name } });
  return { token: issueToken(user.id), user: publicUser(user) };
}

export async function login(data) {
  const user = await prisma.user.findUnique({ where: { email: data.email } });
  if (!user || !(await bcrypt.compare(data.password, user.password))) {
    const error = new Error('Invalid credentials');
    error.status = 401;
    throw error;
  }
  return { token: issueToken(user.id), user: publicUser(user) };
}
