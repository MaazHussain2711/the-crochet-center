# Implementation and launch plan

## Implemented: enquiry-first release

- Existing pink/lavender brand, supplied logo and 20 product records with alternate images.
- Responsive storefront, product details, local favourites and selection, search and category filters.
- Persisted enquiries with preferred contact channel, validation, consent and unique reference.
- Private password-protected admin desk for enquiry status and product management.
- Confirmed Instagram contact. WhatsApp and email enabled by server configuration when supplied.
- SQLite migrations, HTTP security headers, admin session expiry, CSRF origin checks and request limits.
- Node application build, Docker deployment recipe, continuous-integration workflow and backup helper.
- Privacy/enquiry information and factual ordering/delivery explanations without invented commercial terms.

## Launch configuration

Choose a Node-capable host and domain. Set an HTTPS PUBLIC_URL, unique ADMIN_PASSWORD and persistent DATABASE_PATH. Mount persistent storage and keep one application instance with SQLite. Configure the HTTPS proxy and backups. The previous static GitHub Pages deployment is replaced by CI because Pages cannot run the API.

The local preview has a generated password stored only in website/.env (ignored by Git and excluded from the deployment archive). Set a separate production password through the host's secret/environment settings.

When the business WhatsApp number is supplied, set WHATSAPP_NUMBER to country-code digits. Email is optional. Check the admin desk for new requests; this release does not send automatic notifications.

Confirm the photograph-based product names, available variations and commercial fulfilment terms with the owner. No prices, delivery promises or payment details have been invented.

## Later: payments, after business approval

1. Confirm provider, merchant account, product pricing, stock/availability, delivery charges, applicable tax and cancellation/refund terms.
2. Add separate order and quote tables. Snapshot agreed product options and totals in integer paise; link to the enquiry without changing its history.
3. Build expiring, customer-approved quotes and gateway orders created server-side. Keep secret keys on the server.
4. Verify checkout and raw-body webhook signatures, reconcile captured payment amount/currency against the stored quote and enforce unique payment/event identifiers.
5. Add payment retry/cancellation, refund tracking, stock reservation, transactional notifications and fulfilment states.
6. Complete gateway sandbox transactions and webhook replay/mismatch tests before live activation.

No payment SDK, checkout button or live credentials are present in the current release, in accordance with the owner's enquiry-first decision.
