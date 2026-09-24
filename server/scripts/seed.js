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
    name: "Sparklers",
    description:
      "Hand-held sparklers from 10 cm to 50 cm, in electric, colour, crackling, green and red finishes.",
    displayOrder: 1,
    keywords: ["sparklers", "crackers"],
  },
  {
    name: "One Sound Crackers",
    description:
      "Single-report crackers sold by the packet, including lakshmi, bahubali and kuruvi.",
    displayOrder: 2,
    keywords: ["one sound crackers", "crackers"],
  },
  {
    name: "Flower Pots",
    description:
      "Ground fountains, from the standard big pot to colour koti and tri-colour.",
    displayOrder: 3,
    keywords: ["flower pots", "crackers"],
  },
  {
    name: "Ground Chakkar",
    description:
      "Spinning ground chakkars in big, special, deluxe and wire variants.",
    displayOrder: 4,
    keywords: ["ground chakkar", "crackers"],
  },
  {
    name: "Twinkling Star",
    description:
      "Twinkling star items in two sizes.",
    displayOrder: 5,
    keywords: ["twinkling star", "crackers"],
  },
  {
    name: "Rockets",
    description:
      "Rockets with two-sound, three-sound and whistling effects.",
    displayOrder: 6,
    keywords: ["rockets", "crackers"],
  },
  {
    name: "Bijili Crackers",
    description:
      "Bijili crackers, sold by the packet.",
    displayOrder: 7,
    keywords: ["bijili crackers", "crackers"],
  },
  {
    name: "Colour Smokes",
    description:
      "Coloured smoke items including multi smoke and gold variants.",
    displayOrder: 8,
    keywords: ["colour smokes", "crackers"],
  },
  {
    name: "Kids Special",
    description:
      "Lower-noise novelty items intended for children under adult supervision.",
    displayOrder: 9,
    keywords: ["kids special", "crackers"],
  },
  {
    name: "Bomb Special",
    description:
      "Single-shot bomb items including digital, classic and hydro.",
    displayOrder: 10,
    keywords: ["bomb special", "crackers"],
  },
  {
    name: "Fancy Novelties",
    description:
      "Multi-shot fancy items, from 7 shot up to 240 shot and welcome shots.",
    displayOrder: 11,
    keywords: ["fancy novelties", "crackers"],
  },
  {
    name: "Paper Bomb",
    description:
      "Paper bombs by weight, plus avatar, rider and once more.",
    displayOrder: 12,
    keywords: ["paper bomb", "crackers"],
  },
  {
    name: "Fountain",
    description:
      "Standing fountains including laddu, peacock, golden rain and ganga jamuna.",
    displayOrder: 13,
    keywords: ["fountain", "crackers"],
  },
  {
    name: "Lars",
    description:
      "Lar strings in 1k, 2k, 5k and 10k counts.",
    displayOrder: 14,
    keywords: ["lars", "crackers"],
  },
];

