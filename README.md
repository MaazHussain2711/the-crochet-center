# The Crochet Center

Responsive enquiry storefront with a Node.js 24 / Express backend and SQLite database. No payments are enabled. The Instagram account is confirmed; WhatsApp and email are hidden until configured. All prices are on request.

## Live GitHub Pages storefront

The public site is https://maazhussain2711.github.io/the-crochet-center/ . `npm run build:pages` creates `dist-pages/` containing only the storefront, public catalogue, photos and privacy page. GitHub Actions tests the application and deploys that artifact on pushes to main.

On GitHub Pages, enquiries are prepared locally for the customer to copy and send to the confirmed Instagram account. No enquiry database, automatic messaging, private admin or payment service is active on Pages. The UI explains that a prepared message has not been sent. WhatsApp remains hidden until a business number is supplied. The server-backed version described below remains available for a future backend host.

## Run the server-backed version locally

1. Install Node.js 24.13 or a newer Node 24 release.
2. Run `npm ci`.
3. Copy `.env.example` to `.env`. Set a unique `ADMIN_PASSWORD` of at least 16 characters. Do not commit `.env`.
4. Run `npm start`. Open http://127.0.0.1:5174. Shop management is at `/admin`.

Without an admin password the local storefront works, but admin sign-in is disabled. Production refuses to start without an HTTPS `PUBLIC_URL` and a strong admin password.

## Workflow

Customers browse 20 products, inspect alternate photos, search/filter, save favourites and create a selection. The enquiry form saves their contact preference, items and custom notes to the database and returns a reference. It does not send email, WhatsApp or Instagram messages automatically. The owner checks `/admin`, replies using the customer's supplied channel and changes status from new to contacted, completed or archived. The admin desk also edits product names, descriptions, categories, images and visibility, and can add products using existing deployed images.

The initial `catalogue.json` seeds a new database once. After that, the database owns product changes; editing the seed does not overwrite admin edits. Add new image files in `assets/images`, deploy, then add their paths in the product editor. Descriptive names were inferred from supplied photographs and remain editable. Images and logo were supplied through the user's Drive folder. Original source-to-image mappings are in the parent workspace's `reference` folder.

## Check and build

```
npm run check
npm test
npm run build
```

`dist/` is the packaged Node application. It excludes the runtime database, credentials and local environment. It is not a static-only export.

## Deploy

Use a Node-capable host with HTTPS and a persistent local disk, or Docker behind an HTTPS reverse proxy. GitHub Pages cannot run this application. Use one server replica with SQLite; use Postgres before scaling across replicas.

For Docker: run `npm run build`, configure `.env`, then `docker compose up --build -d`. The app is bound to local port 8080; route your HTTPS reverse proxy to it. Set `PUBLIC_URL` to the exact public HTTPS origin and `TRUST_PROXY=1` only when there is exactly one trusted reverse proxy. With a direct Node deployment set `HOST`, `PORT` and `DATABASE_PATH` as required. Do not use an ephemeral/serverless filesystem.

Set `WHATSAPP_NUMBER` to the business number with country code and digits only when supplied. Set `CONTACT_EMAIL` if desired. Instagram defaults to `the_crochet_center_`. Enquiries work before those optional channels are added. Health endpoint: `/api/health`.

Before public launch: configure the domain and credentials, verify a real enquiry reaches the admin desk, confirm the business's product descriptions and fulfilment terms, and test the configured contact links on a phone. No shipping timings, prices or return promises have been invented.

## Data and operations

Schema migration 1 is applied automatically and recorded in `migrations`; later migrations must be additive and versioned. SQLite uses WAL and prepared statements. Keep `/data` on persistent storage with restrictive access. Back up SQLite using its online backup interface (`node scripts/backup.cjs /absolute/backup/path.sqlite`) or stop the application and back up the entire data directory. Test restoring before launch. Backups contain customer contact details; restrict access and apply the shop's retention policy. Do not copy only the main SQLite file while the service is running. Do not add `data` to Git. Admin sessions expire after eight hours. To revoke all sessions after a password change, clear the `sessions` table or use a fresh database only after a verified backup and migration plan.

The owner should review stored enquiries regularly and establish retention/deletion procedures appropriate to the business. Privacy requests can be handled through Instagram using the enquiry reference. An authenticated delete API (`DELETE /api/admin/enquiries/:id`, JSON body `{}`) removes a selected enquiry permanently; remove expired copies from backups under the retention policy as well.

The application does not deliver notifications. Review the admin desk regularly. Configure server uptime/error monitoring through your host.

## Payments later

Keep the enquiry data separate from a future order/payment ledger. Add server-confirmed quotations in integer paise, customer approval, expiring payment links and a gateway order per payment. Verify both checkout and webhook signatures, reconcile captured amounts/currency server-side, and make webhook handling idempotent. Add refunds, shipping/tax rules, stock reservation, notifications and fulfilment states before enabling checkout. Never accept a client-provided payment total or label a browser callback as paid. Razorpay is a possible provider, subject to the owner's choice, merchant onboarding and test-mode verification. No payment credentials or payment SDK are included in this enquiry-first release.
