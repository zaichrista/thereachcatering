import { z } from 'zod';

export const DIETARY_TAGS = ['vegan', 'vegetarian', 'gluten_free', 'dairy_free', 'nut_free', 'halal'];
export const EVENT_TYPES = ['wedding', 'corporate', 'private_party', 'birthday', 'festival', 'other'];
export const INQUIRY_STATUSES = ['new', 'contacted', 'quoted', 'booked', 'declined', 'archived'];

const text = (max) => z.string().trim().max(max);
const optText = (max) =>
  text(max)
    .transform((s) => s || null)
    .nullish();
const sort = z.number().int().min(0).max(100000);
const cents = z.number().int().min(0).max(100_000_00).nullable();
const url = z.url({ protocol: /^https?$/ }).max(500).nullable();

export const categorySchema = z.object({
  name: text(100).min(1),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).max(100).optional(),
  description: optText(500),
  sort_order: sort.optional(),
});

export const menuItemSchema = z.object({
  category_id: z.number().int().positive(),
  name: text(150).min(1),
  description: optText(1000),
  price_cents: cents.optional(),
  dietary: z.array(z.enum(DIETARY_TAGS)).max(DIETARY_TAGS.length).optional(),
  image_url: url.optional(),
  is_available: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  sort_order: sort.optional(),
});

export const packageSchema = z.object({
  name: text(100).min(1),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).max(100).optional(),
  description: optText(2000),
  price_per_head_cents: cents.optional(),
  min_guests: z.number().int().min(1).max(5000).optional(),
  includes: z.array(text(200).min(1)).max(50).optional(),
  image_url: url.optional(),
  is_active: z.boolean().optional(),
  sort_order: sort.optional(),
});

export const testimonialSchema = z.object({
  author: text(100).min(1),
  event_type: optText(50),
  quote: text(1000).min(1),
  is_published: z.boolean().optional(),
  sort_order: sort.optional(),
});

const today = () => new Date().toISOString().slice(0, 10);

export const inquiryInputSchema = z.object({
  name: text(100).min(1),
  email: z.email().max(200),
  phone: optText(40),
  event_type: z.enum(EVENT_TYPES),
  event_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD')
    .refine((d) => !Number.isNaN(Date.parse(d)), 'Invalid date')
    .refine((d) => d >= today(), 'Event date must be today or later'),
  guest_count: z.number().int().min(1).max(5000),
  venue: optText(200),
  budget: optText(100),
  package_id: z.number().int().positive().nullish(),
  dietary_notes: optText(1000),
  message: optText(3000),
  // Honeypot: real users never see or fill this field.
  website: z.string().max(200).optional(),
});

export const inquiryUpdateSchema = z.object({
  status: z.enum(INQUIRY_STATUSES).optional(),
  admin_notes: optText(5000),
});

export const contactInputSchema = z.object({
  name: text(100).min(1),
  email: z.email().max(200),
  subject: optText(200),
  message: text(3000).min(1),
  website: z.string().max(200).optional(),
});

export const loginSchema = z.object({
  email: z.email().max(200),
  password: z.string().min(1).max(200),
});

export const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
