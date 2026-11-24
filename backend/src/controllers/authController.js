import * as authService from '../services/authService.js';
import { successResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const register = asyncHandler(async (req, res) => {
  res.status(201).json(successResponse(await authService.register(req.body)));
});

export const login = asyncHandler(async (req, res) => {
  res.json(successResponse(await authService.login(req.body)));
});
