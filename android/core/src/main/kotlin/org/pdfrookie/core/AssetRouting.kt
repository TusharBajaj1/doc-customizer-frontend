package org.pdfrookie.core

/**
 * Pure rules for serving the bundled static website from the app's assets.
 * Kept free of Android types so they can be unit-tested; android/core/src/test/resources/asset_routing_cases.tsv
 * is the shared table of expected results (the Node test server used to check the web build follows the same table).
 */
object AssetRouting {
    /**
     * Maps a URL path (no leading slash, no query) to the file under the bundled site, or null if the path must be refused.
     * Next's static export writes `tools/split/index.html`, so directory-style paths resolve to their index.html.
     */
    fun resolve(path: String): String? {
        val resolved = resolveRaw(path) ?: return null
        // Android's asset packager silently drops folders whose names start with "_" (Next's JS/CSS live in "_next").
        // scripts/build-app.mjs stores every such folder with an "x" prefix; page URLs keep saying /_next/. Files are unaffected.
        val parts = resolved.split('/')
        return parts.mapIndexed { i, s -> if (i < parts.lastIndex && s.startsWith("_")) "x$s" else s }.joinToString("/")
    }

    private fun resolveRaw(path: String): String? {
        if (path.any { it == '\\' || it == '\u0000' }) return null
        val segments = path.split('/')
        // reject traversal and dot-segments; an empty final segment (trailing slash) is fine
        for ((i, s) in segments.withIndex()) {
            if (s == ".." || s == ".") return null
            if (s.isEmpty() && i != segments.lastIndex && path.isNotEmpty()) return null // "a//b"
        }
        if (path.isEmpty()) return "index.html"
        if (path.endsWith("/")) return path + "index.html"
        val last = segments.last()
        return if ('.' in last) path else "$path/index.html"
    }

    /** Content type for a bundled file. Workers and WebAssembly are refused by browsers when the type is wrong. */
    fun mimeFor(path: String): String {
        val name = path.substringAfterLast('/')
        val ext = name.substringAfterLast('.', "").lowercase()
        return when (ext) {
            "html" -> "text/html"
            "js", "mjs" -> "text/javascript"
            "css" -> "text/css"
            "json", "map" -> "application/json"
            "wasm" -> "application/wasm"
            "svg" -> "image/svg+xml"
            "png" -> "image/png"
            "jpg", "jpeg" -> "image/jpeg"
            "gif" -> "image/gif"
            "webp" -> "image/webp"
            "ico" -> "image/x-icon"
            "woff" -> "font/woff"
            "woff2" -> "font/woff2"
            "ttf" -> "font/ttf"
            "xml" -> "application/xml"
            // Next's static export stores React Server Component payloads as .txt; the client expects this type for them
            "txt" -> if (name == "robots.txt") "text/plain" else "text/x-component"
            else -> "application/octet-stream"
        }
    }
}
