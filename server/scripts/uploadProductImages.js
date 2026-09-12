/**
 * Bulk-attach product photos from a folder.
 *
 *   node scripts/uploadProductImages.js ../photos
 *   node scripts/uploadProductImages.js ../photos --dry-run
 *   node scripts/uploadProductImages.js ../photos --force
 *
 * Each file is matched to a product by its name: "mega-family-combo.jpg"
 * attaches to the product whose slug is mega-family-combo. Matching on the
 * slug rather than position means the folder can be filled in any order, a few
 * at a time, and re-run safely.
 *
 * Products that already have an image are skipped unless --force is passed, so
 * re-running after adding a handful of new photos does not re-upload the ones
 * already done - each upload costs Cloudinary quota.
 */
import path from 'node:path';
import fs from 'node:fs/promises';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { Product } from '../models/Product.js';
import { uploadImage } from '../services/cloudinaryService.js';
import { revalidateStorefront } from '../services/revalidateService.js';
import { slugify } from '../utils/slugify.js';

const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif']);

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith('--'));
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');

if (!dir) {
  console.error('Usage: node scripts/uploadProductImages.js <folder> [--dry-run] [--force]');
  process.exit(1);
}

async function run() {
  const root = path.resolve(dir);
  let files;
  try {
    files = await fs.readdir(root);
  } catch {
    console.error(`Cannot read folder: ${root}`);
    process.exit(1);
  }

  const images = files.filter((f) => EXTENSIONS.has(path.extname(f).toLowerCase()));
  if (images.length === 0) {
    console.error(`No images in ${root} (looked for ${[...EXTENSIONS].join(', ')})`);
    process.exit(1);
  }

  await connectDatabase();

  const products = await Product.find({}).select('name slug image').lean();
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  console.log(`\n${images.length} image(s) in ${root}`);
  console.log(`${products.length} product(s) in the catalogue`);
  if (dryRun) console.log('DRY RUN - nothing will be uploaded or saved\n');

  const unmatched = [];
  let uploaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of images) {
    // Tolerate "Mega Family Combo.jpg" as well as the exact slug.
    const base = path.basename(file, path.extname(file));
    const product = bySlug.get(base) ?? bySlug.get(slugify(base));

    if (!product) {
      unmatched.push(file);
      continue;
    }

    if (product.image?.url && !force) {
      console.log(`  skip    ${product.name} (already has an image)`);
      skipped += 1;
      continue;
    }

    if (dryRun) {
      console.log(`  would   ${file}  ->  ${product.name}`);
      uploaded += 1;
      continue;
    }

    try {
      const buffer = await fs.readFile(path.join(root, file));
      const image = await uploadImage(buffer, { folder: 'products' });

      await Product.updateOne(
        { _id: product._id },
        { $set: { image: { ...image, alt: product.name } } },
      );

      console.log(`  ok      ${file}  ->  ${product.name}`);
      uploaded += 1;
    } catch (error) {
      console.error(`  FAILED  ${file}: ${error.message}`);
      failed += 1;
    }
  }

  if (unmatched.length > 0) {
    console.log(`\n${unmatched.length} file(s) matched no product:`);
    for (const f of unmatched) console.log(`  ${f}`);
    console.log('\nRename these to the product slug, e.g. mega-family-combo.jpg');
  }

  const without = await Product.countDocuments({ $or: [{ image: null }, { image: { $exists: false } }] });
  console.log(`\nuploaded: ${uploaded}  skipped: ${skipped}  failed: ${failed}`);
  console.log(`products still without a photo: ${without}`);

  // One ping for the whole run rather than one per product.
  if (!dryRun && uploaded > 0) await revalidateStorefront(['products']);

  await disconnectDatabase();
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error('Upload run failed:', error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
