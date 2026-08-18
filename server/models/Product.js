import mongoose from 'mongoose';
import { slugify } from '../utils/slugify.js';

/**
 * Images are stored as an object rather than a bare URL string so every
 * rendered <Image> can be given explicit width/height. Without intrinsic
 * dimensions the product grid shifts as images arrive, which is the single
 * easiest way to fail Cumulative Layout Shift on a catalogue page.
 */
const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, trim: true, default: '' },
    width: { type: Number, default: 800 },
    height: { type: Number, default: 800 },
    alt: { type: String, trim: true, default: '' },
  },
  { _id: false },
);

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [140, 'Product name cannot exceed 140 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [4000, 'Description cannot exceed 4000 characters'],
      default: '',
    },
    // Short one-liner used for meta descriptions and card subtitles.
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [200, 'Short description cannot exceed 200 characters'],
      default: '',
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product category is required'],
      index: true,
    },
    image: {
      type: imageSchema,
      default: null,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    offerPrice: {
      type: Number,
      min: [0, 'Offer price cannot be negative'],
      default: null,
      validate: {
        validator(value) {
          // null means "no offer"; otherwise it must not exceed the list price.
          if (value === null || value === undefined) return true;
          // Update validators run in query context where `this` is not the
          // document, so `price` is unavailable. Skip here and let
          // productService.updateProduct do the cross-field check against the
          // merged values - otherwise a valid offerPrice-only edit would fail.
          if (typeof this?.price !== 'number') return true;
          return value <= this.price;
        },
        message: 'Offer price must be less than or equal to the regular price',
      },
    },
    // Derived from price/offerPrice on save. Stored (not computed per request)
    // so the catalogue can sort and filter on discount without a $expr scan.
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    unit: {
      type: String,
      trim: true,
      default: '',
      maxlength: [40, 'Unit cannot exceed 40 characters'],
    },
    featured: { type: Boolean, default: false, index: true },
    active: { type: Boolean, default: true, index: true },
    inStock: { type: Boolean, default: true },
    keywords: {
      type: [String],
      default: [],
      set: (values) =>
        Array.isArray(values)
          ? [...new Set(values.map((v) => String(v).trim().toLowerCase()).filter(Boolean))]
          : [],
    },
    // Drives the "Popular" sort. Incremented by the catalogue, not user-editable.
    popularity: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(_doc, ret) {
        ret.id = ret._id?.toString?.() ?? ret._id;
        delete ret._id;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);

/** The price a customer actually pays. */
productSchema.virtual('effectivePrice').get(function effectivePrice() {
  return this.offerPrice != null && this.offerPrice < this.price ? this.offerPrice : this.price;
});

// Compound indexes matching the real query shapes used by the catalogue.
// Each begins with `active` because every public query filters on it.
productSchema.index({ active: 1, featured: -1, createdAt: -1 });
productSchema.index({ active: 1, category: 1, createdAt: -1 });
productSchema.index({ active: 1, price: 1 });
productSchema.index({ active: 1, discountPercentage: -1 });
productSchema.index({ active: 1, popularity: -1 });

// Weighted text index powers server-side search. Name matches outrank keyword
// matches, which outrank description matches.
productSchema.index(
  { name: 'text', keywords: 'text', shortDescription: 'text', description: 'text' },
  {
    weights: { name: 10, keywords: 6, shortDescription: 3, description: 1 },
    name: 'product_search_index',
  },
);

// Mongoose 9 document middleware is promise-based - hooks return instead of
// calling a `next` callback.
productSchema.pre('validate', function ensureSlug() {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }
});

productSchema.pre('save', function computeDiscount() {
  const hasOffer = this.offerPrice != null && this.price > 0 && this.offerPrice < this.price;
  this.discountPercentage = hasOffer
    ? Math.round(((this.price - this.offerPrice) / this.price) * 100)
    : 0;
});

// findOneAndUpdate bypasses the `save` hook, so the same derivation has to be
// mirrored here or an edited price would keep a stale discount badge.
productSchema.pre('findOneAndUpdate', async function computeDiscountOnUpdate() {
  const update = this.getUpdate();
  if (!update) return;

  const $set = update.$set ?? update;
  const touchesPricing = 'price' in $set || 'offerPrice' in $set;
  if (!touchesPricing) return;

  const current = await this.model.findOne(this.getQuery()).select('price offerPrice').lean();
  if (!current) return;

  const price = $set.price ?? current.price;
  const offerPrice = 'offerPrice' in $set ? $set.offerPrice : current.offerPrice;
  const hasOffer = offerPrice != null && price > 0 && offerPrice < price;

  $set.discountPercentage = hasOffer
    ? Math.round(((price - offerPrice) / price) * 100)
    : 0;

  if (update.$set) update.$set = $set;
  this.setUpdate(update);
});

export const Product = mongoose.model('Product', productSchema);
export default Product;
