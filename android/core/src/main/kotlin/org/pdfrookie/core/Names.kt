package org.pdfrookie.core

import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

/** Pure helpers for naming and describing saved scans. No Android dependencies, so they are unit-testable on the JVM. */
object Names {
    const val EXTENSION = ".pdf"
    private const val MAX_BASE_LENGTH = 80
    private val STAMP: DateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss")

    /** Default file name for a new scan, e.g. `Scan_2026-11-15_09-30-00.pdf`. */
    fun scanFileName(now: LocalDateTime): String = "Scan_${STAMP.format(now)}$EXTENSION"

    /**
     * Turns user input into a safe file name: no path separators or control characters, no leading dots,
     * bounded length, always ending in `.pdf`. Never returns an empty or path-like name.
     */
    fun sanitize(input: String, fallback: String): String {
        var base = input.trim()
        if (base.endsWith(EXTENSION, ignoreCase = true)) base = base.dropLast(EXTENSION.length)
        return cleanBase(base, fallback.removeSuffix(EXTENSION)) + EXTENSION
    }

    /** Characters removed or replaced so a name can't escape its folder or be rejected by the file system. */
    private fun cleanBase(raw: String, fallback: String): String {
        var base = raw
            .filter { !it.isISOControl() }
            .replace(Regex("""[\\/:*?"<>|]"""), "_")
            .replace(Regex("""\s+"""), " ")
            .trimStart('.', ' ', '_')
            .trimEnd('.', ' ')
        if (base.length > MAX_BASE_LENGTH) base = base.take(MAX_BASE_LENGTH).trimEnd('.', ' ')
        return base.ifEmpty { fallback }
    }

    private val MIME_EXTENSIONS = mapOf(
        "application/pdf" to ".pdf", "application/zip" to ".zip", "text/plain" to ".txt",
        "image/png" to ".png", "image/jpeg" to ".jpg",
    )

    /**
     * Safe name for a file saved from a web tool. The extension always comes from the MIME type, never from the caller's text,
     * so a page can't ask the app to save `evil.apk`. Unknown types are refused (null).
     */
    fun downloadName(requested: String, mime: String, fallbackBase: String = "file"): String? {
        val ext = MIME_EXTENSIONS[mime.substringBefore(';').trim().lowercase()] ?: return null
        var base = requested.trim()
        for (e in MIME_EXTENSIONS.values) if (base.endsWith(e, ignoreCase = true)) { base = base.dropLast(e.length); break }
        return cleanBase(base, fallbackBase) + ext
    }

    /** Returns [desired] if free, otherwise `name (2).pdf`, `name (3).pdf`, ... Comparison ignores case. */
    fun unique(desired: String, existing: Collection<String>): String {
        val taken = existing.map { it.lowercase() }.toSet()
        if (desired.lowercase() !in taken) return desired
        val base = desired.removeSuffix(EXTENSION)
        var n = 2
        while ("$base ($n)$EXTENSION".lowercase() in taken) n++
        return "$base ($n)$EXTENSION"
    }

    /** Human-readable size, e.g. `812 B`, `1.4 MB`. */
    fun formatSize(bytes: Long): String = when {
        bytes < 1024 -> "$bytes B"
        bytes < 1024 * 1024 -> "%.1f KB".format(java.util.Locale.US, bytes / 1024.0)
        else -> "%.1f MB".format(java.util.Locale.US, bytes / 1024.0 / 1024.0)
    }

    /** Display title for a file: the name without its extension. */
    fun title(fileName: String): String = fileName.removeSuffix(EXTENSION).removeSuffix(EXTENSION.uppercase())
}
