import { createHash, timingSafeEqual as nodeTimingSafeEqual } from 'node:crypto';
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

/**
 * Cache invalidation webhook, called by the Express API after an admin write.
 *
 * This is what keeps server-rendered catalogue pages both fast and correct:
 * pages are cached indefinitely by tag, and this endpoint is the only thing
 * that clears them.
 *
 * Authentication is a shared secret compared in constant time. Without it,
 * anyone could force the storefront to re-fetch the entire catalogue on demand.
 */
const MAX_TAGS = 20;

export async function POST(request) {
  const secret = process.env.NEXT_REVALIDATE_SECRET;

  if (!secret) {
    console.error('Revalidate: NEXT_REVALIDATE_SECRET is not configured');
    return NextResponse.json(
      { success: false, message: 'Revalidation is not configured' },
      { status: 503 },
    );
  }

  const provided = request.headers.get('x-revalidate-secret') ?? '';

  if (!timingSafeEqual(provided, secret)) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: 'Invalid JSON body' }, { status: 400 });
  }

  const tags = Array.isArray(body?.tags) ? body.tags : [body?.tag];
  const valid = tags
    .filter((tag) => typeof tag === 'string' && tag.length > 0 && tag.length <= 120)
    .slice(0, MAX_TAGS);

  if (valid.length === 0) {
    return NextResponse.json(
      { success: false, message: 'Provide at least one tag' },
      { status: 400 },
    );
  }

  for (const tag of valid) {
    revalidateTag(tag);
  }

  return NextResponse.json({ success: true, revalidated: valid });
}

/**
 * Constant-time secret comparison.
 *
 * Comparing with === would leak the secret's matching prefix through response
 * timing. Both sides are hashed to a fixed 32 bytes first so crypto's
 * timingSafeEqual - which throws on length mismatch - can be used safely
 * whatever the caller sends.
 */
function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;

  const hashA = createHash('sha256').update(a).digest();
  const hashB = createHash('sha256').update(b).digest();

  return nodeTimingSafeEqual(hashA, hashB);
}
