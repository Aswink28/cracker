/**
 * Seed the catalogue with categories, products and the first admin account.
 *
 *   npm run seed          # insert missing records, leave existing ones alone
 *   npm run seed:reset    # wipe products/categories first, then insert
 *
 * Product images are intentionally left empty. The storefront renders a
 * branded placeholder for products without an image, and real photographs
 * are uploaded through the admin panel. Seeding stock photos would put
 * pictures on the site that do not match what the shop actually sells.
 */
import mongoose from 'mongoose';
import config from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { Admin } from '../models/Admin.js';
import { slugify } from '../utils/slugify.js';

const RESET = process.argv.includes('--reset');

const categories = [
  {
    name: 'Sparklers',
    description:
      'Hand-held sparklers in a range of lengths, from short 7 cm sticks for small children to 56 cm party sparklers. Available in plain, colour and crackling finishes.',
    displayOrder: 1,
    keywords: ['sparklers', 'phool jhadi', 'hand sparklers'],
  },
  {
    name: 'Ground Chakkars',
    description:
      'Spinning ground chakkars that rotate in place and throw a wide circle of sparks. A festival staple that works well in open courtyards.',
    displayOrder: 2,
    keywords: ['ground chakkar', 'chakri', 'spinner'],
  },
  {
    name: 'Flower Pots',
    description:
      'Also called anars. Flower pots sit on the ground and throw a steady fountain of sparks upward. Sold in standard, big and special varieties.',
    displayOrder: 3,
    keywords: ['flower pot', 'anar', 'fountain'],
  },
  {
    name: 'Rockets',
    description:
      'Bottle rockets and whistling rockets that launch upward before bursting. To be used only in wide open spaces well away from buildings.',
    displayOrder: 4,
    keywords: ['rockets', 'bottle rocket', 'whistling rocket'],
  },
  {
    name: 'Fancy Crackers',
    description:
      'Novelty and display items including colour pots, fancy fountains and multi-shot varieties for the main evening display.',
    displayOrder: 5,
    keywords: ['fancy crackers', 'novelty', 'display'],
  },
  {
    name: 'Gift Boxes',
    description:
      'Ready-assembled assortment boxes covering a mix of sparklers, chakkars, flower pots and fancy items. Convenient for gifting.',
    displayOrder: 6,
    keywords: ['gift box', 'assortment', 'festival gift'],
  },
  {
    name: 'Kids Collection',
    description:
      'Low-noise, low-intensity items chosen for younger children, to be used only under adult supervision.',
    displayOrder: 7,
    keywords: ['kids crackers', 'children', 'low noise'],
  },
  {
    name: 'Combo Packs',
    description:
      'Larger value packs that bundle several categories together for a full evening of celebration.',
    displayOrder: 8,
    keywords: ['combo pack', 'value pack', 'family pack'],
  },
];

