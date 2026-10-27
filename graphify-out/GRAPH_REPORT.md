# Graph Report - autocentar-dea  (2026-10-24)

## Corpus Check
- 132 files · ~132,340 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 4 file(s) not represented in the graph (top: .woff2 2, (none) 1, .css 1)

## Summary
- 701 nodes · 2015 edges · 32 communities (25 shown, 7 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 31 edges (avg confidence: 0.85)
- Token cost: 199,048 input · 0 output

## Community Hubs (Navigation)
- Admin Server Actions
- Public Site Pages & SEO
- Database Schema & Rules
- Admin Panel Pages
- Inquiry & Auth Actions
- Home & Listing Components
- Site Layout & Contact
- Dev Dependencies
- TypeScript Config
- Admin Auth Shell
- Security Config & Authorization
- Listing Filters
- Domain Types & Constants
- Search Suggestions
- Showroom & Car Photos
- RLS Database Tests
- Validation Schemas
- Runtime Dependencies
- Project Overview Docs
- Vehicle Edit Form
- Brand Logos & Icons
- npm Scripts
- Session Proxy
- Env & Deployment
- ESLint Config
- Vitest Config
- Vercel Config
- Password Reset Flow
- PostCSS Config
- Email Notifications

## God Nodes (most connected - your core abstractions)
1. `next` - 65 edges
2. `lucide-react` - 37 edges
3. `getSiteSettings` - 32 edges
4. `Notice()` - 23 edges
5. `assertAdmin()` - 23 edges
6. `requireAdmin()` - 22 edges
7. `public.vehicles` - 21 edges
8. `VehicleListing()` - 20 edges
9. `parseFilters()` - 20 edges
10. `VehicleDetailView()` - 19 edges

## Surprising Connections (you probably didn't know these)
- `App Favicon (DEA circular badge, 512px)` --semantically_similar_to--> `DEA Badge 512px (black circle, white DEA, red/white swoosh)`  [INFERRED] [semantically similar]
  app/icon.png → public/brand/dea-badge-512.png
- `InquiryForm()` --indirect_call--> `submitInquiry()`  [INFERRED]
  components/site/InquiryForm.tsx → app/actions/inquiry.ts
- `LoginForm()` --indirect_call--> `signIn()`  [INFERRED]
  components/admin/AuthForms.tsx → app/admin/actions/auth.ts
- `ResetRequestForm()` --indirect_call--> `requestPasswordReset()`  [INFERRED]
  components/admin/AuthForms.tsx → app/admin/actions/auth.ts
- `PasswordForm()` --indirect_call--> `updatePassword()`  [INFERRED]
  components/admin/AuthForms.tsx → app/admin/actions/auth.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Inquiry submission pipeline (Zod, honeypot, Turnstile, submit_inquiry, rate limit)** — app_actions_inquiry, readme_zod_validation, readme_honeypot, lib_turnstile, readme_submit_inquiry, readme_rate_limiting, readme_table_inquiries [EXTRACTED 1.00]
- **Photo upload pipeline (route, signature check, sharp WebP, bucket, vehicle_images)** — app_api_admin_vozila_id_slike_route, readme_photo_upload_security, readme_sharp_image_processing, readme_vehicle_images_bucket, readme_table_vehicle_images [INFERRED 0.85]
- **Defense-in-depth admin authorization** — proxy, app_admin_actions, readme_admin_authorization, readme_is_admin, readme_table_admins, readme_rls [INFERRED 0.85]
- **DEA favicon / Apple touch / PWA icon set** — app_icon, app_apple_icon, public_brand_icon_192, public_brand_icon_512, public_brand_dea_badge_512 [INFERRED 0.85]
- **DEA theme logo pair (light/dark)** — public_brand_dea_logo_dark, public_brand_dea_logo_light, theme_aware_logo_variants [INFERRED 0.85]
- **Audi R8 listing photo set** — public_images_audi_r8_interijer, public_images_audi_r8_prednja, public_images_audi_r8_volan, public_images_salon_audi_r8, audi_r8 [INFERRED 0.85]
- **Ferrari Roma listing photo set** — public_images_ferrari_roma_interijer, public_images_ferrari_roma_straga, public_images_ferrari_roma_straznja, public_images_salon_ferrari_roma, ferrari_roma [INFERRED 0.85]
- **Showroom / brand ambience shots (hero, about page)** — public_images_salon_dea_vanjski, public_images_salon_audi_r8, public_images_salon_ferrari_roma, dea_showroom [INFERRED 0.75]

## Communities (32 total, 7 thin omitted)

### Community 0 - "Admin Server Actions"
Cohesion: 0.06
Nodes (69): updatePassword(), deleteImage(), reorderImages(), reorderSchema, updateImageAlt(), deleteInquiry(), patchSchema, updateInquiry() (+61 more)

### Community 1 - "Public Site Pages & SEO"
Cohesion: 0.08
Nodes (64): BrandIndexRow, GET(), revalidate, ContactPage(), generateMetadata(), revalidate, AboutPage(), ICONS (+56 more)

### Community 2 - "Database Schema & Rules"
Cohesion: 0.06
Nodes (54): Sigurnosne kopije (supabase db dump), submit_inquiry (DB function), Supabase (PostgreSQL, Auth, Storage, RLS), inquiries table, vehicle_images table, vehicle_internal table, vehicles table, admins_protect_last (+46 more)

### Community 3 - "Admin Panel Pages"
Cohesion: 0.08
Nodes (42): metadata, metadata, NewPasswordPage(), AdminVehiclesPage(), metadata, Row, SORTS, metadata (+34 more)

### Community 4 - "Inquiry & Auth Actions"
Cohesion: 0.07
Nodes (34): clientIp(), hashIp(), InquiryState, submitInquiry(), loginSchema, passwordSchema, requestPasswordReset(), signIn() (+26 more)

### Community 5 - "Home & Listing Components"
Cohesion: 0.11
Nodes (40): HIGHLIGHT_ICONS, HomePage(), revalidate, EmptyState(), Gallery(), InquiryForm(), EditorialCard(), resultLabel() (+32 more)

### Community 6 - "Site Layout & Contact"
Cohesion: 0.15
Nodes (26): metadata, PreviewPage(), SiteLayout(), BottomNav(), ICONS, ContactDetails(), Footer(), Header() (+18 more)

### Community 7 - "Dev Dependencies"
Cohesion: 0.12
Nodes (21): devDependencies, eslint@^9.39.5, tailwindcss@^4.3.3, @tailwindcss/postcss@^4.3.3, @types/node@^22.20.5, @types/react@^19.3.0, @types/react-dom@^19.3.0, typescript@^5.9.3 (+13 more)

### Community 8 - "TypeScript Config"
Cohesion: 0.10
Nodes (20): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+12 more)

