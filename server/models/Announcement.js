import mongoose from 'mongoose';

/**
 * A line of copy for the homepage offers strip.
 *
 * These exist because the strip derives everything else from real product
 * discounts, which cannot express a shop-wide promotion - "Diwali sale, 20%
 * off all sparklers" belongs to no single product's price.
 */
const announcementSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Announcement text is required'],
      trim: true,
      // The strip is one scrolling line, so a long message scrolls for a very
      // long time before the next one appears.
      maxlength: [160, 'Announcement text cannot exceed 160 characters'],
    },
    // Stored as a name rather than markup so the storefront chooses the icon
    // component. The API never dictates what the UI renders.
    icon: {
      type: String,
      enum: ['megaphone', 'tag', 'sparkles', 'gift', 'truck', 'percent'],
      default: 'megaphone',
    },
    // Lower numbers scroll past first, matching how categories are ordered.
    displayOrder: { type: Number, default: 0 },
    active: { type: Boolean, default: true, index: true },
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

announcementSchema.index({ active: 1, displayOrder: 1, createdAt: 1 });

export const Announcement = mongoose.model('Announcement', announcementSchema);
export default Announcement;
