package org.pdfrookie.scanner

import com.google.mlkit.vision.documentscanner.GmsDocumentScannerOptions

/** One place for the document-scanner settings, shared by the Scans screen and the Tools screen. */
fun scannerOptions(): GmsDocumentScannerOptions =
    GmsDocumentScannerOptions.Builder()
        .setGalleryImportAllowed(true)
        .setPageLimit(30)
        .setResultFormats(GmsDocumentScannerOptions.RESULT_FORMAT_PDF)
        .setScannerMode(GmsDocumentScannerOptions.SCANNER_MODE_FULL)
        .build()
