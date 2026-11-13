# Doc Customizer

A multi-format document toolkit built with Next.js 15, TypeScript and Tailwind.

## Tools
| Tool | Where it runs |
|---|---|
| Organize PDF (merge, reorder, rotate, delete, extract) | Browser |
| Images to PDF | Browser |
| PDF to Images (zip) | Browser |
| OCR (tesseract.js, English) | Browser |
| Office (Word/Excel/PowerPoint/ODF) to PDF | Server, via LibreOffice (`/api/convert`) |

Everything except Office conversion runs entirely client-side, so files never leave the user's device.

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
- Split by range, compress, watermark, page numbers, password protect/unlock
- PDF to Word/Excel, more OCR languages, searchable-PDF output
- Accounts, history and cloud storage (optional)
- Automated tests and CI
