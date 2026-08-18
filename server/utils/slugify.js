// Combining diacritical marks, written as an escape range so the source file
// stays readable in any editor and cannot be mangled by encoding changes.
const COMBINING_MARKS = /[̀-ͯ]/g;

/**
 * Turn a product or category name into a URL-safe slug.
 * Kept dependency-free: the transformation is small and predictable, and the
 * catalogue only ever slugifies latin-script product names.
 */
export function slugify(input) {
  return String(input ?? '')
    .normalize('NFKD')
    .replace(COMBINING_MARKS, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90)
    .replace(/-+$/g, '');
}

/**
 * Build a slug that does not collide with an existing document.
 * Appends -2, -3, ... until free. `excludeId` lets an edit keep its own slug.
 */
export async function uniqueSlug(Model, name, excludeId = null) {
  const base = slugify(name) || 'item';
  let candidate = base;
  let suffix = 1;

  // Bounded loop: 200 identically named products is far past anything realistic,
  // and an unbounded while(true) against the DB is a hang waiting to happen.
  for (let attempt = 0; attempt < 200; attempt += 1) {
    const query = { slug: candidate };
    if (excludeId) query._id = { $ne: excludeId };

    const existing = await Model.exists(query);
    if (!existing) return candidate;

    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  // Fall back to a timestamp rather than throwing; a slightly ugly slug beats
  // a failed product save.
  return `${base}-${Date.now()}`;
}

export default slugify;
