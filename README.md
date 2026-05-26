# heic-to-jpg.app

MVP website for the `heic to jpg` keyword.

## SEO page set

- `/` targets `heic to jpg`.
- `/heic-to-png/` targets `heic to png`.
- `/heic-to-pdf/` targets `heic to pdf`.
- `/heif-to-jpg/` targets `heif to jpg`.
- `/batch-convert-heic-to-jpg/` targets `batch convert heic to jpg`.
- `/iphone-heic-to-jpg/` targets `iphone heic to jpg`.
- `/heic-vs-jpg/` targets `heic vs jpg`.

Indexable SEO pages should each target one primary keyword and keep visible body copy above 800 words.
Utility pages such as About, Contact, Privacy, and Terms are `noindex,follow` and are excluded from the sitemap.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The converter runs fully in the browser. HEIC/HEIF files are decoded client-side and exported as JPG without uploading user photos.
