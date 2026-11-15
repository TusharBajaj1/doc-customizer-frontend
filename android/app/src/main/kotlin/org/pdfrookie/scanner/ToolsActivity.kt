package org.pdfrookie.scanner

import android.annotation.SuppressLint
import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.Intent
import android.content.pm.ApplicationInfo
import android.net.Uri
import android.os.Bundle
import android.view.ViewGroup
import android.webkit.PermissionRequest
import android.webkit.RenderProcessGoneDetail
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.enableEdgeToEdge
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.contract.ActivityResultContracts
import android.app.AlertDialog
import androidx.browser.customtabs.CustomTabsIntent
import androidx.core.content.FileProvider
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.lifecycle.lifecycleScope
import androidx.webkit.WebViewAssetLoader
import com.google.mlkit.vision.documentscanner.GmsDocumentScanning
import com.google.mlkit.vision.documentscanner.GmsDocumentScanningResult
import java.io.File
import java.net.URLEncoder
import java.util.UUID
import kotlinx.coroutines.launch
import org.pdfrookie.core.Names

/**
 * Hosts the whole website (bundled in the app, so it also works offline) with native help for the things a WebView can't do:
 * the document scanner, and saving/sharing/opening the files the tools produce.
 */
class ToolsActivity : ComponentActivity(), NativeBridge.Host {
    companion object {
        private const val EXTRA_PATH = "path"
        private const val EXTRA_SCAN = "scan"

        /** [path] is a site path such as "tools/crop/" (empty = home). [scanName] opens that saved scan inside the tool. */
        fun intent(context: Context, path: String = "", scanName: String? = null): Intent =
            Intent(context, ToolsActivity::class.java).putExtra(EXTRA_PATH, path).putExtra(EXTRA_SCAN, scanName)
    }

    private lateinit var webView: WebView
    private lateinit var repo: ScanRepository
    private lateinit var assetLoader: WebViewAssetLoader
    private var chooserCallback: ValueCallback<Array<Uri>>? = null
    private var sourceScan: ScanItem? = null
    private var toSave: Triple<File, String, String>? = null // file, final name, mime

    override val outDir: File get() = File(cacheDir, "out").apply { mkdirs() }
    private val scanInDir: File get() = File(cacheDir, "scan-in").apply { mkdirs() }

