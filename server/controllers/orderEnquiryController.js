import { OrderEnquiry } from '../models/OrderEnquiry.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * POST /api/order-enquiries
 *
 * Records an order the customer is about to send over WhatsApp. The storefront
 * calls this without awaiting it - if this endpoint is slow or down, the
 * customer still reaches WhatsApp. Nothing in the ordering flow blocks on it.
 *
 * Line totals are recomputed here rather than trusted from the request, since
 * the payload is unauthenticated and a tampered total would corrupt the
 * shop owner's records.
 */
export async function createEnquiry(req, res) {
  const { customerName, mobile, orderType, address, message, items } = req.body;

  const pricedItems = items.map((item) => ({
    product: item.product ?? null,
    name: item.name,
    slug: item.slug ?? '',
    unitPrice: item.unitPrice,
    quantity: item.quantity,
    lineTotal: Math.round(item.unitPrice * item.quantity * 100) / 100,
  }));

  const totalQuantity = pricedItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount =
    Math.round(pricedItems.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100;

  const enquiry = await OrderEnquiry.create({
    customerName,
    mobile,
    orderType,
    address: orderType === 'delivery' ? address : '',
    message,
    items: pricedItems,
    totalQuantity,
    totalAmount,
  });

  res.status(201).json({
    success: true,
    enquiry: { id: enquiry.id, createdAt: enquiry.createdAt },
  });
}

/** GET /api/order-enquiries - admin only. */
export async function listEnquiries(req, res) {
  const page = Math.max(1, Number(req.validatedQuery?.page ?? 1));
  const limit = Math.min(100, Math.max(1, Number(req.validatedQuery?.limit ?? 25)));
  const filter = {};
  if (req.validatedQuery?.status) filter.status = req.validatedQuery.status;

  const [enquiries, total] = await Promise.all([
    OrderEnquiry.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    OrderEnquiry.countDocuments(filter),
  ]);

  res.json({
    success: true,
    enquiries: enquiries.map(({ _id, __v, ...rest }) => ({ id: _id.toString(), ...rest })),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  });
}

/** PATCH /api/order-enquiries/:id/status - admin only. */
export async function updateEnquiryStatus(req, res) {
  const { status } = req.body;

  const enquiry = await OrderEnquiry.findByIdAndUpdate(
    req.params.id,
    { $set: { status } },
    { new: true, runValidators: true },
  );

  if (!enquiry) throw ApiError.notFound('Enquiry not found');

  res.json({ success: true, enquiry });
}
