import * as startupService from '../services/startupService.js';
import { serializeBigInts } from '../utils/money.js';
import { successResponse } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req, res) => {
  res.json(successResponse(serializeBigInts(await startupService.listStartups(req.userId))));
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json(successResponse(serializeBigInts(await startupService.createStartup(req.userId, req.body))));
});

export const get = asyncHandler(async (req, res) => {
  res.json(successResponse(serializeBigInts(await startupService.getStartup(req.userId, req.params.id))));
});

export const advance = asyncHandler(async (req, res) => {
  const key = req.get('Idempotency-Key');
  if (!key) {
    const error = new Error('Idempotency-Key header is required');
    error.status = 400;
    throw error;
  }
  const result = await startupService.advanceTurn(req.userId, req.params.id, key, req.body);
  res.json(successResponse(result));
});
