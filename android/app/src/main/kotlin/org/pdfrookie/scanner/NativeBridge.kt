package org.pdfrookie.scanner

import android.util.Base64
import android.webkit.JavascriptInterface
import java.io.File
import java.io.OutputStream
import java.util.UUID
import java.util.concurrent.ConcurrentHashMap
import org.pdfrookie.core.Names

/**
 * Methods the bundled website can call as `window.PdfRookieNative`. Only our own pages are ever loaded in the WebView
 * (external links open in the browser), so this is not exposed to third-party content.
 * Every method validates its input: names and types are checked by [Names.downloadName], and size is capped.
 */
class NativeBridge(private val host: Host) {
    interface Host {
        val outDir: File
        fun startScan()
        fun startScanToLibrary()
        fun openScans()
        fun pickFiles(requestId: String, accept: String, multiple: Boolean)
        fun onFileReady(file: File, displayName: String, mime: String)
    }

    private class Session(val file: File, val out: OutputStream, val name: String, val mime: String) { var bytes = 0L }

    private val sessions = ConcurrentHashMap<String, Session>()

    @JavascriptInterface fun isApp(): Boolean = true

    /** Starts receiving a file from the page. Returns a token, or "" if the name/type is not allowed. */
    @JavascriptInterface
    fun beginSave(name: String, mime: String): String {
        val safe = Names.downloadName(name, mime) ?: return ""
        return try {
            val token = UUID.randomUUID().toString()
            val dir = File(host.outDir, token).apply { mkdirs() }
            val file = File(dir, safe)
            sessions[token] = Session(file, file.outputStream().buffered(), safe, mime.substringBefore(';').trim().lowercase())
            token
        } catch (e: Exception) { "" }
    }

    @JavascriptInterface
    fun appendSave(token: String, base64Chunk: String): Boolean {
        val s = sessions[token] ?: return false
        return try {
            val bytes = Base64.decode(base64Chunk, Base64.DEFAULT)
            s.bytes += bytes.size
            if (s.bytes > MAX_BYTES) { cancelSave(token); return false }
            s.out.write(bytes)
            true
        } catch (e: Exception) { cancelSave(token); false }
    }

    @JavascriptInterface
    fun finishSave(token: String): Boolean {
        val s = sessions.remove(token) ?: return false
        return try {
            s.out.close()
            host.onFileReady(s.file, s.name, s.mime)
            true
        } catch (e: Exception) { s.file.parentFile?.deleteRecursively(); false }
    }

    @JavascriptInterface
    fun cancelSave(token: String) {
        val s = sessions.remove(token) ?: return
        runCatching { s.out.close() }
        s.file.parentFile?.deleteRecursively()
    }

    @JavascriptInterface fun scan() = host.startScan()

    @JavascriptInterface fun scanToLibrary() = host.startScanToLibrary()

    @JavascriptInterface fun openScans() = host.openScans()

    @JavascriptInterface fun pickFiles(requestId: String, accept: String, multiple: Boolean) = host.pickFiles(requestId, accept, multiple)

    private companion object { const val MAX_BYTES = 150L * 1024 * 1024 }
}
