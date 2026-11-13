export type Tool = { href: string; title: string; desc: string; icon: string };

export const TOOLS: Tool[] = [
  { href: "/tools/organize", title: "Organize PDF", desc: "Merge, reorder, rotate, delete and split pages with live thumbnails.", icon: "🗂️" },
  { href: "/tools/images-to-pdf", title: "Images to PDF", desc: "Turn JPG and PNG images into a single PDF.", icon: "🖼️" },
  { href: "/tools/pdf-to-images", title: "PDF to Images", desc: "Export every page as a PNG, zipped.", icon: "📄" },
  { href: "/tools/convert", title: "Word / Excel / PowerPoint to PDF", desc: "Convert Office documents to PDF.", icon: "🔄" },
  { href: "/tools/ocr", title: "OCR", desc: "Extract text from scanned PDFs and images, right in your browser.", icon: "🔍" },
];
