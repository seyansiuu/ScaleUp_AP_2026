import { z } from 'zod';

// Emails are trimmed and lower-cased so "Foo@X.com " and "foo@x.com"
// are always the same account.
const email = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .email('Invalid email address')
  .max(254);

export const registerSchema = z.object({
  name: z.string({ required_error: 'Name is required' }).trim().min(1, 'Name is required').max(100),
  email,
  // bcrypt only uses the first 72 bytes, so cap the length to avoid silent truncation.
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),
});

// Login deliberately does NOT enforce the registration password policy,
// so accounts created under older rules can still sign in.
export const loginSchema = z.object({
  email,
  password: z
    .string({ required_error: 'Password is required' })
    .min(1, 'Password is required')
    .max(72, 'Invalid credentials'),
});
