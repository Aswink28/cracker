import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import { ApiError } from '../utils/ApiError.js';
import { uniqueSlug } from '../utils/slugify.js';

/**
 * Fields returned for list/grid views.
 *
 * The long `description` is deliberately excluded: with 20 products per page
 * it is the single largest contributor to response size and nothing in the
 * grid renders it. Detail views fetch the full document.
 */
const LIST_FIELDS = [
  'name',
  'slug',
  'shortDescription',
  'category',
  'image',
  'price',
  'offerPrice',
  'discountPercentage',
  'unit',
  'featured',
  'active',
  'inStock',
  'createdAt',
];

const LIST_PROJECTION = Object.fromEntries(LIST_FIELDS.map((field) => [field, 1]));

const SORT_MAP = {
  popular: { popularity: -1, createdAt: -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  newest: { createdAt: -1 },
  discount: { discountPercentage: -1, createdAt: -1 },
  name: { name: 1 },
};

/**
 * Build the Mongo filter for a catalogue query.
 * `includeInactive` is only ever true for admin requests.
 */
function buildFilter(params, { includeInactive = false } = {}) {
  const filter = {};

  if (!includeInactive) {
    filter.active = true;
  } else if (typeof params.active === 'boolean') {
    filter.active = params.active;
  }

  if (params.categoryId) filter.category = params.categoryId;
  if (typeof params.featured === 'boolean') filter.featured = params.featured;
  if (params.onOffer) filter.discountPercentage = { $gt: 0 };
  if (params.inStock === true) filter.inStock = true;

  if (params.minPrice != null || params.maxPrice != null) {
    filter.price = {};
    if (params.minPrice != null) filter.price.$gte = params.minPrice;
    if (params.maxPrice != null) filter.price.$lte = params.maxPrice;
  }

  if (params.search) {
    filter.$text = { $search: params.search };
  }

  return filter;
}

/**
 * Paginated product listing.
 *
 * Runs the count and the page fetch concurrently - they are independent, and
 * serialising them would double the latency of every catalogue request.
 */
export async function listProducts(params = {}, options = {}) {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(60, Math.max(1, params.limit ?? 20));
  const skip = (page - 1) * limit;

  let categoryId = params.categoryId ?? null;

  // Callers filter by human-readable slug; resolve it to an id once.
  if (params.categorySlug) {
    const category = await Category.findOne({ slug: params.categorySlug })
      .select('_id')
      .lean();
    if (!category) {
      return { products: [], page, limit, total: 0, totalPages: 0 };
    }
    categoryId = category._id;
  }

  const filter = buildFilter({ ...params, categoryId }, options);

  // When a search term is present, relevance leads and the requested sort acts
  // as a tiebreaker. `score` must be projected for Mongo to sort on it.
  const projection = params.search
    ? { ...LIST_PROJECTION, score: { $meta: 'textScore' } }
    : LIST_PROJECTION;

  const sort = params.search
    ? { score: { $meta: 'textScore' }, ...(SORT_MAP[params.sort] ?? {}) }
    : (SORT_MAP[params.sort] ?? SORT_MAP.popular);

  const query = Product.find(filter, projection)
    .populate('category', 'name slug')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  // Count and page fetch are independent; running them together halves latency.
  const [products, total] = await Promise.all([
    query.exec(),
    Product.countDocuments(filter),
  ]);

  return {
    products: products.map(serialise),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getProductBySlug(slug, { includeInactive = false } = {}) {
  const filter = { slug };
  if (!includeInactive) filter.active = true;

  const product = await Product.findOne(filter)
    .populate('category', 'name slug description')
    .lean();

  if (!product) throw ApiError.notFound('Product not found');
  return serialise(product);
}

export async function getProductById(id, { includeInactive = true } = {}) {
  const filter = { _id: id };
  if (!includeInactive) filter.active = true;

  const product = await Product.findOne(filter)
    .populate('category', 'name slug description')
    .lean();

  if (!product) throw ApiError.notFound('Product not found');
  return serialise(product);
}

/**
 * Products shown under "You may also like" on a detail page.
 * Same category, excluding the product itself.
 */
export async function getRelatedProducts(product, limit = 8) {
  const categoryId = product.category?.id ?? product.category?._id ?? product.category;
  if (!categoryId) return [];

  const related = await Product.find({
    active: true,
    category: categoryId,
    _id: { $ne: product.id ?? product._id },
  })
    .select(LIST_PROJECTION)
    .populate('category', 'name slug')
    .sort({ popularity: -1, createdAt: -1 })
    .limit(limit)
    .lean();

  return related.map(serialise);
}

/** Every active slug, for sitemap generation. Intentionally tiny. */
export async function listProductSlugs() {
  const products = await Product.find({ active: true })
    .select('slug updatedAt')
    .sort({ updatedAt: -1 })
    .lean();

  return products.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt }));
}

export async function createProduct(payload) {
  await assertCategoryExists(payload.category);

  const slug = payload.slug
    ? await uniqueSlug(Product, payload.slug)
    : await uniqueSlug(Product, payload.name);

  const product = await Product.create({ ...payload, slug });
  return getProductById(product._id);
}

export async function updateProduct(id, payload) {
  const existing = await Product.findById(id);
  if (!existing) throw ApiError.notFound('Product not found');

  if (payload.category) await assertCategoryExists(payload.category);

  // Cross-field pricing check against the merged result. A partial update may
  // carry only one of the two fields, so neither the Zod schema nor Mongoose's
  // query-context update validators can see both values - this is the one
  // place that reliably can.
  const nextPrice = payload.price ?? existing.price;
  const nextOfferPrice =
    'offerPrice' in payload ? payload.offerPrice : existing.offerPrice;

  if (nextOfferPrice != null && nextOfferPrice > nextPrice) {
    throw ApiError.badRequest('Validation failed', [
      {
        field: 'offerPrice',
        message: `Offer price cannot be higher than the regular price (${nextPrice})`,
      },
    ]);
  }

  const update = { ...payload };

  // Only regenerate the slug when explicitly asked. Silently changing a slug
  // because the name was edited would break every indexed URL and inbound link.
  if (payload.slug && payload.slug !== existing.slug) {
    update.slug = await uniqueSlug(Product, payload.slug, id);
  } else {
    delete update.slug;
  }

  const product = await Product.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true, runValidators: true },
  );

  return getProductById(product._id);
}

export async function deleteProduct(id) {
  const product = await Product.findByIdAndDelete(id).lean();
  if (!product) throw ApiError.notFound('Product not found');
  return { id, imagePublicId: product.image?.publicId ?? null };
}

async function assertCategoryExists(categoryId) {
  const exists = await Category.exists({ _id: categoryId });
  if (!exists) throw ApiError.badRequest('The selected category does not exist');
}

/**
 * Shape a lean document into the response contract the frontend expects.
 * Lean queries skip Mongoose's toJSON transform, so it is applied here.
 */
function serialise(doc) {
  if (!doc) return doc;
  const { _id, __v, score, category, ...rest } = doc;

  return {
    id: _id?.toString?.() ?? _id,
    ...rest,
    category:
      category && typeof category === 'object' && category._id
        ? {
            id: category._id.toString(),
            name: category.name,
            slug: category.slug,
            ...(category.description ? { description: category.description } : {}),
          }
        : (category?.toString?.() ?? category ?? null),
    effectivePrice:
      rest.offerPrice != null && rest.offerPrice < rest.price ? rest.offerPrice : rest.price,
  };
}
