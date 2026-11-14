export type Faq = { q: string; a: string };
export type IconKey = "organize" | "split" | "rotate" | "compress" | "images" | "export" | "convert" | "ocr" | "scan" | "numbers" | "watermark" | "protect" | "unlock";
export type CategoryId = "organize" | "optimize" | "convert" | "edit" | "security";

export type Tool = {
  slug: string;
  href: string;
  title: string;
  seoTitle: string;
  desc: string;
  category: CategoryId;
  icon: IconKey;
  tint: string;
  server?: boolean;
  steps: string[];
  faqs: Faq[];
};

export const CATEGORIES: { id: CategoryId; title: string; blurb: string }[] = [
  { id: "organize", title: "Organize", blurb: "Merge, split, reorder and rotate pages" },
  { id: "optimize", title: "Optimize", blurb: "Make files smaller and easier to share" },
  { id: "convert", title: "Convert & scan", blurb: "Move between PDFs, images, Office files and text" },
  { id: "edit", title: "Edit", blurb: "Add page numbers and watermarks" },
  { id: "security", title: "Security", blurb: "Lock and unlock PDFs with a password" },
];

const PRIVACY_Q: Faq = {
  q: "Are my files uploaded anywhere?",
  a: "No. This tool runs entirely in your browser. Your files never leave your device and nothing is stored.",
};
const FREE_Q: Faq = { q: "Is there a limit or a watermark?", a: "No. There are no daily limits, no signup and no watermarks. It is free." };

const Y = "bg-yellow-200 text-ink dark:bg-yellow-300";
const G = "bg-emerald-200 text-ink dark:bg-emerald-300";
const O = "bg-orange-200 text-ink dark:bg-orange-300";
const B = "bg-sky-200 text-ink dark:bg-sky-300";
const P = "bg-pink-200 text-ink dark:bg-pink-300";
const L = "bg-violet-200 text-ink dark:bg-violet-300";