### Community 9 - "Admin Auth Shell"
Cohesion: 0.20
Nodes (13): AuthShell(), PanelLayout(), LoginPage(), metadata, ForgotPasswordPage(), metadata, active(), AdminBottomNav() (+5 more)

### Community 10 - "Security Config & Authorization"
Cohesion: 0.12
Nodes (12): app/admin/actions (Server Actions), csp, nextConfig, securityHeaders, supabase, npm run admin:create, is_admin() DB function, JSON-LD (AutoDealer, WebSite, BreadcrumbList, Car, Offer) (+4 more)

### Community 11 - "Listing Filters"
Cohesion: 0.15
Nodes (15): FilterFields(), Filters(), Props, SortSelect(), useSubmit(), BODY_TYPES, CATEGORIES, FUEL_TYPES (+7 more)

### Community 12 - "Domain Types & Constants"
Cohesion: 0.18
Nodes (16): VehicleImage, BodyType, Currency, Drivetrain, FuelType, INQUIRY_STATUS_LABELS, INQUIRY_STATUSES, InquiryStatus (+8 more)

### Community 13 - "Search Suggestions"
Cohesion: 0.24
Nodes (14): loadIndex(), SearchSuggest(), choose(), onKeyDown(), update(), IndexRow, normalize(), suggest() (+6 more)

### Community 14 - "Showroom & Car Photos"
Cohesion: 0.23
Nodes (14): Audi R8 (yellow, vehicle in stock), DEA brand logo / plate (061 310 330), Auto Centar DEA showroom (hexagon LED ceiling, marble floor), Ferrari F8 Tributo (red), Ferrari Roma (dark blue-grey, vehicle in stock), Audi R8 interior photo (cockpit, dashboard, center console), Yellow Audi R8 front three-quarter in showroom (DEA plate), Audi R8 steering wheel close-up (virtual cockpit) (+6 more)

### Community 15 - "RLS Database Tests"
Cohesion: 0.14
Nodes (6): @electric-sql/pglite@^0.5.11, @electric-sql/pglite, IP_A, IP_B, Role, ROOT

### Community 16 - "Validation Schemas"
Cohesion: 0.15
Nodes (8): CURRENCIES, checkbox, CURRENT_YEAR, inquirySchema, ParsedVehicleForm, quickUpdateSchema, VEHICLE_FORM_FIELDS, VehicleFormValues

