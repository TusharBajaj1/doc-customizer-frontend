package org.pdfrookie.scanner

import android.content.Context
import android.webkit.WebResourceResponse
import androidx.webkit.WebViewAssetLoader
import java.io.File
import java.io.FileInputStream
import java.io.IOException
import org.pdfrookie.core.AssetRouting

/** The bundled website is served from this made-up HTTPS origin (intercepted inside the app; no real server is contacted). */
const val APP_HOST = "localapp.pdfrookie.org"
const val APP_ORIGIN = "https://$APP_HOST"

private fun notFound(context: Context?): WebResourceResponse {
    val page = try { context?.assets?.open("www/404.html") } catch (e: IOException) { null }
    return WebResourceResponse("text/html", "utf-8", 404, "Not Found", emptyMap(), page ?: "Not found".byteInputStream())
}

/** Serves the static website that was copied into assets/www (see scripts/build-app.mjs). Rules live in the tested AssetRouting. */
class SiteHandler(private val context: Context) : WebViewAssetLoader.PathHandler {
    override fun handle(path: String): WebResourceResponse? {
        val rel = AssetRouting.resolve(path) ?: return notFound(context)
        return try {
            val mime = AssetRouting.mimeFor(rel)
            val encoding = if (mime.startsWith("text/") || mime.endsWith("json") || mime.endsWith("xml")) "utf-8" else null
            WebResourceResponse(mime, encoding, context.assets.open("www/$rel"))
        } catch (e: IOException) {
            notFound(context)
        }
    }
}

/** Serves PDFs handed to the web page by the app (scan results, or a saved scan opened in a tool): /__scans/<id>.pdf */
class ScansHandler(private val dir: File, private val context: Context) : WebViewAssetLoader.PathHandler {
    private val safeName = Regex("^[A-Za-z0-9_-]{1,64}\\.pdf$")

    override fun handle(path: String): WebResourceResponse? {
        if (!safeName.matches(path)) return notFound(context)
        val file = File(dir, path)
        if (!file.isFile) return notFound(context)
        return WebResourceResponse("application/pdf", null, FileInputStream(file))
    }
}

/** Serves files the user picked, after the app copied them into its own storage: /__picks/<id> (ids are random UUIDs). */
class PicksHandler(private val dir: File, private val context: Context) : WebViewAssetLoader.PathHandler {
    private val safeName = Regex("^[A-Za-z0-9-]{1,64}$")

    override fun handle(path: String): WebResourceResponse? {
        if (!safeName.matches(path)) return notFound(context)
        val file = File(dir, path)
        if (!file.isFile) return notFound(context)
        return WebResourceResponse("application/octet-stream", null, FileInputStream(file))
    }
}

fun buildAssetLoader(context: Context, scansDir: File, picksDir: File): WebViewAssetLoader =
    WebViewAssetLoader.Builder()
        .setDomain(APP_HOST)
        // handlers match by prefix in the order added, so the specific one goes first
        .addPathHandler("/__scans/", ScansHandler(scansDir, context))
        .addPathHandler("/__picks/", PicksHandler(picksDir, context))
        .addPathHandler("/", SiteHandler(context))
        .build()
