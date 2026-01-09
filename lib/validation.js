// OWASP: Strict input validation & sanitization
// - Schema-based validation via Zod
// - Type checks, length limits, exact field sets (reject unexpected)
// - Trim & normalize string inputs

import { z } from 'zod';

// Reusable primitives
const trimmedString = (max) => z.string().min(1).max(max).transform((s) => s.trim());
const optionalTrimmed = (max) => z.string().max(max).transform((s) => s.trim()).optional();

// Email and URL validators
const emailSchema = z.string().email().max(254).transform((s) => s.toLowerCase().trim());
const urlSchema = z.string().url().max(2048);

// Authentication
export const loginBody = z
  .object({
    email: emailSchema,
    password: z.string().min(8).max(128),
  })
  .strict();

export const signupBody = z
  .object({
    name: trimmedString(80),
    email: emailSchema,
    password: z.string().min(8).max(128),
  })
  .strict();

// Profile update
export const profileUpdateBody = z
  .object({
    name: trimmedString(80),
    email: emailSchema,
    currentPassword: z.string().min(8).max(128).optional(),
    newPassword: z
      .string()
      .min(8)
      .max(128)
      .regex(/(?=.*[a-z])/, 'Must contain lowercase letter')
      .regex(/(?=.*[A-Z])/, 'Must contain uppercase letter')
      .regex(/(?=.*\d)/, 'Must contain a number')
      .regex(/(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/, 'Must contain a special character')
      .optional(),
  })
  .strict();

// Reports
export const reportCreateBody = z
  .object({
    jobTitle: trimmedString(120),
    company: trimmedString(120),
    jobLink: z.string().url().max(2048).optional(),
    description: trimmedString(5000),
    contactEmail: emailSchema.optional(),
  })
  .strict();

export const reportScamBody = z
  .object({
    jobTitle: trimmedString(120),
    company: trimmedString(120),
    url: urlSchema,
    reason: trimmedString(2000),
    analysis: z.any().optional(),
  })
  .strict();

// Jobs analyze
export const analyzeMethodBody = z
  .object({
    method: z.enum(['manual', 'linkonly', 'link', 'linkedin', 'url']),
    url: urlSchema.optional(),
    jobTitle: optionalTrimmed(160),
    company: optionalTrimmed(160),
    location: optionalTrimmed(160),
    salary: optionalTrimmed(160),
    description: optionalTrimmed(8000),
    requirements: optionalTrimmed(8000),
    contactEmail: emailSchema.optional(),
    applicationUrl: urlSchema.optional(),
  })
  .strict();

// Extension job
export const extensionJobBody = z
  .object({
    title: trimmedString(160),
    company: trimmedString(160),
    description: trimmedString(10000),
    sourceURL: urlSchema,
    location: optionalTrimmed(160),
    salary: optionalTrimmed(160),
    jobType: optionalTrimmed(80),
    experienceLevel: optionalTrimmed(80),
    companySize: optionalTrimmed(80),
    requirements: optionalTrimmed(8000),
    qualifications: optionalTrimmed(8000),
    benefits: optionalTrimmed(8000),
    jobInsights: optionalTrimmed(4000),
    applicationDeadline: optionalTrimmed(120),
    postedDate: optionalTrimmed(120),
    contactInfo: optionalTrimmed(254),
    applicationInstructions: optionalTrimmed(4000),
  })
  .strict();

// My reports delete
export const myReportsDeleteBody = z
  .object({
    type: z.enum(['job', 'report']),
    id: trimmedString(64),
  })
  .strict();

/**
 * Safely parse and sanitize JSON request body using a Zod schema.
 * - Rejects unknown fields (strict schemas)
 * - Provides consistent 400 responses on validation failure
 */
export async function parseJsonOrError(req, schema) {
  try {
    const data = await req.json();
    const parsed = schema.parse(data);
    return { ok: true, data: parsed };
  } catch (err) {
    const message = err?.message || 'Invalid request payload';
    return {
      ok: false,
      response: new Response(
        JSON.stringify({ error: 'Bad Request', message }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }
}
