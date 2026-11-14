export type Faq = { q: string; a: string };
export type Tool = {
  slug: string;
  href: string;
  title: string;
  seoTitle: string;
  desc: string;
  icon: "organize" | "images" | "export" | "convert" | "ocr";
  tint: string; // tailwind classes for the icon tile
  server?: boolean;
  steps: string[];
  faqs: Faq[];
};

const PRIVACY_Q: Faq = {
  q: "Are my files uploaded anywhere?",
  a: "No. This tool runs entirely in your browser. Your files never leave your device and nothing is stored.",
};

export const TOOLS: Tool[] = [
  {
    slug: "organize", href: "/tools/organize", title: "Organize PDF",
    seoTitle: "Merge, Reorder, Rotate & Delete PDF Pages — Free, No Signup",
    desc: "Merge PDFs, drag pages into order, rotate, delete and extract pages with live thumbnails.",
    icon: "organize", tint: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300",
    steps: ["Add one or more PDF files.", "Drag pages into order, click to select, then rotate, delete or extract.", "Click Export PDF to download the result."],
    faqs: [
      { q: "How do I merge PDF files for free?", a: "Add all the PDFs you want to combine, drag the pages into the order you need, and export. There is no watermark, signup or limit on the number of exports." },
      { q: "Can I merge pages from different PDFs into one file?", a: "Yes. Pages from every file you add appear together, so you can interleave them in any order." },
      PRIVACY_Q,
    ],
  },
  {
    slug: "images-to-pdf", href: "/tools/images-to-pdf", title: "Images to PDF",
    seoTitle: "Convert JPG, PNG & WebP Images to PDF — Free, No Signup",
    desc: "Combine JPG, PNG and WebP images into one PDF, one image per page.",
    icon: "images", tint: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
    steps: ["Add your images.", "Reorder them with the arrow buttons or remove the ones you don't need.", "Click Create PDF."],
    faqs: [
      { q: "Which image formats are supported?", a: "JPG and PNG are embedded directly. Other formats your browser can display, like WebP, are converted automatically." },
      { q: "Will the image quality be reduced?", a: "JPG and PNG images are embedded as-is, so quality is preserved." },
      PRIVACY_Q,
    ],
  },
  {
    slug: "pdf-to-images", href: "/tools/pdf-to-images", title: "PDF to Images",
    seoTitle: "Convert PDF to PNG Images — Free, No Signup",
    desc: "Export every page of a PDF as a high-quality PNG image, delivered as a zip.",
    icon: "export", tint: "bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
    steps: ["Choose a PDF.", "Wait while each page is rendered.", "Download the zip of PNG images."],
    faqs: [
      { q: "What resolution are the images?", a: "Pages are rendered at 2x scale, which is sharp enough for most screens and documents." },
      { q: "Is there a page limit?", a: "No fixed limit, but very large PDFs depend on your device's memory." },
      PRIVACY_Q,
    ],
  },
  {
    slug: "convert", href: "/tools/convert", title: "Office to PDF",
    seoTitle: "Convert Word, Excel & PowerPoint to PDF — Free",
    desc: "Convert Word, Excel, PowerPoint and OpenDocument files to PDF.",
    icon: "convert", tint: "bg-sky-100 text-sky-600 dark:bg-sky-950 dark:text-sky-300", server: true,
    steps: ["Choose one or more documents.", "They are converted on our server.", "Download the PDF."],
    faqs: [
      { q: "Are my files uploaded?", a: "Yes. Office formats need a server to convert accurately. Files are processed in a temporary folder and deleted immediately after conversion; we do not keep or read them." },
      { q: "Which formats are supported?", a: "DOC, DOCX, ODT, RTF, TXT, XLS, XLSX, ODS, CSV, PPT, PPTX and ODP, up to 50 MB each." },
    ],
  },
  {
    slug: "ocr", href: "/tools/ocr", title: "OCR",
    seoTitle: "Extract Text from Scanned PDFs & Images (OCR) — Free",
    desc: "Turn scanned PDFs and photos into editable text, right in your browser.",
    icon: "ocr", tint: "bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
    steps: ["Choose a scanned PDF or an image.", "Wait while the text is recognized (the first run downloads the language model).", "Copy the text or download it as .txt."],
    faqs: [
      { q: "Which languages are supported?", a: "English for now. More languages are planned." },
      { q: "How accurate is it?", a: "Clear, high-contrast scans work best. Blurry or handwritten text will be less accurate." },
      PRIVACY_Q,
    ],
  },
];

export const getTool = (slug: string) => TOOLS.find((t) => t.slug === slug)!;

export const SITE_NAME = "Doc Customizer";
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/$/, "");
