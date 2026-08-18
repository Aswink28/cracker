# Crackers Catalogue & WhatsApp Ordering Platform

A production-ready crackers/fireworks **product catalogue with a cart and a WhatsApp ordering flow**.

This is deliberately **not** an e-commerce site. There is no payment gateway, no card or UPI
integration and no checkout. Customers browse, build a cart, enter their details, and one tap
opens WhatsApp with the whole order written out. The shop owner confirms availability and the
final amount personally.

```
Browse → Search / Filter → Product Details → Cart → Customer Details
       → Order via WhatsApp → Owner confirms
```

---

## Contents

- [Architecture](#architecture)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Before you go live](#before-you-go-live)
- [Project structure](#project-structure)
- [API reference](#api-reference)
- [How caching and revalidation work](#how-caching-and-revalidation-work)
- [SEO implementation](#seo-implementation)
- [Themes](#themes)
- [Layout structure](#layout-structure)
- [Performance notes](#performance-notes)
- [Admin panel](#admin-panel)
- [Deployment](#deployment)
- [Testing checklist](#testing-checklist)
- [Known trade-offs](#known-trade-offs)

---

## Architecture

Two applications:

| | Stack | Role |
|---|---|---|
| **`web/`** | Next.js 16 (App Router), React 19, Tailwind CSS 4, Zustand, Axios, Lucide | Storefront + admin UI. Server-renders every public page. |
| **`server/`** | Node 20+, Express 5, MongoDB + Mongoose 9, Zod, JWT, Cloudinary | REST API, admin auth, image uploads. |

### Why Next.js rather than Vite + React

The original brief specified Vite. The catalogue is database-driven and edited through an admin
panel, which makes the rendering decision consequential:

- A **Vite SPA** serves crawlers an empty `<div id="root">`. Google can render JS, but on a
  delayed second pass, and WhatsApp/Facebook link previews get nothing at all — a real cost for a
  shop whose entire funnel is *found on Google → ordered on WhatsApp*.
- **Vite + build-time prerender** produces real HTML, but every price edit needs a rebuild and
  redeploy before crawlers see it.
- **Next.js App Router** server-renders each product page with its own metadata, prerenders all of
  them at build, and re-renders individual pages on demand when the admin saves — no redeploy.

The last option was chosen. Everything else in the brief (Express backend, Tailwind, Zustand,
Axios, Lucide, the folder layout) is unchanged. React Router is replaced by the App Router, since
the two cannot coexist.

The Express backend was kept as a **separate service** rather than collapsed into Next route
handlers, as specified. Next owns rendering and SEO; Express owns data and admin.

---

## Quick start

**Prerequisites:** Node.js 20+, and MongoDB running locally or a MongoDB Atlas connection string.

### 1. Backend

```bash
cd server
npm install
cp .env.example .env          # then edit .env — see below
npm run seed                  # creates categories, products and the first admin
npm run dev                   # http://localhost:5000
```

Minimum you must set in `server/.env` before seeding:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/crackers
JWT_SECRET=<at least 32 random characters>
ADMIN_EMAIL=you@example.com
ADMIN_PASSWORD=<at least 8 characters>
```

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

### 2. Frontend

```bash
cd web
npm install
cp .env.example .env.local    # then edit .env.local
npm run dev                   # http://localhost:3000
```

### 3. Production build

```bash
cd server && npm start
cd web && npm run build && npm run start
```

The build prerenders every product and category page as static HTML.

---

## Environment variables

Two `.env.example` files document every variable with inline comments. `.env` and `.env.local` are
git-ignored; `.env.example` is committed.

### `server/.env`

| Variable | Required | Notes |
|---|---|---|
| `MONGODB_URI` | yes | Local or Atlas connection string |
| `JWT_SECRET` | yes | 32+ characters. Boot fails if shorter. |
| `PORT` | no | Default `5000` |
| `NODE_ENV` | no | `development` / `production` |
| `FRONTEND_URL` | yes in prod | Comma-separated CORS allowlist |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | for uploads | Uploads return 503 until all three are set |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | for seeding | Used only by `npm run seed` |
| `REVALIDATE_URL` / `REVALIDATE_SECRET` | recommended | Lets admin edits refresh the storefront instantly |

Boot validates all of these with Zod and **exits with a readable error** rather than failing
mysteriously later.

### `web/.env.local`

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | yes | Real domain, no trailing slash. Drives canonicals, OG tags, sitemap. |
| `NEXT_PUBLIC_API_URL` | yes | Backend URL including `/api` |
| `API_URL` | no | Server-side override, e.g. a private network address |
| `NEXT_PUBLIC_STORE_NAME` | yes | |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | yes | Digits only, country code first: `919876543210` |
| `NEXT_PUBLIC_STORE_PHONE` | recommended | Used for `tel:` links |
| `NEXT_PUBLIC_STORE_EMAIL` / `_ADDRESS` / `_HOURS` / `_MAPS_URL` | optional | |
| `NEXT_REVALIDATE_SECRET` | recommended | Must match `REVALIDATE_SECRET` on the backend |
| `NEXT_PUBLIC_CATALOGUE_URL` | optional | Link to a catalogue PDF. Blank shows a WhatsApp request button instead of a dead download. |

> **Contact details are intentionally blank in the template.** Any field left empty is omitted from
> the page *and* from the `LocalBusiness` structured data. No placeholder city, address or opening
> hours is ever invented — publishing fabricated business data is both dishonest and a
> rich-results violation.

---

## Before you go live

- [ ] Set `NEXT_PUBLIC_SITE_URL` to the real domain — canonicals and the sitemap depend on it
- [ ] Set the real store name, WhatsApp number, phone, address and hours
- [ ] Generate a fresh `JWT_SECRET` and a fresh `REVALIDATE_SECRET`
- [ ] Change the seeded admin password
- [ ] Add the production storefront domain to `FRONTEND_URL` on the backend
- [ ] Add Cloudinary credentials, then upload real product photography via the admin panel
- [ ] Submit `https://yourdomain.com/sitemap.xml` in Google Search Console

Seeded products deliberately ship **without images** — the storefront renders a branded
placeholder instead. Seeding stock photos would put pictures on the site that do not match what
the shop actually sells.

---

## Project structure

```
server/
├── config/          env validation (Zod), Mongo connection, Cloudinary
├── models/          Product, Category, Admin, OrderEnquiry
├── middleware/      auth, validation, rate limiters, uploads, error handler
├── services/        business logic and all database queries
├── controllers/     HTTP layer only — no queries live here
├── routes/          route definitions and their validation schemas
├── validators/      Zod schemas shared across routes
├── utils/           slugify, ApiError
├── scripts/seed.js
├── app.js           Express app (middleware + routes)
└── server.js        boot, graceful shutdown

web/
├── app/
│   ├── layout.js                    <html>/<body> + pre-paint theme script only
│   ├── (shop)/layout.js             storefront chrome (header, footer, WhatsApp, loader)
│   ├── (shop)/page.js               home — offers marquee, catalogue, FAQ
│   ├── (shop)/products/page.js      listing (search, filters, sort, pagination)
│   ├── (shop)/products/[slug]/      detail — prerendered, Product JSON-LD
│   ├── (shop)/categories/[slug]/    category listing
│   ├── (shop)/cart/page.js          cart + customer details + WhatsApp handoff
│   ├── (shop)/about/ contact/
│   ├── admin/                       own dark chrome, code-split, noindex
│   ├── api/revalidate/route.js      cache invalidation webhook
│   ├── sitemap.js  robots.js  not-found.js  error.js
│   └── globals.css                  Tailwind theme + design tokens
├── components/                      ProductCard, ProductGrid, QuantitySelector, …
├── components/admin/                admin-only UI
├── lib/       api, config, format, whatsapp, seo, adminApi
├── store/     cart.js (Zustand + localStorage)
└── hooks/     useCart.js
```

---

## API reference

Base URL: `http://localhost:5000/api`

### Public

| Method | Endpoint | Notes |
|---|---|---|
| `GET` | `/health` | Reports DB state; 503 when degraded |
| `GET` | `/products` | Paginated. Query: `page`, `limit`, `search`, `category`, `minPrice`, `maxPrice`, `sort`, `featured`, `onOffer`, `inStock` |
| `GET` | `/products/slug/:slug` | Product + related items |
| `GET` | `/products/:id` | By id |
| `GET` | `/products/slugs` | All active slugs, for the sitemap |
| `GET` | `/categories` | With live product counts |
| `GET` | `/categories/slug/:slug` | |
| `POST` | `/order-enquiries` | Logs an order. Rate limited. |

`sort` accepts `popular`, `price-asc`, `price-desc`, `newest`, `discount`, `name`.

Listing response:

```json
{ "success": true, "products": [], "page": 1, "limit": 20, "total": 32, "totalPages": 2 }
```

### Admin (Bearer token)

| Method | Endpoint |
|---|---|
| `POST` | `/auth/login` |
| `GET` | `/auth/me` |
| `POST` `PUT` `DELETE` | `/products`, `/products/:id` |
| `POST` `PUT` `DELETE` | `/categories`, `/categories/:id` |
| `POST` `DELETE` | `/uploads/image` |
| `GET` | `/order-enquiries` |
| `PATCH` | `/order-enquiries/:id/status` |

### The order enquiry endpoint is optional by design

`POST /api/order-enquiries` gives the owner a record of every order sent. The storefront calls it
**fire-and-forget** and never awaits it. If the API is down, rate-limiting, or misconfigured, the
customer still reaches WhatsApp. The ordering flow has no dependency on it whatsoever.

Line totals are recomputed server-side rather than trusted from the request, since the payload is
unauthenticated.

---

## How caching and revalidation work

This is what makes server-rendered pages both fast and correct.

1. The storefront fetches catalogue data with a **cache tag** (`products`, `categories`,
   `product:<slug>`) and caches it, with a 1-hour time-based backstop.
2. When an admin saves a product, the Express API calls
   `POST /api/revalidate` on the storefront with a shared secret.
3. The storefront calls `revalidateTag(...)` and the affected pages re-render on the next request.

Verified end to end: an admin price change is live on the prerendered product page within seconds,
with no redeploy.

If `REVALIDATE_URL` / `REVALIDATE_SECRET` are not set, the API logs and skips the call, and pages
refresh on the 1-hour backstop instead. **A revalidation failure never fails an admin save** — the
data is already committed; only the cache is behind.

The webhook compares its secret in constant time (SHA-256 + `crypto.timingSafeEqual`).

---

## SEO implementation

| Requirement | Where |
|---|---|
| Unique title per page | `lib/seo.js` → `buildMetadata`, plus a title template in `app/layout.js` |
| Unique meta description | Built per product from its own copy — never a shared template |
| Canonical URLs | Every page. `/products` is canonical for all its filter/sort/page variants. |
| Open Graph + Twitter | `buildMetadata`, with the product image where one exists |
| `Product` + `Offer` JSON-LD | `lib/seo.js` → `productJsonLd` |
| `BreadcrumbList` JSON-LD | Built from the same trail array the visible breadcrumbs use, so they cannot drift |
| `LocalBusiness` / `Store` JSON-LD | Emits only configured fields |
| `ItemList` JSON-LD | Listing and category pages |
| SEO-friendly URLs | `/products/flower-pot-big`, `/categories/sparklers` |
| `sitemap.xml` | Generated from live data. Excludes `/cart` and `/admin`. |
| `robots.txt` | Disallows `/admin`, `/cart`, `/api/` |
| Image alt text | Derived from the product name; editable per image in the admin |
| Semantic HTML + one `h1` | Verified on every page |

**No fabricated data.** There is no `aggregateRating` or `review` in the structured data, because
the shop has no review data. Availability reflects the real `inStock` flag.

### Slugs are stable on purpose

Editing a product name does **not** regenerate its slug. Silently changing a slug would break every
indexed URL and inbound link. The admin can change it deliberately, and the form warns that doing
so breaks existing links.

### One SEO bug worth knowing about

`notFound()` in Next.js 16.3 returns **HTTP 200** if anything in the render path introduces a
Suspense boundary — a root `app/loading.js` does exactly that. The response streams, so the 200
header is committed before `notFound()` is reached. The result is a soft 404, which Google treats
as a quality problem.

This project therefore ships **no root `loading.js`**, and missing products and categories return a
genuine 404 (verified). Loading feedback is provided locally instead: the filter toolbar shows a
pending state, and the cart and admin render their own spinners.

If you add a `loading.js` above a route that can call `notFound()`, you will silently reintroduce
soft 404s across the catalogue.

### A fourth trap: the blanket reduced-motion reset

The usual `prefers-reduced-motion` reset applies `animation-duration: 0.01ms !important` to `*`.
That does not *disable* an animation, it snaps it to its final frame and leaves it there. For the
offers marquee - whose final frame is `translateX(-50%)` - the result was a strip frozen halfway
along, looking broken rather than simply still. Windows reports `reduce` whenever
Settings > Accessibility > Visual effects > Animation effects is off, so this hits real users.

The reset now excludes `[data-motion]` elements and *pauses* them instead. The marquee carries a
play/pause button whose default follows the OS preference and which the visitor can override -
which is also what WCAG 2.2.2 (Pause, Stop, Hide) requires of any auto-scrolling content.

### A third trap: click listeners and Next's `<Link>`

`<Link>` calls `preventDefault()` from React's **root-level** handler in order to take over the
navigation. A `document.addEventListener('click', ...)` in the bubble phase therefore runs *after*
React and sees an already-`defaultPrevented` event, so it cannot distinguish a real navigation from
a cancelled one. `ChakraLoader` registers with `{ capture: true }` for exactly this reason - the
loader silently never appeared until it did.

### A second trap: containing blocks and `position: fixed`

The header originally used `bg-white/95 backdrop-blur-sm`. `backdrop-filter` **establishes a
containing block for fixed-position descendants**, so the mobile drawer's `fixed inset-0` resolved
against the header's ~112px box instead of the viewport. The drawer rendered about 130px tall with
its nav squashed to a scrolling sliver.

Two changes prevent it recurring:

- the header is a solid `bg-white` (the blur was invisible behind a 95%-opaque bar and cost real
  paint time on mid-range phones);
- the drawer is rendered as a **sibling of `<header>`**, not a child, so it cannot be captured by
  header styling at all.

The same applies to `transform`, `filter`, `perspective` and `will-change`. Before adding any of
them to an ancestor, check whether anything `fixed` lives inside.

---

## Themes

Three palettes, chosen from the header and stored in `localStorage`:

| Theme | Look |
|---|---|
| `festive` (default) | Deep red and gold |
| `peacock` | Deep teal and gold |
| `midnight` | Dark surfaces, warm gold accents |

Switching sets `data-theme` on `<html>`, which re-points the `brand` and `ink` colour ramps in
`globals.css`. **No component reads the theme**, so adding a fourth palette is a CSS-only change.

The dark theme works by overriding `--color-white`, which flips every existing `bg-white` surface
and `text-white` label at once rather than requiring conditional classes throughout the codebase.
The WhatsApp button keeps a literal `#ffffff` so it stays legible on its fixed brand green.

An inline script in `app/layout.js` applies the saved theme **before first paint**. Doing it in an
effect would paint the default palette and then repaint - a visible flash on every load.

## Layout structure

Routes are split into two groups so the storefront and admin never share chrome:

- `app/(shop)/` — public pages, wrapped by the storefront header, footer, sticky cart bar, floating
  WhatsApp button and navigation loader.
- `app/admin/` — its own dark full-bleed bar with no logo, search or cart. The visual break is
  deliberate: it should be obvious at a glance which side you are on.
- `app/layout.js` — `<html>`/`<body>` and the theme script only.

## Performance notes

Measured on the production build, gzipped over the wire:

| Page | JS | CSS | HTML | Total |
|---|---|---|---|---|
| Home | 187 KB | 7.8 KB | 14.2 KB | **209 KB** |
| Products listing | 189 KB | 7.8 KB | 17.1 KB | **214 KB** |
| Product detail | 188 KB | 7.8 KB | 11.3 KB | **207 KB** |
| Admin | 202 KB | 7.8 KB | 6.8 KB | 217 KB |

Admin adds only ~15 KB over the public pages, confirming that the admin UI and `axios` are code-split
away from what a customer downloads.

What was done, and why:

- **The hero is type and a CSS gradient — no image or video.** The LCP element is a heading the
  browser can paint from the first HTML chunk. This is the single biggest win for a 4G visitor.
- **System font stack, no web font.** Zero network requests, zero render-blocking, zero swap shift.
- **`priority` is used only on genuine LCP images** — the product detail image, and the first four
  cards of the first grid. Everything else lazy-loads. Marking more as priority would slow the page,
  not speed it up.
- **Images carry intrinsic width/height** (stored on the product), so grids do not shift as images
  arrive. AVIF and WebP are served automatically; `deviceSizes` is trimmed to the widths actually
  rendered.
- **Product cards are server components.** Only the small add-to-cart control is client-side, so the
  grid itself costs no JavaScript.
- **Count and page fetch run concurrently** in `listProducts` — serialising them would double
  catalogue latency.
- **Category counts come from one grouped aggregation**, not one query per category.
- **List responses omit the long `description` field**, the largest contributor to payload size on a
  20-item page.
- **Compound indexes match the real query shapes**, each led by `active`.
- **The cart never calls the backend** on quantity changes; it is local state persisted to
  `localStorage`.

---

## Admin panel

`/admin` — sign in with the seeded credentials.

Add, edit and delete products and categories; upload images; set price, offer price, category and
keywords; mark items featured, active or out of stock; reorder categories.

Security:

- Every write is authorised **server-side** by `requireAdmin`. The UI gate only decides what to
  render — bypassing it changes nothing.
- The account is re-read from the database on every request, so disabling an admin takes effect
  immediately rather than when their JWT expires.
- Login is rate limited to 8 attempts per 15 minutes, and returns one generic message for both
  "no such account" and "wrong password" so the endpoint cannot enumerate valid emails.
- Passwords are bcrypt-hashed (cost 12) and the field is `select: false`, so it cannot leak through
  a controller that forgets to project fields.
- `/admin` is `noindex` in metadata **and** via an `X-Robots-Tag` header, and is `no-store`.
- Categories cannot be deleted while products still reference them.

The admin token is kept in `localStorage` rather than an httpOnly cookie, because the storefront and
API sit on different origins where a cookie would need `SameSite=None` plus credentialed CORS. The
trade-off is deliberate: the admin surface is small, tokens expire, and every request is
re-authorised server-side.

---

## Deployment

### Frontend → Vercel / Netlify / Cloudflare Pages

Root directory `web`, build `npm run build`, start `npm run start`. Set all `NEXT_PUBLIC_*`
variables plus `NEXT_REVALIDATE_SECRET`. A Node runtime is required (the app server-renders).

### Backend → Render / Railway / Fly / any Node host

Root directory `server`, start `npm start`. Set every variable from `server/.env.example`.
Set `FRONTEND_URL` to the deployed storefront origin, and `REVALIDATE_URL` to
`https://yourdomain.com/api/revalidate`.

`app.set('trust proxy', 1)` is already configured — without it the rate limiter would see one shared
proxy IP and throttle every user together.

Point the platform health check at `/api/health`. `SIGTERM` is handled: the server stops accepting
connections, drains in-flight requests, then closes the database.

### Database → MongoDB Atlas

The free tier is sufficient. Allowlist your backend host's IP, and run `npm run seed` once against
the production URI to create categories and the first admin.

### Images → Cloudinary

Uploads are transformed at upload time (max 1600px, `quality: auto`, `fetch_format: auto`), so the
original camera file is never served. Add `res.cloudinary.com` — already allowlisted in
`next.config.mjs`.

---

## Testing checklist

Verified during development against the production build:

**Functional** — home, listing, search, category filter, price filter, offer filter, sorting,
pagination, product detail, add to cart, quantity increase/decrease, remove, clear, cart persistence
across reloads, customer form validation, pickup vs delivery (address required only for delivery),
WhatsApp message format, WhatsApp URL encoding, call button, admin login, product CRUD, category
CRUD, category-delete guard.

**API** — pagination, weighted text search, category+sort filters, partial updates recomputing the
discount, offer-price validation, unauthenticated writes rejected (401), bad password rejected
(401), category delete blocked while products exist (409).

**SEO** — unique titles, per-product descriptions, canonicals, OG/Twitter tags, one `h1` per page,
`Product` and `BreadcrumbList` JSON-LD present in server HTML, 44 sitemap entries with `/cart` and
`/admin` excluded, robots.txt, and **real 404 status codes** for missing products and categories.

**Security headers** — `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
`Permissions-Policy` on all pages; `X-Robots-Tag: noindex` and `Cache-Control: no-store` on `/admin`.

**Responsive** — driven in a real browser (headless Edge) at 320, 375, 390, 414, 430, 768, 1024 and
1280px. At every width: no horizontal overflow, the mobile drawer fills the viewport, and no
interactive target falls below the 24px WCAG 2.5.8 minimum once stretched-link hit areas are taken
into account. The mobile ordering flow was exercised end to end: add to cart, quantity stepper,
sticky bar totals, empty-form validation with focus moved to the first bad field, and the
delivery-requires-address rule.

Tap targets worth knowing about: product card titles are 19px of text but the **whole card** is the
link (a stretched `::after` overlay), giving a 166×346 target on a phone. The compact "Add to Cart"
buttons in the grid are 36px — above the 24px AA minimum, below the 44px AAA ideal, a deliberate
trade-off to keep two columns readable at 320px.

### Not yet done

- **No automated test suite.** Everything above was verified by driving the running build, not by
  committed tests. Adding Vitest for `lib/whatsapp.js`, `lib/format.js` and the service layer would
  be the highest-value next step.
- **No physical-device testing.** The browser automation above emulates the viewports and touch, but
  nothing has been opened on real hardware.
- **No Lighthouse run.** The bundle and payload figures above are measured; the Core Web Vitals
  scores are not.
- **No Apple touch icon.** `app/icon.svg` provides the browser tab icon; iOS home-screen bookmarks
  want a PNG `apple-icon.png`, which needs real artwork rather than a generated placeholder.

---

## Known trade-offs

- **Category pages are server-rendered per request rather than static**, because they read
  `searchParams` for pagination. Crawlers still receive complete HTML, and the underlying data is
  cached by tag, so the cost is small. Making page 1 static would require splitting pagination onto
  a separate route.
- **The design is light-only.** No dark mode was specified, and adding one would double the design
  surface. `color-scheme: light` is declared so browsers do not auto-darken form controls into
  something unreadable.
- **Search is MongoDB's text index**, weighted name > keywords > short description > description.
  This is a good fit at this catalogue size; a few thousand products would justify Atlas Search.
- **Product images are optional.** A product without one renders a branded CSS placeholder rather
  than a broken image.

---

## Safety

Every product page and the footer carry safety guidance, and `/about#safety` holds the full version.
The wording follows local law and manufacturer instructions and states plainly that **no firework
can be described as completely safe**. Please keep it that way — do not replace it with marketing
claims about products being "100% safe" or "risk-free".
