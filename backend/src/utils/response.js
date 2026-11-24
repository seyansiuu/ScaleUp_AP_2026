export const successResponse = (data) => ({ success: true, data });
export const errorResponse = (message, details) => ({
  success: false,
  error: { message, ...(details ? { details } : {}) },
});
