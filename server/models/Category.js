import mongoose from 'mongoose';
import { slugify } from '../utils/slugify.js';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [80, 'Category name cannot exceed 80 characters'],
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
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    image: {
      url: { type: String, trim: true, default: '' },
      publicId: { type: String, trim: true, default: '' },
      width: { type: Number, default: 600 },
      height: { type: Number, default: 600 },
      alt: { type: String, trim: true, default: '' },
    },
    // Controls the order categories appear in the mobile scroller and nav.
    displayOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true, index: true },
    keywords: {
      type: [String],
      default: [],
      set: (values) =>
        Array.isArray(values)
          ? [...new Set(values.map((v) => String(v).trim().toLowerCase()).filter(Boolean))]
          : [],
    },
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

categorySchema.index({ active: 1, displayOrder: 1, name: 1 });

// Mongoose 9 document middleware is promise-based - hooks return instead of
// calling a `next` callback.
categorySchema.pre('validate', function ensureSlug() {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name);
  }
});

export const Category = mongoose.model('Category', categorySchema);
export default Category;
