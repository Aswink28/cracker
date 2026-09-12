import mongoose from 'mongoose';

/**
 * Configuration for the homepage offers strip.
 *
 * Held as a single document rather than a keyed collection: the strip is one
 * component with one configuration, so a key would add a lookup and buy
 * nothing. The service upserts it, which means a fresh database needs no
 * migration or seed step for the strip to work.
 */
const stripSettingsSchema = new mongoose.Schema(
  {
    // Off removes the strip from the homepage completely - no bar, no fallback.
    enabled: { type: Boolean, default: true },
    // Off stops products carrying a real discount from being listed
    // automatically, leaving only the messages written in the admin panel.
    showProductOffers: { type: Boolean, default: true },
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

export const StripSettings = mongoose.model('StripSettings', stripSettingsSchema);
export default StripSettings;