const products = [
  // Sparklers
  { name: '7 CM Electric Sparklers', category: 'Sparklers', price: 40, offerPrice: 28, unit: 'Box of 10', shortDescription: 'Short 7 cm sparklers, well suited to younger children under supervision.', featured: false, keywords: ['sparklers', '7cm', 'electric sparklers'] },
  { name: '10 CM Colour Sparklers', category: 'Sparklers', price: 65, offerPrice: 45, unit: 'Box of 10', shortDescription: 'Ten centimetre sparklers that burn with a colour-tinted flame.', keywords: ['colour sparklers', '10cm'] },
  { name: '15 CM Crackling Sparklers', category: 'Sparklers', price: 110, offerPrice: 79, unit: 'Box of 10', shortDescription: 'Longer burn time with a crackling finish through the middle of the stick.', featured: true, keywords: ['crackling', '15cm sparklers'] },
  { name: '30 CM Party Sparklers', category: 'Sparklers', price: 210, offerPrice: 155, unit: 'Box of 5', shortDescription: 'Thirty centimetre sparklers with an extended burn for group photographs.', keywords: ['party sparklers', '30cm'] },
  { name: '56 CM Giant Sparklers', category: 'Sparklers', price: 420, offerPrice: 315, unit: 'Box of 5', shortDescription: 'The largest sparkler in the range, for open outdoor use only.', keywords: ['giant sparklers', '56cm'] },

  // Ground Chakkars
  { name: 'Ground Chakkar Small', category: 'Ground Chakkars', price: 70, offerPrice: 52, unit: 'Pack of 10', shortDescription: 'Compact spinning chakkar with a tight spark circle.', keywords: ['ground chakkar', 'small chakri'] },
  { name: 'Ground Chakkar Special', category: 'Ground Chakkars', price: 145, offerPrice: 99, unit: 'Pack of 10', shortDescription: 'Longer spin time and a wider spark circle than the small chakkar.', featured: true, keywords: ['ground chakkar special', 'chakri'] },
  { name: 'Ground Chakkar Deluxe', category: 'Ground Chakkars', price: 260, offerPrice: 189, unit: 'Pack of 10', shortDescription: 'Extended-duration chakkar with a colour-changing spark trail.', keywords: ['deluxe chakkar'] },
  { name: 'Asoka Chakkar', category: 'Ground Chakkars', price: 180, offerPrice: 135, unit: 'Pack of 10', shortDescription: 'Traditional Asoka pattern chakkar with a bright sustained spin.', keywords: ['asoka chakkar'] },

  // Flower Pots
  { name: 'Flower Pot Small', category: 'Flower Pots', price: 60, offerPrice: 44, unit: 'Pack of 10', shortDescription: 'Small anar producing a modest upward spark fountain.', keywords: ['flower pot', 'small anar'] },
  { name: 'Flower Pot Big', category: 'Flower Pots', price: 300, offerPrice: 250, unit: 'Pack of 10', shortDescription: 'Full-size flower pot with a tall, steady fountain of sparks.', featured: true, keywords: ['flower pot big', 'big anar'] },
  { name: 'Flower Pot Special', category: 'Flower Pots', price: 450, offerPrice: 340, unit: 'Pack of 10', shortDescription: 'Extended burn flower pot with a denser spark output.', keywords: ['flower pot special'] },
  { name: 'Colour Koti Flower Pot', category: 'Flower Pots', price: 520, offerPrice: 399, unit: 'Pack of 10', shortDescription: 'Flower pot that shifts through several colours during its burn.', featured: true, keywords: ['colour koti', 'colour flower pot'] },

  // Rockets
  { name: 'Bottle Rocket', category: 'Rockets', price: 130, offerPrice: 95, unit: 'Pack of 10', shortDescription: 'Standard bottle rocket with a single report at the top of its climb.', keywords: ['bottle rocket', 'rocket'] },
  { name: 'Whistling Rocket', category: 'Rockets', price: 175, offerPrice: 129, unit: 'Pack of 10', shortDescription: 'Rocket with a whistling ascent followed by a bright burst.', featured: true, keywords: ['whistling rocket'] },
  { name: 'Colour Rocket', category: 'Rockets', price: 230, offerPrice: 169, unit: 'Pack of 10', shortDescription: 'Rocket bursting into a spread of coloured stars.', keywords: ['colour rocket'] },
  { name: 'Rocket Combo Pack', category: 'Rockets', price: 620, offerPrice: 450, unit: 'Assorted pack', shortDescription: 'Mixed pack of bottle, whistling and colour rockets.', featured: true, keywords: ['rocket combo', 'rocket pack'] },

  // Fancy Crackers
  { name: 'Colour Pot Fancy', category: 'Fancy Crackers', price: 340, offerPrice: 249, unit: 'Pack of 5', shortDescription: 'Wide-mouth colour pot producing a broad, slow fountain.', keywords: ['colour pot', 'fancy'] },
  { name: 'Silver Fountain', category: 'Fancy Crackers', price: 290, offerPrice: 215, unit: 'Pack of 5', shortDescription: 'Bright silver fountain with a tall, narrow spark column.', keywords: ['silver fountain', 'fountain'] },
  { name: 'Peacock Fancy Fountain', category: 'Fancy Crackers', price: 560, offerPrice: 420, unit: 'Pack of 5', shortDescription: 'Fan-shaped display fountain that spreads outward as it burns.', featured: true, keywords: ['peacock fountain', 'fancy fountain'] },
  { name: '12 Shot Multi Colour', category: 'Fancy Crackers', price: 890, offerPrice: 675, unit: 'Single unit', shortDescription: 'Twelve sequential aerial shots from a single stable base.', keywords: ['multi shot', '12 shot'] },
  { name: '30 Shot Aerial Display', category: 'Fancy Crackers', price: 1850, offerPrice: 1420, unit: 'Single unit', shortDescription: 'Thirty-shot aerial sequence intended as a display centrepiece.', featured: true, keywords: ['30 shot', 'aerial display'] },

  // Gift Boxes
  { name: 'Family Gift Box 25 Items', category: 'Gift Boxes', price: 950, offerPrice: 725, unit: '25 items', shortDescription: 'Assorted box covering sparklers, chakkars and flower pots.', featured: true, keywords: ['gift box', 'family box', '25 items'] },
  { name: 'Premium Gift Box 50 Items', category: 'Gift Boxes', price: 2100, offerPrice: 1599, unit: '50 items', shortDescription: 'Larger assortment adding fancy fountains and rockets.', keywords: ['premium gift box', '50 items'] },
  { name: 'Deluxe Gift Box 75 Items', category: 'Gift Boxes', price: 3400, offerPrice: 2549, unit: '75 items', shortDescription: 'Our widest assortment box, covering every category in the range.', featured: true, keywords: ['deluxe gift box', '75 items'] },

  // Kids Collection
  { name: 'Kids Fancy Pack', category: 'Kids Collection', price: 260, offerPrice: 189, unit: 'Assorted pack', shortDescription: 'Low-noise assortment selected for younger children, for supervised use.', featured: true, keywords: ['kids pack', 'low noise'] },
  { name: 'Snake Tablets', category: 'Kids Collection', price: 45, offerPrice: 32, unit: 'Pack of 10', shortDescription: 'Small tablets that produce an expanding ash coil with no report.', keywords: ['snake tablets', 'kids'] },
  { name: 'Colour Smoke Sticks', category: 'Kids Collection', price: 120, offerPrice: 88, unit: 'Pack of 10', shortDescription: 'Coloured smoke sticks with no bang, suitable for daytime use.', keywords: ['smoke sticks', 'colour smoke'] },
  { name: 'Pop Pop Crackers', category: 'Kids Collection', price: 35, offerPrice: 25, unit: 'Box of 50', shortDescription: 'Throw-down poppers with a very light snap.', keywords: ['pop pop', 'poppers'] },

  // Combo Packs
  { name: 'Value Combo Pack', category: 'Combo Packs', price: 1450, offerPrice: 1099, unit: 'Assorted pack', shortDescription: 'Balanced mix covering an evening of celebration for a small family.', featured: true, keywords: ['value combo', 'combo pack'] },
  { name: 'Festival Combo Pack', category: 'Combo Packs', price: 2800, offerPrice: 2150, unit: 'Assorted pack', shortDescription: 'Larger combo with a stronger share of fancy and aerial items.', keywords: ['festival combo'] },
  { name: 'Mega Family Combo', category: 'Combo Packs', price: 4900, offerPrice: 3699, unit: 'Assorted pack', shortDescription: 'Our largest combo, intended for a full evening group celebration.', featured: true, keywords: ['mega combo', 'family combo'] },
];

