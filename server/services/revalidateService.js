import config from '../config/env.js';

/**
 * Tell the Next.js storefront that catalogue data changed.
 *
 * This is what makes the server-rendered pages feel live: the storefront caches
 * catalogue responses indefinitely by tag, and this call is the invalidation
 * signal. Without it an edited price would sit stale until the time-based
 * revalidation window elapsed.
 *
 * Failures are logged and swallowed. A storefront that is down, redeploying or
 * misconfigured must never turn a successful product save into a 500 for the
 * admin - the data is already committed, only the cache is behind.
 */
export async function revalidateStorefront(tags) {
  if (!config.revalidateEnabled) return { skipped: true };

  const list = Array.isArray(tags) ? tags.filter(Boolean) : [tags].filter(Boolean);
  if (list.length === 0) return { skipped: true };

  try {
    const response = await fetch(config.REVALIDATE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': config.REVALIDATE_SECRET,
      },
      body: JSON.stringify({ tags: list }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.warn(`Storefront revalidation returned ${response.status}`);
      return { ok: false, status: response.status };
    }

    return { ok: true };
  } catch (error) {
    console.warn('Storefront revalidation failed:', error.message);
    return { ok: false, error: error.message };
  }
}

export default revalidateStorefront;