    private val chooserLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { r ->
        chooserCallback?.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(r.resultCode, r.data))
        chooserCallback = null
    }
    private val saveLauncher = registerForActivityResult(CreateAnyDocument()) { uri ->
        val pending = toSave
        if (uri != null && pending != null) {
            runCatching { contentResolver.openOutputStream(uri)?.use { out -> pending.first.inputStream().use { it.copyTo(out) } } }
                .onSuccess { toast("Saved") }.onFailure { toast("Could not save the file") }
        }
    }
    private val scanLauncher = registerForActivityResult(ActivityResultContracts.StartIntentSenderForResult()) { r ->
        if (r.resultCode != Activity.RESULT_OK) return@registerForActivityResult
        val pdf = GmsDocumentScanningResult.fromActivityResultIntent(r.data)?.pdf ?: return@registerForActivityResult
        lifecycleScope.launch {
            runCatching {
                val id = UUID.randomUUID().toString()
                contentResolver.openInputStream(pdf.uri)!!.use { src -> File(scanInDir, "$id.pdf").outputStream().use { src.copyTo(it) } }
                id
            }.onSuccess { id ->
                webView.evaluateJavascript("window.dispatchEvent(new CustomEvent('pdfrookie:scan',{detail:{path:'/__scans/$id.pdf',pages:${pdf.pageCount}}}))", null)
            }.onFailure { toast("Could not read the scan") }
        }
    }

    private val bridge = NativeBridge(this)

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        repo = ScanRepository(applicationContext)
        // old temporary files from earlier sessions
        runCatching { File(cacheDir, "out").deleteRecursively(); File(cacheDir, "scan-in").deleteRecursively() }
        assetLoader = buildAssetLoader(this, scanInDir)

        val root = LinearLayout(this).apply { setBackgroundColor(getColor(R.color.paper)) }
        webView = WebView(this).apply { layoutParams = LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT) }
        root.addView(webView)
        setContentView(root)
        ViewCompat.setOnApplyWindowInsetsListener(root) { v, insets ->
            val b = insets.getInsets(WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.ime())
            v.setPadding(b.left, b.top, b.right, b.bottom)
            insets
        }

        if (applicationInfo.flags and ApplicationInfo.FLAG_DEBUGGABLE != 0) WebView.setWebContentsDebuggingEnabled(true)
        with(webView.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = false
            allowContentAccess = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            setSupportZoom(false)
        }
        webView.addJavascriptInterface(bridge, "PdfRookieNative")

        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? =
                assetLoader.shouldInterceptRequest(request.url)

            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                val u = request.url
                if (u.scheme == "https" && u.host == APP_HOST) return false // our own pages stay in the WebView
                openExternally(u)
                return true
            }

            // If the web renderer crashes or is killed, leave quietly instead of taking the app down.
            override fun onRenderProcessGone(view: WebView, detail: RenderProcessGoneDetail): Boolean { finish(); return true }
        }
        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(webView: WebView, filePathCallback: ValueCallback<Array<Uri>>, fileChooserParams: FileChooserParams): Boolean {
                chooserCallback?.onReceiveValue(null)
                chooserCallback = filePathCallback
                return try { chooserLauncher.launch(fileChooserParams.createIntent()); true }
                catch (e: ActivityNotFoundException) { chooserCallback = null; filePathCallback.onReceiveValue(null); false }
            }

            // The web camera is never used here (scanning goes through the native scanner), so deny permission prompts.
            override fun onPermissionRequest(request: PermissionRequest) { request.deny() }
        }

        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() { if (webView.canGoBack()) webView.goBack() else finish() }
        })

        if (savedInstanceState == null) webView.loadUrl(startUrl()) else webView.restoreState(savedInstanceState)
    }

    override fun onSaveInstanceState(outState: Bundle) { super.onSaveInstanceState(outState); webView.saveState(outState) }
    override fun onDestroy() { chooserCallback?.onReceiveValue(null); webView.destroy(); super.onDestroy() }

    private fun startUrl(): String {
        val path = (intent.getStringExtra(EXTRA_PATH) ?: "").trimStart('/')
        val scanName = intent.getStringExtra(EXTRA_SCAN)
        val scan = scanName?.let { repo.find(it) }
        if (scan != null) {
            sourceScan = scan
            // expose a copy through the scans handler under an opaque id, so the page never sees real file names or paths
            val id = UUID.randomUUID().toString()
            scan.file.copyTo(File(scanInDir, "$id.pdf"), overwrite = true)
            val name = URLEncoder.encode(scan.title, "UTF-8")
            return "$APP_ORIGIN/$path?open=/__scans/$id.pdf&name=$name"
        }
        return "$APP_ORIGIN/$path"
    }

    private fun openExternally(uri: Uri) {
        try {
            when (uri.scheme) {
                "http", "https" -> CustomTabsIntent.Builder().build().launchUrl(this, uri)
                "mailto" -> startActivity(Intent(Intent.ACTION_VIEW, uri))
            }
        } catch (e: ActivityNotFoundException) { toast("No app found to open this link") }
    }

    private fun toast(msg: String) = Toast.makeText(this, msg, Toast.LENGTH_SHORT).show()

    // ---- NativeBridge.Host ----

    override fun startScan() {
        runOnUiThread {
            GmsDocumentScanning.getClient(scannerOptions()).getStartScanIntent(this)
                .addOnSuccessListener { sender -> scanLauncher.launch(IntentSenderRequest.Builder(sender).build()) }
                .addOnFailureListener { toast("The scanner isn't available on this device. It needs Google Play services.") }
        }
    }

    override fun onFileReady(file: File, displayName: String, mime: String) = runOnUiThread { showFileDialog(file, displayName, mime) }

    private fun showFileDialog(file: File, displayName: String, mime: String) {
        val isPdf = mime == "application/pdf"
        val pad = (20 * resources.displayMetrics.density).toInt()
        val column = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(pad, pad / 2, pad, 0) }
        column.addView(TextView(this).apply { text = "File name" })
        val nameField = EditText(this).apply { setText(displayName.substringBeforeLast('.')); setSingleLine(true); setSelectAllOnFocus(true) }
        column.addView(nameField)
        val dialog = AlertDialog.Builder(this).setTitle("File ready").setView(column).setNegativeButton("Close", null).create()

        // the name is re-validated every time, and the cached file is renamed to match what the user typed
        fun finalFile(): Pair<File, String>? {
            val name = Names.downloadName(nameField.text.toString(), mime) ?: return null
            val target = File(file.parentFile, name)
            if (target.name != file.name && !file.renameTo(target)) return file to file.name
            return target to name
        }
        fun action(label: String, run: (File, String) -> Unit) = column.addView(Button(this).apply {
            text = label
            setOnClickListener { finalFile()?.let { (f, n) -> run(f, n); dialog.dismiss() } ?: toast("Please enter a file name") }
        })

        if (isPdf) action("Add to My scans") { f, n ->
            lifecycleScope.launch { runCatching { repo.addFromFile(f, n) }.onSuccess { toast("Added to My scans") }.onFailure { toast("Could not add to My scans") } }
        }
        val original = sourceScan
        if (isPdf && original != null) action("Replace original scan") { f, n ->
            lifecycleScope.launch { runCatching { repo.replace(original, f, n) }.onSuccess { sourceScan = it; toast("Original replaced") }.onFailure { toast("Could not replace the original") } }
        }
        action("Save to device…") { f, n -> toSave = Triple(f, n, mime); saveLauncher.launch(n to mime) }
        action("Share…") { f, _ ->
            val send = Intent(Intent.ACTION_SEND).setType(mime).putExtra(Intent.EXTRA_STREAM, fileUri(f)).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            startActivity(Intent.createChooser(send, "Share"))
        }
        if (isPdf) action("Open…") { f, _ ->
            try { startActivity(Intent(Intent.ACTION_VIEW).setDataAndType(fileUri(f), mime).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)) }
            catch (e: ActivityNotFoundException) { toast("No PDF viewer installed. Try Share instead.") }
        }
        dialog.show()
    }

    private fun fileUri(file: File): Uri = FileProvider.getUriForFile(this, "$packageName.files", file)
}
