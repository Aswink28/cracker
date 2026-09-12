import { z } from 'zod';

/** A 24-character hex Mongo ObjectId. */
export const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid id');

export const slugParam = z.object({
  slug: z
    .string()
    .min(1)
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Invalid slug'),
});

export const idParam = z.object({ id: objectId });

/** Query strings arrive as strings, so booleans and numbers are coerced. */
const booleanish = z
  .union([z.boolean(), z.enum(['true', 'false', '1', '0'])])
  .transform((v) => v === true || v === 'true' || v === '1');

export const productListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(20),
  search: z.string().trim().max(120).optional(),
  category: z
    .string()
    .trim()
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Invalid category slug')
    .optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z
    .enum(['popular', 'price-asc', 'price-desc', 'newest', 'discount', 'name'])
    .default('popular'),
  featured: booleanish.optional(),
  onOffer: booleanish.optional(),
  inStock: booleanish.optional(),
  // Admin-only; ignored for public requests by the controller.
  includeInactive: booleanish.optional(),
  active: booleanish.optional(),
});

const imageInput = z
  .object({
    url: z.string().url('Image URL must be a valid URL'),
    publicId: z.string().max(300).optional().default(''),
    width: z.coerce.number().int().positive().optional().default(800),
    height: z.coerce.number().int().positive().optional().default(800),
    alt: z.string().max(200).optional().default(''),
  })
  .nullable()
  .optional();

const productFields = {
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(140),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, 'Slug may contain lowercase letters, numbers and hyphens only')
    .max(120)
    .optional(),
  description: z.string().trim().max(4000).optional().default(''),
  shortDescription: z.string().trim().max(200).optional().default(''),
  category: objectId,
  image: imageInput,
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  offerPrice: z.coerce.number().min(0).nullable().optional(),
  unit: z.string().trim().max(40).optional().default(''),
  featured: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
  inStock: z.boolean().optional().default(true),
  keywords: z.array(z.string().trim().max(60)).max(30).optional().default([]),
  popularity: z.coerce.number().int().min(0).optional(),
};

/**
 * Offer price above the regular price is the one cross-field rule worth
 * enforcing here, so the admin form gets a precise message instead of a
 * generic Mongoose validation error.
 */
const offerPriceRefinement = (data, ctx) => {
  if (
    data.offerPrice != null &&
    data.price != null &&
    data.offerPrice > data.price
  ) {
    ctx.addIssue({
      code: 'custom',
      path: ['offerPrice'],
      message: 'Offer price cannot be higher than the regular price',
    });
  }
};

export const createProductBody = z
  .object(productFields)
  .strict()
  .superRefine(offerPriceRefinement);

export const updateProductBody = z
  .object(productFields)
  .partial()
  .strict()
  .superRefine(offerPriceRefinement)
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

const categoryFields = {
  name: z.string().trim().min(2).max(80),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, 'Slug may contain lowercase letters, numbers and hyphens only')
    .max(120)
    .optional(),
  description: z.string().trim().max(1000).optional().default(''),
  image: imageInput,
  displayOrder: z.coerce.number().int().optional().default(0),
  active: z.boolean().optional().default(true),
  keywords: z.array(z.string().trim().max(60)).max(30).optional().default([]),
};

export const createCategoryBody = z.object(categoryFields).strict();

export const updateCategoryBody = z
  .object(categoryFields)
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

/**
 * Icon names must match the storefront's icon map. Keeping this an enum rather
 * than a free string means an admin cannot save a name that renders nothing.
 */
const announcementFields = {
  text: z.string().trim().min(2, 'Enter the message to display').max(160),
  icon: z.enum(['megaphone', 'tag', 'sparkles', 'gift', 'truck', 'percent']),
  displayOrder: z.coerce.number().int(),
  active: z.boolean(),
};

/** Defaults belong to creation only - see updateAnnouncementBody. */
export const createAnnouncementBody = z
  .object({
    text: announcementFields.text,
    icon: announcementFields.icon.optional().default('megaphone'),
    displayOrder: announcementFields.displayOrder.optional().default(0),
    active: announcementFields.active.optional().default(true),
  })
  .strict();

/**
 * A partial update must contain only what the caller actually sent.
 *
 * `.partial()` makes keys optional but does NOT drop `.default()`, so defining
 * the fields with defaults would make `{ text }` parse to a full object and
 * $set would silently reset icon, order and visibility. The fields above are
 * therefore declared without defaults, and creation adds them explicitly.
 */
export const updateAnnouncementBody = z
  .object(announcementFields)
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one field to update',
  });

/** Strip-level switches. No defaults here, for the reason above. */
export const stripSettingsBody = z
  .object({
    enabled: z.boolean(),
    showProductOffers: z.boolean(),
  })
  .partial()
  .strict()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Provide at least one setting to update',
  });

export const loginBody = z
  .object({
    email: z.string().trim().toLowerCase().email('Enter a valid email address'),
    password: z.string().min(1, 'Password is required').max(200),
  })
  .strict();

/**
 * Indian mobile numbers, with or without the +91 country code.
 * Kept deliberately permissive about spacing since customers type freely.
 */
const mobile = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-()]/g, ''))
  .refine((value) => /^(\+?91)?[6-9]\d{9}$/.test(value), {
    message: 'Enter a valid 10-digit Indian mobile number',
  });

export const orderEnquiryBody = z
  .object({
    customerName: z.string().trim().min(2, 'Please enter your name').max(100),
    mobile,
    orderType: z.enum(['pickup', 'delivery']),
    address: z.string().trim().max(500).optional().default(''),
    message: z.string().trim().max(1000).optional().default(''),
    items: z
      .array(
        z.object({
          product: objectId.nullable().optional(),
          name: z.string().trim().min(1).max(140),
          slug: z.string().trim().max(120).optional().default(''),
          unitPrice: z.coerce.number().min(0),
          quantity: z.coerce.number().int().min(1).max(999),
        }),
      )
      .min(1, 'Your cart is empty')
      .max(200),
  })
  .strict()
  .refine((data) => data.orderType !== 'delivery' || data.address.trim().length >= 10, {
    path: ['address'],
    message: 'A delivery address is required for delivery orders',
  });
