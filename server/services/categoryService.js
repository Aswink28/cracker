import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { uniqueSlug } from '../utils/slugify.js';

/**
 * All categories, each with a live count of its active products.
 *
 * The counts come from a single grouped aggregation rather than one
 * countDocuments per category - with 10 categories that is the difference
 * between 1 round trip and 11.
 */
export async function listCategories({ includeInactive = false, withCounts = true } = {}) {
  const filter = includeInactive ? {} : { active: true };

  const categories = await Category.find(filter)
    .sort({ displayOrder: 1, name: 1 })
    .lean();

  if (!withCounts || categories.length === 0) {
    return categories.map((c) => serialise(c, 0));
  }

  const counts = await Product.aggregate([
    { $match: { active: true, category: { $in: categories.map((c) => c._id) } } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);

  const countByCategory = new Map(counts.map((row) => [row._id.toString(), row.count]));

  return categories.map((c) => serialise(c, countByCategory.get(c._id.toString()) ?? 0));
}

export async function getCategoryBySlug(slug, { includeInactive = false } = {}) {
  const filter = { slug };
  if (!includeInactive) filter.active = true;

  const category = await Category.findOne(filter).lean();
  if (!category) throw ApiError.notFound('Category not found');

  const productCount = await Product.countDocuments({ active: true, category: category._id });
  return serialise(category, productCount);
}

export async function getCategoryById(id) {
  const category = await Category.findById(id).lean();
  if (!category) throw ApiError.notFound('Category not found');
  return serialise(category, 0);
}

export async function listCategorySlugs() {
  const categories = await Category.find({ active: true }).select('slug updatedAt').lean();
  return categories.map((c) => ({ slug: c.slug, updatedAt: c.updatedAt }));
}

export async function createCategory(payload) {
  const slug = await uniqueSlug(Category, payload.slug || payload.name);
  const category = await Category.create({ ...payload, slug });
  return serialise(category.toObject(), 0);
}

export async function updateCategory(id, payload) {
  const existing = await Category.findById(id);
  if (!existing) throw ApiError.notFound('Category not found');

  const update = { ...payload };

  // As with products, an existing slug is only changed when explicitly asked,
  // so category URLs stay stable once indexed.
  if (payload.slug && payload.slug !== existing.slug) {
    update.slug = await uniqueSlug(Category, payload.slug, id);
  } else {
    delete update.slug;
  }

  const category = await Category.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true, runValidators: true },
  ).lean();

  return serialise(category, 0);
}

/**
 * Categories are never deleted out from under their products, because that
 * would leave products unreachable from the catalogue with a dangling ref.
 * The caller must move or delete the products first.
 */
export async function deleteCategory(id) {
  const productCount = await Product.countDocuments({ category: id });
  if (productCount > 0) {
    throw ApiError.conflict(
      `This category still has ${productCount} product(s). Move or delete them first.`,
    );
  }

  const category = await Category.findByIdAndDelete(id).lean();
  if (!category) throw ApiError.notFound('Category not found');

  return { id, imagePublicId: category.image?.publicId ?? null };
}

function serialise(doc, productCount) {
  if (!doc) return doc;
  const { _id, __v, ...rest } = doc;
  return {
    id: _id?.toString?.() ?? _id,
    ...rest,
    productCount,
  };
}
