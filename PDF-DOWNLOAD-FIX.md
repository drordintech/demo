# GRN / Challan PDF download — production fix

## Problem

**Download GRN PDF** and **Download Challan PDF** worked on `ng serve` (local Angular dev) but failed after `ng build` when the `dist` folder was deployed on a local server (IIS / any static host).

Saving the GRN still worked. Only the PDF buttons failed.

## Why it failed

PDFs are **not** downloaded from the API. They are generated in the browser with `html2pdf.js`.

The old code used a **webpack dynamic import**:

```ts
await import('html2pdf.js')
```

That behaves differently in the two environments:

| Environment | What happens |
|-------------|--------------|
| `ng serve` (development) | Library is not minified. `import('html2pdf.js')` works. Download succeeds. |
| `ng build` (production, default) | Angular splits `html2pdf.js` into a hashed lazy chunk and minifies `html2pdf` / `html2canvas` / `jspdf`. Those libraries often break after a second minify, or the export is no longer a function (`html2pdf is not a function`). Download fails. |

A second, related issue: if `dist` is opened as `file://` or hosted under a subfolder without matching `--base-href`, the lazy JS chunk 404s.

## What we changed

1. Copied the official pre-bundled file (already minified, not processed by webpack):

   `drodin-GRN/src/assets/vendor/html2pdf.bundle.min.js`

   Angular copies `src/assets` into `dist/assets` as-is.

2. Loaded that file from `drodin-GRN/src/index.html`:

   ```html
   <script src="assets/vendor/html2pdf.bundle.min.js" data-html2pdf-vendor="true"></script>
   ```

3. Updated `drodin-GRN/src/app/master/grn/grn.component.ts`:
   - Removed `import('html2pdf.js')`.
   - Resolve `window.html2pdf` (with a fallback script load if the tag missed).
   - Save via `pdf.save()`, with a **blob + `<a download>`** fallback if `save()` is blocked.
   - If `#printSection` / `#printSectionChallan` is missing, show an alert instead of failing silently.

## How to build and deploy (required)

Do **not** open `dist/index.html` by double-clicking (`file://`). Serve it over HTTP.

From `drodin-GRN`:

```bash
npm install
ng build --configuration production
```

Copy the **entire** `drodin-GRN/dist` folder to the web server (IIS site root, nginx root, etc.).

After copy, this file **must** exist on the server:

```
dist/assets/vendor/html2pdf.bundle.min.js
```

### Site is at the server root

Example: `http://localhost/` or `http://192.168.0.194/`

```bash
ng build --configuration production
```

Keep `<base href="/" />` (this is the default in `src/index.html`).

### Site is in a subfolder

Example: `http://localhost/GRN/`

```bash
ng build --configuration production --base-href /GRN/
```

Then copy `dist` contents into that `GRN` folder.

Do **not** use `npm run build-prod` unless the app is really hosted at `/angular/free/`. That script sets `--base-href /angular/free/`.

## How to verify

1. Open the deployed app in the browser (HTTP URL, not `file://`).
2. Press **F12** → **Network**.
3. Confirm `html2pdf.bundle.min.js` returns **200**.
4. Save a GRN → success popup → **Download GRN PDF** → **Download PDF**.
5. Repeat for **Download Challan PDF**.

If download still fails, the Console will show either:

- `Failed to load html2pdf.bundle.min.js` → file missing or wrong `--base-href`
- `html2pdf loaded but is not a function` → wrong/corrupt vendor file

## Related error: `Failed to submit GRN: 400 Bad Request`

If the alert says **Failed to submit GRN** and the URL is `/api/GRN/SaveGRN`, that is **not** a PDF download failure. The GRN must save first; the download buttons only appear after a successful save.

Typical 400 causes on the local IIS server (`192.168.x.x:8093`):

- Expiry date sent as an empty string (JSON cannot bind to `DateTime`)
- `productId` not a number
- Invoice files attached (`Choose Files`) making the JSON body larger than IIS default (~28 MB)

Fixes already applied in code:

- Frontend sends numeric `productId` and `expiryDate: null` when empty
- API accepts empty dates and larger request bodies (100 MB in Kestrel/IIS server options)
- API 400 responses now include a readable `message`

After rebuilding the **API** and the Angular `dist`, if IIS still returns 400 on large files, add this inside the API site `web.config` under `<system.webServer>`:

```xml
<security>
  <requestFiltering>
    <requestLimits maxAllowedContentLength="104857600" />
  </requestFiltering>
</security>
```

Then restart the IIS site on port **8093**.

## Files touched

| File | Change |
|------|--------|
| `drodin-GRN/src/assets/vendor/html2pdf.bundle.min.js` | Vendor library copied into assets (served as-is in `dist`) |
| `drodin-GRN/src/index.html` | Script tag to load the vendor file |
| `drodin-GRN/src/app/master/grn/grn.component.ts` | Production-safe PDF load + download; safe SaveGRN payload; clearer API errors |
| `APIDRODIN/.../Program.cs` | Larger request body; JSON date converter; readable 400 messages |
| `APIDRODIN/.../Controllers/GRNController.cs` | Nullable optional fields so model binding does not 400 |
