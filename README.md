# PDFRookie

A multi-format document toolkit built with Next.js 15, TypeScript and Tailwind.

## Tools
| Category | Tool | Runs |
|---|---|---|
| Organize | Merge & Organize, Split, Rotate | Browser |
| Optimize | Compress | Browser |
| Convert & scan | Images to PDF, PDF to Images, Scan to PDF (camera), OCR | Browser |
| Convert & scan | Word to PDF (DOCX, DOC, ODT, RTF, TXT) | Separate converter service (`/converter`, LibreOffice) |
| Edit | Page numbers, Watermark | Browser |
| Security | Protect (AES-256), Unlock | Browser (qpdf WebAssembly) |

Everything except Word conversion runs entirely client-side, so files never leave the user's device.

## Feature requests
`/request` lets visitors ask for tools or features. Submissions become public GitHub issues labelled `from-website`.
To enable it, set `FEEDBACK_GITHUB_TOKEN` (a fine-grained token limited to this repo with *Issues: read & write*) in your host's environment variables. See `.env.example`. Without it the page falls back to a pre-filled GitHub issue link.

## Development
```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck && npm run lint && npm run build
```
## Word to PDF converter
LibreOffice cannot run on Vercel, so conversion lives in a small standalone service in [`/converter`](converter/server.mjs) (Docker, no npm dependencies). The browser sends files straight to it.
The tool is **hidden from the site until `NEXT_PUBLIC_CONVERTER_URL` is set**, so visitors never see a broken tool.

Deploy on Fly.io (scales to zero, so you pay only while it converts):
```bash
cd converter
fly launch --no-deploy --copy-config   # pick a unique app name when asked
fly deploy
```
Then in Vercel set `NEXT_PUBLIC_CONVERTER_URL=https://<your-app>.fly.dev` and redeploy. The service only accepts requests from the origins in `ALLOWED_ORIGINS` (edit `converter/fly.toml`).
Limits (env vars): `CONVERT_MAX_BYTES` (50 MB), `CONVERT_TIMEOUT_MS` (60 s), `CONVERT_MAX_CONCURRENT` (2), `CONVERT_RATE_LIMIT` (20 conversions per IP per hour). The same Dockerfile also works on Google Cloud Run or Render.

## Roadmap
- PDF to Word/Excel, more OCR languages, searchable-PDF output
- Accounts, history and cloud storage (optional)
- Automated tests and CI

## Languages
English is the default; other languages are built in but switched off until reviewed. See [docs/I18N.md](docs/I18N.md) for how translations work, how to enable a language, and the review checklist.
