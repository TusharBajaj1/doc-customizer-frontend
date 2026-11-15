package org.pdfrookie.scanner

/** Website tools that accept a PDF, offered on each saved scan. Slugs match the site's /tools/<slug> routes. */
data class PdfTool(val title: String, val slug: String, val hint: String)

val PDF_TOOLS = listOf(
    PdfTool("Edit pages", "organize", "Reorder, rotate or delete pages"),
    PdfTool("Crop", "crop", "Trim margins or cut to an area"),
    PdfTool("Delete pages", "delete-pages", "Remove pages you don't need"),
    PdfTool("Extract pages", "extract-pages", "Keep only some pages"),
    PdfTool("Rotate", "rotate", "Fix sideways pages"),
    PdfTool("Split", "split", "Break into separate files"),
    PdfTool("Compress", "compress", "Make the file smaller"),
    PdfTool("Sign", "sign", "Add your signature"),
    PdfTool("Add page numbers", "page-numbers", "Number the pages"),
    PdfTool("Add watermark", "watermark", "Stamp text on every page"),
    PdfTool("Protect with password", "protect", "Lock the PDF"),
    PdfTool("Unlock", "unlock", "Remove a password you know"),
    PdfTool("Recognize text (OCR)", "ocr", "Get the text out of a scan"),
    PdfTool("PDF to images", "pdf-to-images", "Export pages as PNG"),
)