export const TOOLS: Tool[] = [
  {
    slug: "organize", href: "/tools/organize", title: "Merge & Organize PDF", category: "organize", icon: "organize", tint: Y,
    seoTitle: "Merge PDF Files & Reorder Pages — Free, No Signup",
    desc: "Merge PDFs, drag pages into order, rotate, delete and extract pages with live thumbnails.",
    steps: ["Add one or more PDF files.", "Drag pages into order, click to select, then rotate, delete or extract.", "Click Export PDF to download the result."],
    faqs: [
      { q: "How do I merge PDF files for free?", a: "Add all the PDFs you want to combine, drag the pages into the order you need, and export. There is no watermark, signup or limit." },
      { q: "Can I merge pages from different PDFs into one file?", a: "Yes. Pages from every file you add appear together, so you can interleave them in any order." },
      PRIVACY_Q,
    ],
  },
  {
    slug: "split", href: "/tools/split", title: "Split PDF", category: "organize", icon: "split", tint: G,
    seoTitle: "Split a PDF into Pages or Page Ranges — Free",
    desc: "Split a PDF into separate files by page range, or one file per page.",
    steps: ["Choose a PDF.", "Pick every page, or enter ranges like 1-3, 5, 8-.", "Download the result (a zip when there are several files)."],
    faqs: [
      { q: "How do I extract certain pages from a PDF?", a: "Enter the pages as a range, for example 2-4, 9. Each comma-separated item becomes its own PDF." },
      { q: "What does 8- mean?", a: "A range with no end means 'to the last page', and a range with no start means 'from the first page'." },
      PRIVACY_Q,
    ],
  },
  {
    slug: "rotate", href: "/tools/rotate", title: "Rotate PDF", category: "organize", icon: "rotate", tint: B,
    seoTitle: "Rotate PDF Pages Permanently — Free, No Signup",
    desc: "Rotate individual pages or the whole document and save it permanently.",
    steps: ["Choose a PDF.", "Rotate single pages, or use Rotate all.", "Download the rotated PDF."],
    faqs: [
      { q: "Is the rotation permanent?", a: "Yes. The rotated PDF opens the same way in every viewer." },
      { q: "Can I rotate only some pages?", a: "Yes. Use the buttons on each page, or Rotate all for the whole document." },
      PRIVACY_Q,
    ],
  },
  {
    slug: "compress", href: "/tools/compress", title: "Compress PDF", category: "optimize", icon: "compress", tint: O,
    seoTitle: "Compress PDF to Reduce File Size — Free, No Upload",
    desc: "Shrink large PDFs for email and uploads. Choose how much quality to trade for size.",
    steps: ["Choose a PDF.", "Pick a quality level.", "Compare the sizes and download the smaller file."],
    faqs: [
      { q: "How does compression work?", a: "Each page is re-rendered as an optimized image. This usually shrinks scanned or image-heavy PDFs a lot." },
      { q: "Will I still be able to select text?", a: "No. Compressed pages become images, so text can't be selected or searched afterwards. Keep your original if you need that, or run OCR on the result." },
      { q: "Why did my file get bigger?", a: "PDFs that are mostly text and vector graphics are already small. If the result is larger, keep your original." },
      PRIVACY_Q,
    ],
  },
  {
    slug: "images-to-pdf", href: "/tools/images-to-pdf", title: "Images to PDF", category: "convert", icon: "images", tint: G,
    seoTitle: "Convert JPG, PNG & WebP Images to PDF — Free, No Signup",
    desc: "Combine JPG, PNG and WebP images into one PDF, one image per page.",
    steps: ["Add your images.", "Reorder them or remove the ones you don't need.", "Click Create PDF."],
    faqs: [
      { q: "Which image formats are supported?", a: "JPG and PNG are embedded directly. Other formats your browser can display, like WebP, are converted automatically." },
      { q: "Will the image quality be reduced?", a: "No. JPG and PNG images are embedded as-is." },
      PRIVACY_Q,
    ],
  },
  {
    slug: "pdf-to-images", href: "/tools/pdf-to-images", title: "PDF to Images", category: "convert", icon: "export", tint: O,
    seoTitle: "Convert PDF to PNG Images — Free, No Signup",
    desc: "Export every page of a PDF as a high-quality PNG image, delivered as a zip.",
    steps: ["Choose a PDF.", "Wait while each page is rendered.", "Download the zip of PNG images."],
    faqs: [
      { q: "What resolution are the images?", a: "Pages are rendered at 2x scale, which is sharp enough for most screens and documents." },
      { q: "Is there a page limit?", a: "No fixed limit, but very large PDFs depend on your device's memory." },
      PRIVACY_Q,
    ],
  },
  {
    slug: "scan", href: "/tools/scan", title: "Scan to PDF", category: "convert", icon: "scan", tint: P,
    seoTitle: "Scan Documents to PDF with Your Camera — Free",
    desc: "Use your phone or webcam as a scanner. Capture pages, clean them up and save a PDF.",
    steps: ["Open the camera and capture each page, or add photos from your device.", "Choose a filter: original, grayscale or black & white.", "Reorder if needed and click Create PDF."],
    faqs: [
      { q: "Do I need to install an app?", a: "No. It works in your browser on phones and computers. You'll be asked for camera permission." },
      { q: "Which filter is best for text documents?", a: "Black & white gives the cleanest, smallest result for printed pages. Use Original for photos." },
      PRIVACY_Q,
    ],
  },
  {
    slug: "convert", href: "/tools/convert", title: "Office to PDF", category: "convert", icon: "convert", tint: B, server: true,
    seoTitle: "Convert Word, Excel & PowerPoint to PDF — Free",
    desc: "Convert Word, Excel, PowerPoint and OpenDocument files to PDF.",
    steps: ["Choose one or more documents.", "They are converted on our server.", "Download the PDF."],
    faqs: [
      { q: "Are my files uploaded?", a: "Yes. Office formats need a server to convert accurately. Files are processed in a temporary folder and deleted immediately after conversion; we do not keep or read them." },
      { q: "Which formats are supported?", a: "DOC, DOCX, ODT, RTF, TXT, XLS, XLSX, ODS, CSV, PPT, PPTX and ODP, up to 50 MB each." },
      FREE_Q,
    ],
  },
  {
    slug: "ocr", href: "/tools/ocr", title: "OCR", category: "convert", icon: "ocr", tint: P,
    seoTitle: "Extract Text from Scanned PDFs & Images (OCR) — Free",
    desc: "Turn scanned PDFs and photos into editable text, right in your browser.",
    steps: ["Choose a scanned PDF or an image.", "Wait while the text is recognized (the first run downloads the language model).", "Copy the text or download it as .txt."],
    faqs: [
      { q: "Which languages are supported?", a: "English for now. More languages are planned." },
      { q: "How accurate is it?", a: "Clear, high-contrast scans work best. Blurry or handwritten text will be less accurate." },
      PRIVACY_Q,
    ],
  },
  {
    slug: "page-numbers", href: "/tools/page-numbers", title: "Add Page Numbers", category: "edit", icon: "numbers", tint: L,
    seoTitle: "Add Page Numbers to a PDF — Free, No Signup",
    desc: "Number the pages of a PDF. Choose position, format and starting number.",
    steps: ["Choose a PDF.", "Set position, format and start number.", "Download the numbered PDF."],
    faqs: [
      { q: "Can I skip the cover page?", a: "Yes. Tick 'Don't number the first page'; numbering then starts from the second page." },
      { q: "Can I start numbering from a different number?", a: "Yes. Set the start number to any value." },
      PRIVACY_Q,
    ],
  },
  {
    slug: "watermark", href: "/tools/watermark", title: "Add Watermark", category: "edit", icon: "watermark", tint: Y,
    seoTitle: "Add a Text Watermark to a PDF — Free, No Signup",
    desc: "Stamp text like DRAFT or CONFIDENTIAL across every page.",
    steps: ["Choose a PDF.", "Type your text and adjust size, angle, colour and opacity.", "Download the watermarked PDF."],
    faqs: [
      { q: "Can I use any language or emoji?", a: "Letters, numbers and common punctuation in Latin scripts work. Other scripts and emoji are not supported yet." },
      { q: "Can the watermark be removed?", a: "It is drawn onto the page, so it can't be toggled off, but it isn't tamper-proof. Don't rely on it for security." },
      PRIVACY_Q,
    ],
  },
  {
    slug: "protect", href: "/tools/protect", title: "Protect PDF", category: "security", icon: "protect", tint: G,
    seoTitle: "Password Protect a PDF (AES-256) — Free, No Upload",
    desc: "Lock a PDF with a password using AES-256 encryption.",
    steps: ["Choose a PDF.", "Enter a password.", "Download the encrypted PDF."],
    faqs: [
      { q: "How strong is the encryption?", a: "AES-256, the standard used by modern PDF viewers." },
      { q: "What if I forget the password?", a: "It can't be recovered. Keep the password somewhere safe." },
      PRIVACY_Q,
    ],
  },
  {
    slug: "unlock", href: "/tools/unlock", title: "Unlock PDF", category: "security", icon: "unlock", tint: O,
    seoTitle: "Remove a PDF Password You Know — Free, No Upload",
    desc: "Remove the password from a PDF when you know it, so it opens without one.",
    steps: ["Choose the locked PDF.", "Enter its password.", "Download the unlocked copy."],
    faqs: [
      { q: "Can this crack a PDF I don't have the password for?", a: "No. You must know the password. This tool only removes protection from files you can already open." },
      { q: "Is it legal to use?", a: "Only use it on documents you own or have permission to modify." },
      PRIVACY_Q,
    ],
  },
];

export const getTool = (slug: string) => {
  const t = TOOLS.find((x) => x.slug === slug);
  if (!t) throw new Error(`Unknown tool: ${slug}`);
  return t;
};

export const SITE_NAME = "PDFRookie";
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/$/, "");
