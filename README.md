# Doc Customizer

A multi-format document toolkit built with Next.js 15, TypeScript and Tailwind.

## Tools
| Category | Tool | Runs |
|---|---|---|
| Organize | Merge & Organize, Split, Rotate | Browser |
| Optimize | Compress | Browser |
| Convert & scan | Images to PDF, PDF to Images, Scan to PDF (camera), OCR | Browser |
| Convert & scan | Office (Word/Excel/PowerPoint/ODF) to PDF | Server, via LibreOffice (`/api/convert`) |
| Edit | Page numbers, Watermark | Browser |
| Security | Protect (AES-256), Unlock | Browser (qpdf WebAssembly) |

Everything except Office conversion runs entirely client-side, so files never leave the user's device.

## Feature requests
`/request` lets visitors ask for tools or features. Submissions become public GitHub issues labelled `from-website`.
To enable it, set `FEEDBACK_GITHUB_TOKEN` (a fine-grained token limited to this repo with *Issues: read & write*) in your host's environment variables. See `.env.example`. Without it the page falls back to a pre-filled GitHub issue link.

## Development
```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck && npm run lint && npm run build
```
Office conversion needs LibreOffice (`soffice`) on the server's PATH. Use the included `Dockerfile` for a self-contained deployment:
```bash
docker build -t doc-customizer . && docker run -p 3000:3000 doc-customizer
```
Note: Vercel-style serverless hosting cannot run LibreOffice; deploy the Docker image (Fly.io, Render, Cloud Run, etc.) if you need that tool.

## Roadmap
- PDF to Word/Excel, more OCR languages, searchable-PDF output
- Accounts, history and cloud storage (optional)
- Automated tests and CI
