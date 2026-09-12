import { StripSettings } from '../models/StripSettings.js';

/**
 * Both default to on, so a shop that never opens this screen keeps exactly the
 * behaviour it had before the setting existed.
 */
const DEFAULTS = { enabled: true, showProductOffers: true };

export async function getStripSettings() {
  const settings = await StripSettings.findOneAndUpdate(
    {},
    { $setOnInsert: DEFAULTS },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  ).lean();

  return serialise(settings);
}

export async function updateStripSettings(payload) {
  // MongoDB rejects an update that names the same field in $set and
  // $setOnInsert, so only the fields the caller did not send are seeded.
  const seed = Object.fromEntries(
    Object.entries(DEFAULTS).filter(([field]) => !(field in payload)),
  );

  const update = { $set: payload };
  if (Object.keys(seed).length > 0) update.$setOnInsert = seed;

  const settings = await StripSettings.findOneAndUpdate({}, update, {
    upsert: true,
    new: true,
    runValidators: true,
  }).lean();

  return serialise(settings);
}

function serialise(doc) {
  if (!doc) return { ...DEFAULTS };
  const { _id, __v, createdAt, ...rest } = doc;
  return { ...DEFAULTS, ...rest };
}
