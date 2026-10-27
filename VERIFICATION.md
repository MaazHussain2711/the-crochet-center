# Verification — 27 October 2026

- JavaScript syntax checks and production application build passed.
- Seven backend integration tests passed: persistence/migrations, public catalogue and enquiry storage, validation, private admin workflows, origin/security/contact configuration, production fail-closed configuration and submission throttling.
- Browser workflow test submitted an enquiry to an isolated test database, read it in the admin desk, changed status, edited a product and verified the change in the storefront, then signed out. Temporary test customer data was removed with the isolated database.
- Chromium/Edge, Firefox and WebKit engine tests passed for responsive layout, product details, selection and enquiry dialog interactions. These are browser-engine tests on Windows, not physical iPhone/Android/macOS tests.
- Viewports 320, 390, 600, 768, 1024, 1440 and 1920 pixels had no horizontal overflow. Final desktop, phone and tablet renders were visually inspected. All catalogue images loaded. No JavaScript errors occurred in the tested workflows.
- Contact links were tested with isolated configuration; the real phone number remains unconfigured and WhatsApp is hidden. Confirmed Instagram remains available.
- Dependency audit reported zero vulnerabilities at installation time.
- Docker is not installed in this workspace; the container recipe has not been built here. Packaged production startup, health, storefront/admin/privacy routes and online SQLite backup all passed.
- Not publicly deployed. Production domain, hosting environment, persistent storage, credentials, backup scheduling and a real-device launch check remain operational setup work. Enquiries are stored, not automatically sent to Instagram, WhatsApp or email.

## GitHub Pages build

Project-subpath browser checks passed for all 20 products, loaded photos, product dialog, selection and custom enquiry preparation, copy interaction and privacy links. No JavaScript errors or failing HTTP responses occurred. The Pages artifact excludes backend code, admin assets, credentials and database files. The enquiry flow explicitly asks customers to copy and send their message on Instagram.

## Typography, accessibility and video refresh

- Drive was refreshed; two supplied MOV files were found in LOGOS AND OTHER IMAGES. The separate VIDEOS folder was empty. Both clips were inspected as contact sheets and converted to silent MP4; the sunflower bouquet was added as product 21. No new distinct product photos were found beyond the existing collection.
- Axe checked WCAG 2 A/AA, 2.1 AA and 2.2 AA rules on the storefront and product dialog, with zero reported violations. This automated check is not a full conformance certification or a screen-reader user study.
- Layout checks passed at 320, 390, 768, 1440 and 1920px. Text enlarged to 200% passed reflow checks at 320, 390, 768 and 1440px. Desktop, phone and tablet renders were inspected.
- Chromium, Firefox and WebKit passed motion preference/persistence, reduced-motion override, skip-link activation, menu Escape/focus return, product-dialog keyboard checks and playback of both videos. These are desktop engine tests, not physical device certification.
- Enquiry preparation, sorting, catalogue filters, image loading and bouquet selection passed with no page errors or HTTP failures in the local Pages build. Native video controls remain available, with captions and equivalent visible descriptions.
