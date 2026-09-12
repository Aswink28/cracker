import PDFDocument from 'pdfkit';
import { Product } from '../models/Product.js';
import { Category } from '../models/Category.js';
import config from '../config/env.js';

/**
 * Price list as a PDF, streamed straight to the response.
 *
 * PDFKit rather than a headless browser: rendering HTML to PDF would mean
 * shipping Chromium, which a small container cannot spare the memory for, and
 * this document is a table - it gains nothing from a browser engine.
 *
 * The rupee sign is deliberately written "Rs." throughout. PDFKit's built-in
 * fonts use WinAnsi encoding, which has no glyph for U+20B9, so a real "₹"
 * silently renders as a blank or a wrong character. Writing Rs. keeps the
 * document readable without embedding a font file for one symbol.
 */

const PAGE_MARGIN = 40;
const COLUMNS = { name: 40, pack: 250, price: 360, offer: 440, save: 510 };

const inr = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
const money = (value) => `Rs. ${inr.format(Math.round(value ?? 0))}`;

export async function streamCatalogueePdf(res, { includeInactive = false } = {}) {
  const filter = includeInactive ? {} : { active: true };

  const [categories, products] = await Promise.all([
    Category.find({}).sort({ displayOrder: 1, name: 1 }).lean(),
    Product.find(filter).sort({ name: 1 }).lean(),
  ]);

  const byCategory = new Map(categories.map((c) => [c._id.toString(), []]));
  const uncategorised = [];

  for (const product of products) {
    const key = product.category?.toString();
    if (key && byCategory.has(key)) byCategory.get(key).push(product);
    else uncategorised.push(product);
  }

  const doc = new PDFDocument({
    size: 'A4',
    margin: PAGE_MARGIN,
    // Required before switchToPage: without it the page numbering pass at the
    // end throws, because finished pages are flushed as they are written.
    bufferPages: true,
    info: {
      Title: `${config.STORE_NAME} price list`,
      Author: config.STORE_NAME,
    },
  });

  doc.pipe(res);

  drawHeader(doc, products.length);

  let first = true;
  for (const category of categories) {
    const items = byCategory.get(category._id.toString()) ?? [];
    if (items.length === 0) continue;
    drawCategory(doc, category.name, items, first);
    first = false;
  }

  if (uncategorised.length > 0) {
    drawCategory(doc, 'Other', uncategorised, first);
  }

  drawPageNumbers(doc);
  doc.end();
}

function drawHeader(doc, count) {
  doc.fontSize(20).font('Helvetica-Bold').text('Price list', PAGE_MARGIN, PAGE_MARGIN);

  const generated = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#555')
    .text(`${count} item(s) | generated ${generated}`, PAGE_MARGIN, doc.y + 2)
    .text(
      'Prices are indicative and confirmed over WhatsApp before dispatch.',
      PAGE_MARGIN,
      doc.y + 2,
    )
    .fillColor('#000');

  doc.moveDown(0.8);
}

function drawCategory(doc, name, items, isFirst) {
  // A heading stranded at the foot of a page reads as a mistake, so break
  // early when there is not room for it plus a couple of rows.
  const needed = 60;
  if (!isFirst && doc.y + needed > doc.page.height - PAGE_MARGIN) doc.addPage();

  doc.moveDown(0.6);
  doc.fontSize(13).font('Helvetica-Bold').text(name, PAGE_MARGIN, doc.y);
  doc.moveDown(0.3);

  drawRow(doc, ['Product', 'Pack', 'Price', 'Offer', 'You save'], { header: true });

  for (const item of items) {
    if (doc.y > doc.page.height - PAGE_MARGIN - 24) {
      doc.addPage();
      drawRow(doc, ['Product', 'Pack', 'Price', 'Offer', 'You save'], { header: true });
    }

    const hasOffer = item.offerPrice != null && item.offerPrice < item.price;
    drawRow(doc, [
      item.name,
      item.unit || '-',
      money(item.price),
      hasOffer ? money(item.offerPrice) : '-',
      hasOffer ? money(item.price - item.offerPrice) : '-',
    ]);
  }
}

function drawRow(doc, cells, { header = false } = {}) {
  const y = doc.y;
  doc.fontSize(9).font(header ? 'Helvetica-Bold' : 'Helvetica');
  if (header) doc.fillColor('#555');

  doc.text(cells[0], COLUMNS.name, y, { width: COLUMNS.pack - COLUMNS.name - 10 });
  const nameBottom = doc.y;

  doc.text(cells[1], COLUMNS.pack, y, { width: COLUMNS.price - COLUMNS.pack - 10 });
  doc.text(cells[2], COLUMNS.price, y, { width: 70, align: 'right' });
  doc.text(cells[3], COLUMNS.offer, y, { width: 60, align: 'right' });
  doc.text(cells[4], COLUMNS.save, y, { width: 60, align: 'right' });

  // A long product name wraps, so the next row starts below the tallest cell.
  doc.y = Math.max(nameBottom, y + 12);

  if (header) {
    doc.fillColor('#000');
    doc
      .moveTo(PAGE_MARGIN, doc.y + 1)
      .lineTo(doc.page.width - PAGE_MARGIN, doc.y + 1)
      .strokeColor('#ccc')
      .lineWidth(0.5)
      .stroke();
    doc.y += 4;
  }
}

/**
 * Numbers are stamped after the body is laid out, because the total page count
 * is not known until then.
 */
function drawPageNumbers(doc) {
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    doc
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#777')
      .text(
        `Page ${i - range.start + 1} of ${range.count}`,
        PAGE_MARGIN,
        doc.page.height - PAGE_MARGIN + 8,
        { width: doc.page.width - PAGE_MARGIN * 2, align: 'center' },
      )
      .fillColor('#000');
  }
}

export default streamCatalogueePdf;
