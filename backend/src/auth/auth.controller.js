import { registerSchema, loginSchema } from './auth.schemas.js';

export function createAuthController({ authService }) {
  return {
    async register(req, res, next) {
      try {
        const input = registerSchema.parse(req.body ?? {});
        res.status(201).json(await authService.register(input));
      } catch (err) { next(err); }
    },

    async login(req, res, next) {
      try {
        const input = loginSchema.parse(req.body ?? {});
        res.status(200).json(await authService.login(input));
      } catch (err) { next(err); }
    },

    async me(req, res, next) {
      try {
        res.json({ user: await authService.getCurrentUser(req.userId) });
      } catch (err) { next(err); }
    },

    /**
     * Token strategy: stateless JWT access token sent as a Bearer header.
     * There is no server-side session to destroy, so logout is completed by
     * the client discarding the token. This endpoint validates the caller's
     * token and gives clients a single, explicit call to make.
     */
    logout(_req, res) {
      res.status(200).json({ message: 'Logged out. Discard the access token on the client.' });
    },
  };
}
