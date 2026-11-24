import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { HttpError } from '../utils/httpError.js';

/**
 * Authentication business logic.
 * Receives its dependencies (prisma + validated env) so it can be tested
 * against any database.
 */
export function createAuthService({ prisma, env }) {
  // Used to burn the same CPU time when an email is unknown, so response
  // timing does not reveal which emails are registered.
  const dummyHash = bcrypt.hashSync('timing-equalizer-not-a-real-password', env.BCRYPT_ROUNDS);

  const toPublicUser = (u) => ({ id: u.id, name: u.name, email: u.email });

  async function findByEmail(email) {
    // Fast path: exact (already normalised) match using the unique index.
    const exact = await prisma.user.findUnique({ where: { email } });
    if (exact) return exact;
    // Legacy rows created before email normalisation may be mixed-case.
    return prisma.user.findFirst({ where: { email: { equals: email, mode: 'insensitive' } } });
  }

  function signAccessToken(user) {
    return jwt.sign({ userId: user.id }, env.JWT_SECRET, {
      algorithm: 'HS256',
      subject: user.id,
      expiresIn: env.JWT_EXPIRES_IN,
    });
  }

  async function register({ name, email, password }) {
    if (await findByEmail(email)) {
      throw new HttpError(409, 'Email already registered', 'EMAIL_TAKEN');
    }
    // Hash exactly once, here. Nothing else in the codebase hashes passwords.
    const hashed = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
    let user;
    try {
      user = await prisma.user.create({ data: { name, email, password: hashed } });
    } catch (err) {
      // Lost a race with a concurrent registration of the same email.
      if (err?.code === 'P2002') throw new HttpError(409, 'Email already registered', 'EMAIL_TAKEN');
      throw err;
    }
    return { token: signAccessToken(user), user: toPublicUser(user) };
  }

  async function login({ email, password }) {
    const user = await findByEmail(email);
    const valid = await bcrypt.compare(password, user ? user.password : dummyHash);
    if (!user || !valid) {
      throw new HttpError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    }
    return { token: signAccessToken(user), user: toPublicUser(user) };
  }

  async function getCurrentUser(userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new HttpError(401, 'Account no longer exists', 'USER_NOT_FOUND');
    return toPublicUser(user);
  }

  return { register, login, getCurrentUser };
}
