/**
 * Emit a Schema.org JSON-LD block.
 *
 * The payload is serialised with `<` escaped so a product name or description
 * containing markup cannot break out of the script tag - the standard XSS
 * vector for JSON-LD injected via dangerouslySetInnerHTML.
 */
export default function JsonLd({ data }) {
  if (!data) return null;

  const payload = JSON.stringify(Array.isArray(data) ? data : [data]).replace(
    /</g,
    '\\u003c',
  );

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger -- JSON-LD has no other injection point.
      dangerouslySetInnerHTML={{ __html: payload }}
    />
  );
}
