import mongoose from 'mongoose';

/**
 * A record of an order the customer sent through WhatsApp.
 *
 * This is deliberately a passive log. The storefront fires it off in the
 * background and ignores the outcome - if this collection is unreachable the
 * customer must still reach WhatsApp (see requirement in the README).
 * Item details are denormalised on purpose so the enquiry still reads
 * correctly after a product is renamed, repriced or deleted.
 */
const enquiryItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, default: '' },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderEnquirySchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true, maxlength: 100 },
    mobile: { type: String, required: true, trim: true, maxlength: 20 },
    orderType: { type: String, enum: ['pickup', 'delivery'], required: true },
    address: { type: String, trim: true, maxlength: 500, default: '' },
    message: { type: String, trim: true, maxlength: 1000, default: '' },
    items: {
      type: [enquiryItemSchema],
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'An enquiry must contain at least one item',
      },
    },
    totalQuantity: { type: Number, required: true, min: 1 },
    totalAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['new', 'contacted', 'confirmed', 'cancelled'],
      default: 'new',
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      versionKey: false,
      transform(_doc, ret) {
        ret.id = ret._id?.toString?.() ?? ret._id;
        delete ret._id;
        return ret;
      },
    },
  },
);

orderEnquirySchema.index({ createdAt: -1 });
orderEnquirySchema.index({ status: 1, createdAt: -1 });

export const OrderEnquiry = mongoose.model('OrderEnquiry', orderEnquirySchema);
export default OrderEnquiry;