function buildDescription(product, categoryName) {
  return (
    `${product.name} is part of our ${categoryName.toLowerCase()} range` +
    `${product.unit ? `, supplied as ${product.unit.toLowerCase()}` : ''}. ` +
    `${product.shortDescription} ` +
    'Store in a cool, dry place away from heat and direct sunlight. ' +
    'Use only in a suitable open area, follow the instructions printed on the pack, ' +
    'and keep water or sand within reach. Purchase and use only where local law permits.'
  );
}

async function seedCategories() {
  const bySlug = new Map();

  for (const entry of categories) {
    const slug = slugify(entry.name);
    const existing = await Category.findOne({ slug });

    if (existing) {
      bySlug.set(entry.name, existing);
      continue;
    }

    const created = await Category.create({ ...entry, slug });
    bySlug.set(entry.name, created);
    console.log(`  + category: ${entry.name}`);
  }

  return bySlug;
}

async function seedProducts(categoryMap) {
  let created = 0;
  let skipped = 0;

  for (const entry of products) {
    const category = categoryMap.get(entry.category);
    if (!category) {
      console.warn(`  ! skipping ${entry.name}: unknown category ${entry.category}`);
      continue;
    }

    const slug = slugify(entry.name);
    if (await Product.exists({ slug })) {
      skipped += 1;
      continue;
    }

    const { category: _categoryName, ...fields } = entry;

    await Product.create({
      ...fields,
      slug,
      category: category._id,
      description: buildDescription(entry, entry.category),
      keywords: [...(entry.keywords ?? []), 'crackers', 'fireworks'],
      image: null,
      // A stable, non-random popularity so the "Popular" sort is deterministic
      // across seeds: featured items first, then by price descending.
      popularity: (entry.featured ? 1000 : 0) + Math.round(entry.price / 10),
    });

    created += 1;
  }

  console.log(`  + products created: ${created}, already present: ${skipped}`);
}

async function seedAdmin() {
  if (!config.ADMIN_EMAIL || !config.ADMIN_PASSWORD) {
    console.log('  - ADMIN_EMAIL / ADMIN_PASSWORD not set, skipping admin creation');
    return;
  }

  const existing = await Admin.findOne({ email: config.ADMIN_EMAIL });
  if (existing) {
    console.log(`  - admin already exists: ${config.ADMIN_EMAIL}`);
    return;
  }

  await Admin.create({
    name: config.ADMIN_NAME,
    email: config.ADMIN_EMAIL,
    password: config.ADMIN_PASSWORD,
  });

  console.log(`  + admin created: ${config.ADMIN_EMAIL}`);
}

async function run() {
  await connectDatabase();

  if (RESET) {
    console.log('Resetting products and categories...');
    await Promise.all([Product.deleteMany({}), Category.deleteMany({})]);
  }

  console.log('Seeding categories...');
  const categoryMap = await seedCategories();

  console.log('Seeding products...');
  await seedProducts(categoryMap);

  console.log('Seeding admin...');
  await seedAdmin();

  // Text and compound indexes are declared on the schemas but only built on
  // demand; doing it here means the first real search is already fast.
  console.log('Building indexes...');
  await Promise.all([Product.syncIndexes(), Category.syncIndexes(), Admin.syncIndexes()]);

  console.log('\nSeed complete.');
  await disconnectDatabase();
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error('Seed failed:', error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