### Community 17 - "Runtime Dependencies"
Cohesion: 0.15
Nodes (13): dependencies, @fontsource-variable/archivo@^5.3.0, lucide-react@^1.61.0, next@^16.4.2, react@^19.3.1, react-dom@^19.3.1, server-only@^0.0.1, sharp@^0.35.5 (+5 more)

### Community 18 - "Project Overview Docs"
Cohesion: 0.18
Nodes (9): node_modules/next/dist/docs, generate-agent-files.js, Administracija (/admin), Auto Centar DEA web stranica i administracija, Ručna provjera s pravim Supabaseom, Next.js 16 (App Router, Turbopack), Preostalo prije produkcije, Javni dio (public site) (+1 more)

### Community 19 - "Vehicle Edit Form"
Cohesion: 0.22
Nodes (9): VehicleFormState, EditableVehicle, Section(), toFormValues(), moneyToInput(), BODY_LABELS, DRIVETRAIN_LABELS, DRIVETRAINS (+1 more)

### Community 20 - "Brand Logos & Icons"
Cohesion: 0.29
Nodes (10): Apple Touch Icon (DEA circular badge, ~180px), App Favicon (DEA circular badge, 512px), DEA Brand Mark (DEA wordmark with car-silhouette swoosh), DEA Circular Badge (white mark on black circle), DEA Badge 512px (black circle, white DEA, red/white swoosh), DEA Logo Dark (black text + red swoosh, for light backgrounds), DEA Logo Light (white text + red swoosh on transparent, for dark backgrounds), PWA Icon 192px (DEA circular badge) (+2 more)

### Community 21 - "npm Scripts"
Cohesion: 0.20
Nodes (10): scripts, admin:create, build, check, dev, lint, start, test (+2 more)

### Community 22 - "Session Proxy"
Cohesion: 0.40
Nodes (3): @supabase/ssr@^0.12.7, config, @supabase/ssr

### Community 23 - "Env & Deployment"
Cohesion: 0.50
Nodes (4): .env.example, Varijable okruženja, sharp obrada slika (WebP re-encode), Objava na Vercelu

### Community 24 - "ESLint Config"
Cohesion: 0.50
Nodes (3): config, eslint-config-next@^16.4.2, eslint-config-next

## Ambiguous Edges - Review These
- `DEA Logo Dark (black text + red swoosh, for light backgrounds)` → `DEA Logo Light (white text + red swoosh on transparent, for dark backgrounds)`  [AMBIGUOUS]
  public/brand/dea-logo-light.png · relation: semantically_similar_to
- `DEA showroom exterior facade with red Ferrari F8` → `Ferrari Roma (dark blue-grey, vehicle in stock)`  [AMBIGUOUS]
  public/images/salon-dea-vanjski.jpg · relation: references

## Knowledge Gaps
- **16 isolated node(s):** `node_modules/next/dist/docs`, `generate-agent-files.js`, `Zaboravljena lozinka / reset flow`, `auth/potvrda (email link confirmation)`, `.env.example` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 183 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Admin Panel Pages` to `Admin Server Actions`, `Public Site Pages & SEO`, `Inquiry & Auth Actions`, `Home & Listing Components`, `Site Layout & Contact`, `Dev Dependencies`, `Admin Auth Shell`, `Security Config & Authorization`, `Listing Filters`, `Runtime Dependencies`, `Vehicle Edit Form`, `Session Proxy`?**
  _High betweenness centrality (0.256) - this node is a cross-community bridge._
- **What connects `node_modules/next/dist/docs`, `generate-agent-files.js`, `Zaboravljena lozinka / reset flow` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin Server Actions` be split into smaller, more focused modules?**
  _Cohesion score 0.05937353903693315 - nodes in this community are weakly interconnected._
- **Why does `vitest` connect `Vitest Config` to `Search Suggestions`, `RLS Database Tests`, `Home & Listing Components`, `Dev Dependencies`?**
  _High betweenness centrality (0.081) - this node is a cross-community bridge._
- **Should `Public Site Pages & SEO` be split into smaller, more focused modules?**
  _Cohesion score 0.07889190003011141 - nodes in this community are weakly interconnected._

### Low-confidence Hints
_AMBIGUOUS edges — the extractor was unsure. Verify before acting on these._

- **What is the exact relationship between `DEA Logo Dark (black text + red swoosh, for light backgrounds)` and `DEA Logo Light (white text + red swoosh on transparent, for dark backgrounds)`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **What is the exact relationship between `DEA showroom exterior facade with red Ferrari F8` and `Ferrari Roma (dark blue-grey, vehicle in stock)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._