const products = [
  // Sparklers
  { name: "10 cm Electric Sparklers", category: "Sparklers", price: 140, offerPrice: 28, unit: "1 box", keywords: ["10 cm electric sparklers", "sparklers"] },
  { name: "10 cm Colour Sparklers", category: "Sparklers", price: 160, offerPrice: 32, unit: "1 Box", keywords: ["10 cm colour sparklers", "sparklers"] },
  { name: "12 cm Electric Sparklers", category: "Sparklers", price: 185, offerPrice: 37, unit: "1 Box", keywords: ["12 cm electric sparklers", "sparklers"] },
  { name: "12 cm Crackling Sparklers", category: "Sparklers", price: 205, offerPrice: 41, unit: "1 Box", keywords: ["12 cm crackling sparklers", "sparklers"] },
  { name: "15 cm Electric Sparklers", category: "Sparklers", price: 350, offerPrice: 70, unit: "1 Box", keywords: ["15 cm electric sparklers", "sparklers"] },
  { name: "15 cm Cracking Sparklers", category: "Sparklers", price: 375, offerPrice: 75, unit: "1 Box", keywords: ["15 cm cracking sparklers", "sparklers"] },
  { name: "15 cm Green Sparklers", category: "Sparklers", price: 400, offerPrice: 80, unit: "1 Box", keywords: ["15 cm green sparklers", "sparklers"] },
  { name: "15 cm Red Sparklers", category: "Sparklers", price: 550, offerPrice: 110, unit: "1 Box", keywords: ["15 cm red sparklers", "sparklers"] },
  { name: "30 cm Electric Sparklers", category: "Sparklers", price: 350, offerPrice: 70, unit: "1 Box", keywords: ["30 cm electric sparklers", "sparklers"] },
  { name: "30 cm Crackling Sparklers", category: "Sparklers", price: 375, offerPrice: 75, unit: "1 Box", keywords: ["30 cm crackling sparklers", "sparklers"] },
  { name: "30 cm Green Sparklers", category: "Sparklers", price: 400, offerPrice: 80, unit: "1 Box", keywords: ["30 cm green sparklers", "sparklers"] },
  { name: "30 cm Red Sparklers", category: "Sparklers", price: 550, offerPrice: 110, unit: "1 Box", keywords: ["30 cm red sparklers", "sparklers"] },
  { name: "50 cm Electric Sparklers", category: "Sparklers", price: 1495, offerPrice: 299, unit: "1 Box", keywords: ["50 cm electric sparklers", "sparklers"] },
  { name: "50 cm Crackling Sparklers", category: "Sparklers", price: 1685, offerPrice: 337, unit: "1 Box", keywords: ["50 cm crackling sparklers", "sparklers"] },

  // One Sound Crackers
  { name: "4\" lakshmi", category: "One Sound Crackers", price: 115, offerPrice: 23, unit: "1 pkt", keywords: ["4\" lakshmi", "one sound crackers"] },
  { name: "5\"Jallikattu", category: "One Sound Crackers", price: 300, offerPrice: 60, unit: "1 Pkt", keywords: ["5\"jallikattu", "one sound crackers"] },
  { name: "4\" Gold lakshmi", category: "One Sound Crackers", price: 130, offerPrice: 26, unit: "1 Pkt", keywords: ["4\" gold lakshmi", "one sound crackers"] },
  { name: "5\" Bahubali", category: "One Sound Crackers", price: 275, offerPrice: 55, unit: "1 Pkt", keywords: ["5\" bahubali", "one sound crackers"] },
  { name: "Bullet", category: "One Sound Crackers", price: 1000, offerPrice: 200, unit: "1 box", keywords: ["bullet", "one sound crackers"] },
  { name: "2 3/4 Kuruvi", category: "One Sound Crackers", price: 40, offerPrice: 8, unit: "1 Pkt", keywords: ["2 3/4 kuruvi", "one sound crackers"] },
  { name: "Money bank", category: "One Sound Crackers", price: 550, offerPrice: 110, unit: "1box", keywords: ["money bank", "one sound crackers"] },

  // Flower Pots
  { name: "Flower Pots Big", category: "Flower Pots", price: 290, offerPrice: 58, unit: "1 Box", keywords: ["flower pots big", "flower pots"] },
  { name: "Flower Pots Special", category: "Flower Pots", price: 370, offerPrice: 74, unit: "1 Box", keywords: ["flower pots special", "flower pots"] },
  { name: "Flower Pots Ashoka", category: "Flower Pots", price: 500, offerPrice: 100, unit: "1 Box", keywords: ["flower pots ashoka", "flower pots"] },
  { name: "Colour Koti", category: "Flower Pots", price: 900, offerPrice: 180, unit: "1 Box", keywords: ["colour koti", "flower pots"] },
  { name: "Tri-Colour", category: "Flower Pots", price: 1325, offerPrice: 265, unit: "1 Box", keywords: ["tri-colour", "flower pots"] },

  // Ground Chakkar
  { name: "Ground Chakkar Big", category: "Ground Chakkar", price: 150, offerPrice: 30, unit: "25 pcs", keywords: ["ground chakkar big", "ground chakkar"] },
  { name: "Ground Chakkar Special", category: "Ground Chakkar", price: 300, offerPrice: 60, unit: "1 Box", keywords: ["ground chakkar special", "ground chakkar"] },
  { name: "Ground Chakkar Deluxe", category: "Ground Chakkar", price: 600, offerPrice: 120, unit: "1 Box", keywords: ["ground chakkar deluxe", "ground chakkar"] },
  { name: "Wire Chakkar", category: "Ground Chakkar", price: 900, offerPrice: 180, unit: "1 Box", keywords: ["wire chakkar", "ground chakkar"] },
  { slug: "ground-chakkar-big-1-box", name: "Ground-chakkar-big", category: "Ground Chakkar", price: 150, offerPrice: 30, unit: "1 box", keywords: ["ground-chakkar-big", "ground chakkar"] },

  // Twinkling Star
  { name: "1 1/2 Twling star", category: "Twinkling Star", price: 150, offerPrice: 30, unit: "1 Box", keywords: ["1 1/2 twling star", "twinkling star"] },
  { name: "4\" Twnkling Star", category: "Twinkling Star", price: 325, offerPrice: 65, unit: "1 Box", keywords: ["4\" twnkling star", "twinkling star"] },

  // Rockets
  { name: "2 Sound Rocket", category: "Rockets", price: 850, offerPrice: 170, unit: "1 Box", keywords: ["2 sound rocket", "rockets"] },
  { name: "3 Sound Rocket", category: "Rockets", price: 950, offerPrice: 190, unit: "1 Box", keywords: ["3 sound rocket", "rockets"] },
  { name: "Whistling Rocket", category: "Rockets", price: 1100, offerPrice: 220, unit: "1 Box", keywords: ["whistling rocket", "rockets"] },

  // Bijili Crackers
  { name: "Bijili", category: "Bijili Crackers", price: 90, offerPrice: 18, unit: "1pkt", keywords: ["bijili", "bijili crackers"] },

  // Colour Smokes
  { name: "Multi smoke", category: "Colour Smokes", price: 1000, offerPrice: 200, unit: "1 box", keywords: ["multi smoke", "colour smokes"] },
  { name: "Sixer glod", category: "Colour Smokes", price: 750, offerPrice: 150, unit: "1box", keywords: ["sixer glod", "colour smokes"] },
  { name: "Gold Black", category: "Colour Smokes", price: 750, offerPrice: 150, unit: "1 Box", keywords: ["gold black", "colour smokes"] },

  // Kids Special
  { name: "Hot Cone", category: "Kids Special", price: 1050, offerPrice: 210, unit: "1 Pkt", keywords: ["hot cone", "kids special"] },
  { name: "Mobile Fountain", category: "Kids Special", price: 1100, offerPrice: 220, unit: "1 Pcs", keywords: ["mobile fountain", "kids special"] },
  { name: "Helecopter", category: "Kids Special", price: 430, offerPrice: 86, unit: "1 Box", keywords: ["helecopter", "kids special"] },
  { name: "Lollipop", category: "Kids Special", price: 850, offerPrice: 170, unit: "1 box", keywords: ["lollipop", "kids special"] },
  { name: "Shotter gun", category: "Kids Special", price: 1000, offerPrice: 200, unit: "1 box", keywords: ["shotter gun", "kids special"] },
  { name: "Free fire 5G gun", category: "Kids Special", price: 1200, offerPrice: 240, unit: "1 box", keywords: ["free fire 5g gun", "kids special"] },
  { name: "MRF ( bat ball )", category: "Kids Special", price: 1250, offerPrice: 250, unit: "1 pkt", keywords: ["mrf ( bat ball )", "kids special"] },
  { name: "Selfie Stick", category: "Kids Special", price: 650, offerPrice: 130, unit: "1 box", keywords: ["selfie stick", "kids special"] },
  { name: "Photo flash", category: "Kids Special", price: 350, offerPrice: 70, unit: "1box", keywords: ["photo flash", "kids special"] },
  { name: "Appu fountan", category: "Kids Special", price: 1150, offerPrice: 230, unit: "1 box", keywords: ["appu fountan", "kids special"] },
  { name: "Pinaki", category: "Kids Special", price: 650, offerPrice: 130, unit: "1 box", keywords: ["pinaki", "kids special"] },
  { name: "90s kids", category: "Kids Special", price: 750, offerPrice: 150, unit: "1 box", keywords: ["90s kids", "kids special"] },
  { name: "Butterfly", category: "Kids Special", price: 350, offerPrice: 70, unit: "1 box", keywords: ["butterfly", "kids special"] },
  { name: "Bambaram", category: "Kids Special", price: 550, offerPrice: 110, unit: "1box", keywords: ["bambaram", "kids special"] },
  { name: "Siren", category: "Kids Special", price: 900, offerPrice: 180, unit: "3pcs", keywords: ["siren", "kids special"] },
  { name: "Cylinder Bomb", category: "Kids Special", price: 1400, offerPrice: 280, unit: "2pcs", keywords: ["cylinder bomb", "kids special"] },
  { name: "Kulfie", category: "Kids Special", price: 1600, offerPrice: 320, unit: "1 Box", keywords: ["kulfie", "kids special"] },
  { name: "EMU Egg", category: "Kids Special", price: 1600, offerPrice: 320, unit: "1 Box", keywords: ["emu egg", "kids special"] },
  { name: "Avengers", category: "Kids Special", price: 2400, offerPrice: 480, unit: "1 Box", keywords: ["avengers", "kids special"] },
  { name: "Mottu Pattlu", category: "Kids Special", price: 1200, offerPrice: 240, unit: "1 Box", keywords: ["mottu pattlu", "kids special"] },
  { name: "H20 Gun", category: "Kids Special", price: 700, offerPrice: 140, unit: "1 Box", keywords: ["h20 gun", "kids special"] },
  { name: "Zhu Zhu", category: "Kids Special", price: 750, offerPrice: 150, unit: "1 Box", keywords: ["zhu zhu", "kids special"] },
  { name: "shinchan", category: "Kids Special", price: 500, offerPrice: 100, unit: "1 Box", keywords: ["shinchan", "kids special"] },
  { name: "Watermelon", category: "Kids Special", price: 500, offerPrice: 100, unit: "1 Box", keywords: ["watermelon", "kids special"] },
  { slug: "cylinder-bomb-1-pcs", name: "Cylinder Bomb", category: "Kids Special", price: 650, offerPrice: 130, unit: "1 Pcs", keywords: ["cylinder bomb", "kids special"] },
  { name: "Siren small", category: "Kids Special", price: 750, offerPrice: 150, unit: "5 pcs", keywords: ["siren small", "kids special"] },
  { name: "Motu patlu", category: "Kids Special", price: 1050, offerPrice: 210, unit: "1 Box", keywords: ["motu patlu", "kids special"] },
  { name: "Thar car", category: "Kids Special", price: 950, offerPrice: 190, unit: "1 box", keywords: ["thar car", "kids special"] },
  { name: "5D GLASSES", category: "Kids Special", price: 495, offerPrice: 99, unit: "3 pcs", keywords: ["5d glasses", "kids special"] },
  { name: "Chocolate", category: "Kids Special", price: 495, offerPrice: 99, unit: "2pcs", keywords: ["chocolate", "kids special"] },
  { name: "Tin", category: "Kids Special", price: 400, offerPrice: 80, unit: "1 Box", keywords: ["tin", "kids special"] },
  { name: "Beer bottle", category: "Kids Special", price: 1500, offerPrice: 300, unit: "1box", keywords: ["beer bottle", "kids special"] },
  { name: "parachute", category: "Kids Special", price: 200, offerPrice: 40, unit: "1", keywords: ["parachute", "kids special"] },
  { slug: "parachute-1pcs", name: "Parachute", category: "Kids Special", price: 200, offerPrice: 40, unit: "1pcs", keywords: ["parachute", "kids special"] },
  { name: "Drone", category: "Kids Special", price: 700, offerPrice: 140, unit: "1box", keywords: ["drone", "kids special"] },

  // Bomb Special
  { name: "Digital Bomb", category: "Bomb Special", price: 1400, offerPrice: 280, unit: "1 Box", keywords: ["digital bomb", "bomb special"] },
  { name: "Classic Bomb", category: "Bomb Special", price: 650, offerPrice: 130, unit: "1 Box", keywords: ["classic bomb", "bomb special"] },
  { name: "King of King", category: "Bomb Special", price: 550, offerPrice: 110, unit: "1 Box", keywords: ["king of king", "bomb special"] },
  { name: "Hydro Bomb", category: "Bomb Special", price: 500, offerPrice: 100, unit: "1 Box", keywords: ["hydro bomb", "bomb special"] },

  // Fancy Novelties
  { name: "7'Shot", category: "Fancy Novelties", price: 650, offerPrice: 130, unit: "1 Box", keywords: ["7'shot", "fancy novelties"] },
  { name: "Magic Sound", category: "Fancy Novelties", price: 800, offerPrice: 160, unit: "1 Box", keywords: ["magic sound", "fancy novelties"] },
  { name: "2\" Fancy", category: "Fancy Novelties", price: 350, offerPrice: 70, unit: "1 Pcs", keywords: ["2\" fancy", "fancy novelties"] },
  { slug: "2-fancy-3-pcs", name: "2\" Fancy", category: "Fancy Novelties", price: 1100, offerPrice: 220, unit: "3 Pcs", keywords: ["2\" fancy", "fancy novelties"] },
  { name: "Penta magic", category: "Fancy Novelties", price: 850, offerPrice: 170, unit: "1 Box", keywords: ["penta magic", "fancy novelties"] },
  { name: "Black Money", category: "Fancy Novelties", price: 1000, offerPrice: 200, unit: "2 pcs", keywords: ["black money", "fancy novelties"] },
  { name: "Black Buster", category: "Fancy Novelties", price: 750, offerPrice: 150, unit: "1 Box", keywords: ["black buster", "fancy novelties"] },
  { name: "25 Shot", category: "Fancy Novelties", price: 1150, offerPrice: 230, unit: "1 Box", keywords: ["25 shot", "fancy novelties"] },
  { name: "30 Shot", category: "Fancy Novelties", price: 2000, offerPrice: 400, unit: "1box", keywords: ["30 shot", "fancy novelties"] },
  { name: "60 Shot", category: "Fancy Novelties", price: 3995, offerPrice: 799, unit: "1box", keywords: ["60 shot", "fancy novelties"] },
  { name: "120 Shot", category: "Fancy Novelties", price: 10995, offerPrice: 2199, unit: "1box", keywords: ["120 shot", "fancy novelties"] },
  { name: "3 in 1 Fancy", category: "Fancy Novelties", price: 1200, offerPrice: 240, unit: "1pcs", keywords: ["3 in 1 fancy", "fancy novelties"] },
  { name: "3 Fancy", category: "Fancy Novelties", price: 1150, offerPrice: 230, unit: "1 Pcs", keywords: ["3 fancy", "fancy novelties"] },
  { name: "4 Fancy", category: "Fancy Novelties", price: 1750, offerPrice: 350, unit: "1 Pcs", keywords: ["4 fancy", "fancy novelties"] },
  { name: "12 Shot", category: "Fancy Novelties", price: 750, offerPrice: 150, unit: "1 Box", keywords: ["12 shot", "fancy novelties"] },
  { name: "4 Fancy Nygra", category: "Fancy Novelties", price: 1750, offerPrice: 350, unit: "1 Box", keywords: ["4 fancy nygra", "fancy novelties"] },
  { name: "Chotta fancy", category: "Fancy Novelties", price: 190, offerPrice: 38, unit: "1pcs", keywords: ["chotta fancy", "fancy novelties"] },
  { name: "240 shot", category: "Fancy Novelties", price: 15500, offerPrice: 3100, unit: "1box", keywords: ["240 shot", "fancy novelties"] },
  { name: "Purple rain", category: "Fancy Novelties", price: 11000, offerPrice: 2200, unit: "1 box", keywords: ["purple rain", "fancy novelties"] },
  { name: "Snake eye", category: "Fancy Novelties", price: 15000, offerPrice: 3000, unit: "1 box", keywords: ["snake eye", "fancy novelties"] },
  { name: "10x10 welcome shot", category: "Fancy Novelties", price: 20000, offerPrice: 4000, unit: "1 Box", keywords: ["10x10 welcome shot", "fancy novelties"] },

  // Paper Bomb
  { name: "1/4 Kg", category: "Paper Bomb", price: 250, offerPrice: 50, unit: "1 Box", keywords: ["1/4 kg", "paper bomb"] },
  { name: "1/2 Kg", category: "Paper Bomb", price: 500, offerPrice: 100, unit: "1 Box", keywords: ["1/2 kg", "paper bomb"] },
  { name: "1 Kg", category: "Paper Bomb", price: 900, offerPrice: 180, unit: "1 Box", keywords: ["1 kg", "paper bomb"] },
  { name: "Avatar", category: "Paper Bomb", price: 1700, offerPrice: 340, unit: "10pcs", keywords: ["avatar", "paper bomb"] },
  { name: "Rider", category: "Paper Bomb", price: 450, offerPrice: 90, unit: "5 pcs", keywords: ["rider", "paper bomb"] },
  { name: "Once More", category: "Paper Bomb", price: 500, offerPrice: 100, unit: "1 Box", keywords: ["once more", "paper bomb"] },

  // Fountain
  { name: "Gold laddu", category: "Fountain", price: 1825, offerPrice: 365, unit: "1box", keywords: ["gold laddu", "fountain"] },
  { name: "Silver laddu", category: "Fountain", price: 2250, offerPrice: 450, unit: "5pcs", keywords: ["silver laddu", "fountain"] },
  { name: "Peacock", category: "Fountain", price: 750, offerPrice: 150, unit: "1pcs", keywords: ["peacock", "fountain"] },
  { name: "Bada Peacock", category: "Fountain", price: 2000, offerPrice: 400, unit: "1pcs", keywords: ["bada peacock", "fountain"] },
  { name: "Korean Fir X-mas tree", category: "Fountain", price: 1300, offerPrice: 260, unit: "1 Box", keywords: ["korean fir x-mas tree", "fountain"] },
  { name: "VEL", category: "Fountain", price: 1250, offerPrice: 250, unit: "1 Box", keywords: ["vel", "fountain"] },
  { name: "Singing Pop", category: "Fountain", price: 650, offerPrice: 130, unit: "1 Box", keywords: ["singing pop", "fountain"] },
  { name: "Golden Peacock", category: "Fountain", price: 750, offerPrice: 150, unit: "1box", keywords: ["golden peacock", "fountain"] },
  { name: "20 Twenty", category: "Fountain", price: 700, offerPrice: 140, unit: "1 Box", keywords: ["20 twenty", "fountain"] },
  { name: "Peacock Feather", category: "Fountain", price: 500, offerPrice: 100, unit: "1box", keywords: ["peacock feather", "fountain"] },
  { name: "Golden Rain", category: "Fountain", price: 500, offerPrice: 100, unit: "1box", keywords: ["golden rain", "fountain"] },
  { name: "Golden Star", category: "Fountain", price: 500, offerPrice: 100, unit: "1box", keywords: ["golden star", "fountain"] },
  { name: "Silver Drops", category: "Fountain", price: 500, offerPrice: 100, unit: "1box", keywords: ["silver drops", "fountain"] },
  { name: "Touch and Touch", category: "Fountain", price: 500, offerPrice: 100, unit: "1 box", keywords: ["touch and touch", "fountain"] },
  { name: "King versions", category: "Fountain", price: 1000, offerPrice: 200, unit: "1 box", keywords: ["king versions", "fountain"] },
  { name: "Ganga jamuna", category: "Fountain", price: 450, offerPrice: 90, unit: "1 Box", keywords: ["ganga jamuna", "fountain"] },

  // Lars
  { name: "1k wala", category: "Lars", price: 1000, offerPrice: 200, unit: "1 Box", keywords: ["1k wala", "lars"] },
  { name: "2k wala", category: "Lars", price: 2000, offerPrice: 400, unit: "1 Box", keywords: ["2k wala", "lars"] },
  { name: "5k wala", category: "Lars", price: 4000, offerPrice: 800, unit: "1 Box", keywords: ["5k wala", "lars"] },
  { name: "10k wala", category: "Lars", price: 8000, offerPrice: 1600, unit: "1 Box", keywords: ["10k wala", "lars"] },
];

/**
 * Only states what the price list actually says - the item, its category and
 * its pack size - followed by the standard handling note. Nothing describes
 * an effect, burn time or colour, because the sheet records none and a seed
 * file is the wrong place to invent product claims.
 */
function buildDescription(product, categoryName) {
  const blurb = product.shortDescription?.trim();

  return (
    `${product.name} is part of our ${categoryName.toLowerCase()} range` +
    `${product.unit ? `, supplied as ${product.unit.toLowerCase()}` : ''}. ` +
    `${blurb ? `${blurb} ` : ''}` +
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

    // The price list carries a few items whose names are identical or differ
    // only by case, so an explicit slug distinguishes them. Without it the
    // second one collides and is skipped as "already present", silently
    // dropping a real product from the catalogue.
    const slug = entry.slug ?? slugify(entry.name);
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
