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
import android.provider.OpenableColumns
import android.webkit.MimeTypeMap
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
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import org.pdfrookie.core.Names

/**
 * Hosts the whole website (bundled in the app, so it also works offline) with native help for the things a WebView can't do:
 * the document scanner, and saving/sharing/opening the files the tools produce.
 */
class ToolsActivity : ComponentActivity(), NativeBridge.Host {
    companion object {
        private const val MAX_PICKS = 50
        private const val MAX_PICK_BYTES = 50L * 1024 * 1024
        private const val EXTRA_PATH = "path"
        private const val EXTRA_SCAN = "scan"

        /** Brings the existing home (or a new one) to the front, closing tool screens above it. */
        fun home(context: Context): Intent = intent(context).addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP or Intent.FLAG_ACTIVITY_SINGLE_TOP)

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
    private var scanToLibrary = false // true: save the scan into My scans; false: hand it back to the Scan tool page

    override val outDir: File get() = File(cacheDir, "out").apply { mkdirs() }
    private val scanInDir: File get() = File(cacheDir, "scan-in").apply { mkdirs() }
    private val picksDir: File get() = File(cacheDir, "picks").apply { mkdirs() }
    private var pickRequestId: String? = null

    private val chooserLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { r ->
        val picked = WebChromeClient.FileChooserParams.parseResult(r.resultCode, r.data)
        if (r.resultCode == Activity.RESULT_OK && picked.isNullOrEmpty()) toast("The picker didn't return a file. Please try another location.")
        chooserCallback?.onReceiveValue(picked)
        chooserCallback = null
    }
    // Files chosen through the native picker are copied into the app and handed to the page (see pickFiles below).
    private val pickLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { r ->
        val id = pickRequestId ?: return@registerForActivityResult
        pickRequestId = null
        val data = r.data
        val uris = if (r.resultCode != Activity.RESULT_OK || data == null) emptyList() else {
            val clip = data.clipData
            if (clip != null) (0 until clip.itemCount).mapNotNull { clip.getItemAt(it).uri } else listOfNotNull(data.data)
        }
        lifecycleScope.launch { deliverPicks(id, uris.take(MAX_PICKS)) }
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
        val toLibrary = scanToLibrary
        lifecycleScope.launch {
            runCatching {
                // copy first: the scanner's temporary file may not outlive this screen
                val id = UUID.randomUUID().toString()
                contentResolver.openInputStream(pdf.uri)!!.use { src -> File(scanInDir, "$id.pdf").outputStream().use { src.copyTo(it) } }
                id
            }.onSuccess { id ->
                if (toLibrary) askScanName(File(scanInDir, "$id.pdf"), pdf.pageCount)
                else webView.evaluateJavascript("window.dispatchEvent(new CustomEvent('pdfrookie:scan',{detail:{path:'/__scans/$id.pdf',pages:${pdf.pageCount}}}))", null)
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
        runCatching { File(cacheDir, "out").deleteRecursively(); File(cacheDir, "scan-in").deleteRecursively(); File(cacheDir, "picks").deleteRecursively() }
        assetLoader = buildAssetLoader(this, scanInDir, picksDir)

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
            allowContentAccess = true // the system file chooser hands the page content:// files; the WebView only ever loads our own pages
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

    override fun startScan() { scanToLibrary = false; launchScanner() }

    override fun startScanToLibrary() { scanToLibrary = true; launchScanner() }

    override fun pickFiles(requestId: String, accept: String, multiple: Boolean) {
        runOnUiThread {
            pickRequestId = requestId
            try { pickLauncher.launch(pickIntent(accept, multiple)) }
            catch (e: ActivityNotFoundException) {
                pickRequestId = null
                toast("No file picker is available on this device")
                lifecycleScope.launch { deliverPicks(requestId, emptyList()) }
            }
        }
    }

    /** Builds a "choose a file" intent limited to the types the page asked for (image types, or extensions like .doc and .docx). */
    private fun pickIntent(accept: String, multiple: Boolean): Intent {
        val mimes = accept.split(',').map { it.trim() }.filter { it.isNotEmpty() }
            .mapNotNull { t -> if ('/' in t) t else MimeTypeMap.getSingleton().getMimeTypeFromExtension(t.removePrefix(".").lowercase()) }
            .distinct()
        return Intent(Intent.ACTION_GET_CONTENT).addCategory(Intent.CATEGORY_OPENABLE).putExtra(Intent.EXTRA_ALLOW_MULTIPLE, multiple).apply {
            if (mimes.size == 1) type = mimes[0] else { type = "*/*"; if (mimes.isNotEmpty()) putExtra(Intent.EXTRA_MIME_TYPES, mimes.toTypedArray()) }
        }
    }

    /** Copies each picked file into app storage (size-capped), then tells the page where to fetch them. Reports what failed. */
    private suspend fun deliverPicks(requestId: String, uris: List<Uri>) {
        val files = JSONArray()
        val problems = mutableListOf<String>()
        withContext(Dispatchers.IO) {
            for (uri in uris) {
                var label = "a file"
                try {
                    val name = contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { c -> if (c.moveToFirst()) c.getString(0) else null }
                    label = name ?: "a file"
                    val id = UUID.randomUUID().toString()
                    val target = File(picksDir, id)
                    var total = 0L
                    (contentResolver.openInputStream(uri) ?: error("the file could not be opened")).use { input ->
                        target.outputStream().use { out ->
                            val buf = ByteArray(64 * 1024)
                            while (true) {
                                val n = input.read(buf)
                                if (n < 0) break
                                total += n
                                if (total > MAX_PICK_BYTES) { target.delete(); error("it is larger than 50 MB") }
                                out.write(buf, 0, n)
                            }
                        }
                    }
                    files.put(JSONObject().put("id", id).put("name", name ?: "file").put("type", contentResolver.getType(uri) ?: ""))
                } catch (e: Exception) {
                    problems += "$label: ${e.message ?: e.javaClass.simpleName}"
                }
            }
        }
        if (problems.isNotEmpty()) toast("Could not read ${problems.size} file${if (problems.size == 1) "" else "s"}. ${problems.first()}")
        val detail = JSONObject().put("requestId", requestId).put("files", files).toString()
        webView.evaluateJavascript("window.dispatchEvent(new CustomEvent('pdfrookie:picked',{detail:$detail}))", null)
    }

    override fun openScans() { runOnUiThread { startActivity(Intent(this, MainActivity::class.java)) } }

    /** Right after a scan from the home screen: name it, then save it into My scans (or discard). */
    private fun askScanName(file: File, pages: Int) {
        val pad = (20 * resources.displayMetrics.density).toInt()
        val column = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL; setPadding(pad, pad / 2, pad, 0) }
        column.addView(TextView(this).apply { text = "$pages page${if (pages == 1) "" else "s"} scanned" })
        val nameField = EditText(this).apply { setText(Names.title(Names.scanFileName(java.time.LocalDateTime.now()))); setSingleLine(true); setSelectAllOnFocus(true) }
        column.addView(nameField)
        AlertDialog.Builder(this)
            .setTitle("Name your scan")
            .setView(column)
            .setCancelable(false)
            .setPositiveButton("Save") { _, _ ->
                lifecycleScope.launch {
                    runCatching { repo.addFromFile(file, nameField.text.toString()) }
                        .onSuccess { toast("Saved ${it.title}. Find it in My scans.") }
                        .onFailure { toast("Could not save the scan") }
                    file.delete()
                }
            }
            .setNegativeButton("Discard") { _, _ -> file.delete() }
            .show()
    }

    private fun launchScanner() {
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
