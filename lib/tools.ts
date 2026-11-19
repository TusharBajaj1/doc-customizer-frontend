export type Faq = { q: string; a: string };
export type IconKey = "crop" | "delete" | "extract" | "sign" | "organize" | "split" | "rotate" | "compress" | "images" | "export" | "convert" | "ocr" | "scan" | "numbers" | "watermark" | "protect" | "unlock";
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
  { id: "convert", title: "Convert & scan", blurb: "Move between PDFs, images, Word documents and text" },
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

const ALL_TOOLS: Tool[] = [
  {
    slug: "merge-pdf", href: "/tools/merge-pdf", title: "Merge & Organize PDF", category: "organize", icon: "organize", tint: Y,
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
    slug: "delete-pages", href: "/tools/delete-pages", title: "Delete PDF Pages", category: "organize", icon: "delete", tint: O,
    seoTitle: "Delete Pages from a PDF — Free, No Signup",
    desc: "Remove unwanted pages from a PDF. Click the pages you don't need, or type a range like 2, 5-7.",
    steps: ["Choose a PDF.", "Click the pages to delete, or type a range.", "Download the PDF without those pages."],
    faqs: [
      { q: "Does deleting pages change the rest of the document?", a: "No. The remaining pages are copied exactly as they are, with their text and images intact." },
      { q: "Can I undo a deletion?", a: "Nothing changes until you download, so you can click a page again to bring it back. Your original file is never modified." },
      { q: "Can I delete every page?", a: "No. At least one page has to remain." },
      PRIVACY_Q,
    ],
  },
  {
    slug: "extract-pages", href: "/tools/extract-pages", title: "Extract PDF Pages", category: "organize", icon: "extract", tint: G,
    seoTitle: "Extract Pages from a PDF into a New File — Free",
    desc: "Pick the pages you want and save just those as a new PDF.",
    steps: ["Choose a PDF.", "Click the pages to keep, or type a range like 2, 5-7.", "Download a new PDF with only those pages."],
    faqs: [
      { q: "What's the difference between extracting and splitting?", a: "Extracting gives you one new PDF containing exactly the pages you picked. Splitting breaks a document into several files. Use the Split tool for that." },
      { q: "Do the pages keep their order?", a: "Yes, they appear in the same order as in the original." },
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
    steps: ["Choose a PDF.", "Pick a quality level.", "Check the new size and download."],
    faqs: [
      { q: "How does compression work?", a: "Photos and scans inside the PDF are re-encoded at a lower quality and resolution, and the file structure is optimized. Text, fonts and vector graphics are left untouched, so text stays selectable." },
      { q: "What does Maximum reduction do?", a: "It turns every page into an image. That can shrink stubborn files further, but text can no longer be selected or searched. Run OCR afterwards if you need text back." },
      { q: "Why didn't my file get smaller?", a: "PDFs that are mostly text are already tiny, and some files are already well optimized. When there's nothing to gain, we tell you rather than hand back a bigger file." },
      PRIVACY_Q,
    ],
  },
  {
    slug: "images-to-pdf", href: "/tools/images-to-pdf", title: "JPG & PNG to PDF", category: "convert", icon: "images", tint: G,
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
    slug: "pdf-to-images", href: "/tools/pdf-to-images", title: "PDF to JPG & PNG", category: "convert", icon: "export", tint: O,
    seoTitle: "Convert PDF to JPG or PNG Images — Free, No Signup",
    desc: "Convert every page of a PDF to a JPG or PNG image, delivered as a zip. Free, in your browser.",
    steps: ["Pick JPG or PNG, then choose a PDF.", "Wait while each page is rendered.", "Download the zip of images."],
    faqs: [
      { q: "Should I choose JPG or PNG?", a: "JPG gives much smaller files and suits photos and scans. PNG is lossless and suits text, charts and screenshots." },
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
    slug: "word-to-pdf", href: "/tools/word-to-pdf", title: "Word to PDF", category: "convert", icon: "convert", tint: B, server: true,
    seoTitle: "Convert Word to PDF Online — DOC, DOCX, Free, No Signup",
    desc: "Turn Word documents into PDFs that look the same everywhere. Supports DOCX, DOC, ODT, RTF and TXT.",
    steps: ["Choose one or more Word documents.", "They are converted on our converter server.", "Download the PDF."],
    faqs: [
      { q: "Is my document uploaded?", a: "Yes. Converting Word files accurately needs a server, so the file is sent over an encrypted connection to our converter. It is processed in a temporary folder and deleted immediately afterwards; we do not keep, read or share it. Every other tool on this site runs on your device instead." },
      { q: "Which formats are supported?", a: "DOCX, DOC, ODT, RTF and TXT, up to 50 MB each." },
      { q: "Will the PDF look like my Word document?", a: "Usually, yes: fonts, tables, images, headers and page breaks are kept. Complex layouts, unusual fonts or documents that rely on macros and some Word-only features can differ slightly, so check the result before sending it." },
      { q: "What about Excel and PowerPoint?", a: "Not supported yet." },
      FREE_Q,
    ],
  },
  {
    slug: "pdf-to-word", href: "/tools/pdf-to-word", title: "PDF to Word", category: "convert", icon: "convert", tint: B, server: true,
    seoTitle: "Convert PDF to Word (DOCX) Online — Free, No Signup",
    desc: "Turn a PDF into an editable Word document. Works best on text documents, with tables and formatting kept.",
    steps: ["Choose a PDF.", "It is converted on our converter server.", "Download the editable Word (.docx) file."],
    faqs: [
      { q: "Is my PDF uploaded?", a: "Yes. Converting a PDF to Word accurately needs a server, so the file is sent over an encrypted connection to our converter. It is processed in a temporary folder and deleted immediately afterwards; we do not keep, read or share it. Every other tool on this site runs on your device instead." },
      { q: "How accurate is the conversion?", a: "Text, headings, bold and italic, lists and simple tables usually come through as real, editable Word content. Complex layouts such as multi-column magazines, heavy graphics or unusual fonts can come out looser, so check the result before sending it." },
      { q: "Can it convert a scanned PDF?", a: "Not directly. A scan is a picture of text, so there is no text to convert. Run it through our OCR tool first to get the text." },
      { q: "What if my PDF is password protected?", a: "Unlock it first with our Unlock PDF tool, then convert it." },
      { q: "Is there a size limit?", a: "Files up to 50 MB. Very long documents can take a little while." },
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
    slug: "sign", href: "/tools/sign", title: "Sign PDF", category: "edit", icon: "sign", tint: P,
    seoTitle: "Sign a PDF Online — Draw, Type or Upload Your Signature, Free",
    desc: "Add your signature to a PDF. Draw it, type it or upload an image, then place it anywhere on the page.",
    steps: ["Choose a PDF.", "Draw, type or upload your signature.", "Drag it into place on the page, then download the signed PDF."],
    faqs: [
      { q: "Is this a legally binding signature?", a: "It places an image of your signature on the document, the same as signing a printout and scanning it. Whether that is accepted depends on the document and where you are. It is not a certificate-based digital signature. If a contract needs one, ask the other party what they require." },
      { q: "Is my signature uploaded or saved?", a: "No. It is created and applied in your browser and is gone when you close the page." },
      { q: "Can I sign several pages?", a: "Yes. Go to each page and place the signature, or add as many signatures, initials or text boxes as you need." },
      FREE_Q,
    ],
  },
  {
    slug: "crop", href: "/tools/crop", title: "Crop PDF", category: "edit", icon: "crop", tint: Y,
    seoTitle: "Crop PDF Pages — Trim Margins, Free, No Signup",
    desc: "Trim margins or cut a PDF down to the area you want. Crop every page at once or one page at a time.",
    steps: ["Choose a PDF.", "Drag the box to the area you want to keep.", "Click Crop and download."],
    faqs: [
      { q: "Does cropping delete what's outside the box?", a: "No. Cropping hides the outside area in every viewer, but the content is still inside the file and can be recovered with the right tools. Don't rely on it to remove sensitive information." },
      { q: "How can I remove the hidden area for good?", a: "Run the cropped file through the Compress tool with Maximum reduction ticked. That turns each page into an image of only the visible area. Text will no longer be selectable afterwards." },
      { q: "Can I crop just one page?", a: "Yes. Choose Each page separately, then adjust the box on the pages you want to crop." },
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

/** URL of the separately hosted converter service (see /converter). Unset = server-side tools are hidden. */
export const CONVERTER_URL = (process.env.NEXT_PUBLIC_CONVERTER_URL ?? "").replace(/\/$/, "");

/** Tools shown in menus, the homepage and the sitemap. Server-backed tools appear only when their service is configured. */
export const TOOLS: Tool[] = ALL_TOOLS.filter((t) => !t.server || CONVERTER_URL);

export const getTool = (slug: string) => {
  const t = ALL_TOOLS.find((x) => x.slug === slug);
  if (!t) throw new Error(`Unknown tool: ${slug}`);
  return t;
};

export const SITE_NAME = "PDFRookie";
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/$/, "");
