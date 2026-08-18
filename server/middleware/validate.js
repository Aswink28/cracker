import { ApiError } from '../utils/ApiError.js';

/**
 * Validate part of a request against a Zod schema and replace it with the
 * parsed result, so controllers receive coerced, whitelisted data.
 *
 * Replacing `req.body`/`req.params` with the parsed output is what prevents
 * NoSQL operator injection: a `{ "$ne": null }` payload cannot survive a
 * schema that declares the field as a string.
 *
 * `req.query` is a lazy getter in Express 5 and cannot be assigned, so the
 * parsed query is exposed as `req.validatedQuery` instead.
 */
export function validate(schemas) {
  return (req, _res, next) => {
    const issues = [];

    for (const source of ['body', 'params', 'query']) {
      const schema = schemas[source];
      if (!schema) continue;

      const result = schema.safeParse(req[source] ?? {});

      if (!result.success) {
        for (const issue of result.error.issues) {
          issues.push({
            field: [source, ...issue.path].join('.'),
            message: issue.message,
          });
        }
        continue;
      }

      if (source === 'query') {
        req.validatedQuery = result.data;
      } else {
        req[source] = result.data;
      }
    }

    if (issues.length > 0) {
      return next(ApiError.badRequest('Validation failed', issues));
    }

    return next();
  };
}

export default validate;
