package org.pdfrookie.scanner.ui

import android.app.Activity
import android.content.ActivityNotFoundException
import android.content.Context
import android.content.ContextWrapper
import android.content.Intent
import android.net.Uri
import android.text.format.DateUtils
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.IntentSenderRequest
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.DialogProperties
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.compose.LifecycleEventEffect
import java.time.LocalDateTime
import org.pdfrookie.scanner.PDF_TOOLS
import org.pdfrookie.scanner.ToolsActivity
import org.pdfrookie.scanner.scannerOptions
import com.google.mlkit.vision.documentscanner.GmsDocumentScanning
import com.google.mlkit.vision.documentscanner.GmsDocumentScanningResult
import kotlinx.coroutines.launch
import org.pdfrookie.core.Names
import org.pdfrookie.scanner.ScanItem
import org.pdfrookie.scanner.ScanRepository

private tailrec fun Context.findActivity(): Activity? = when (this) {
    is Activity -> this
    is ContextWrapper -> baseContext.findActivity()
    else -> null
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScanApp(repo: ScanRepository) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val snackbar = remember { SnackbarHostState() }
    var scans by remember { mutableStateOf(emptyList<ScanItem>()) }
    var renaming by remember { mutableStateOf<ScanItem?>(null) }
    var deleting by remember { mutableStateOf<ScanItem?>(null) }
    var editing by remember { mutableStateOf<ScanItem?>(null) }
    // a finished scan waiting for the user to name it (uri, page count)
    var pendingScan by remember { mutableStateOf<Pair<Uri, Int>?>(null) }

    fun refresh() = scope.launch { scans = repo.list() }
    fun say(msg: String) = scope.launch { snackbar.showSnackbar(msg) }

    LaunchedEffect(Unit) { scans = repo.list() }
    // a tool opened from here may have added or replaced a scan
    LifecycleEventEffect(Lifecycle.Event.ON_RESUME) { refresh() }

    val scannerLauncher = rememberLauncherForActivityResult(ActivityResultContracts.StartIntentSenderForResult()) { result ->
        if (result.resultCode == Activity.RESULT_OK) {
            val pdf = GmsDocumentScanningResult.fromActivityResultIntent(result.data)?.pdf
            if (pdf != null) pendingScan = pdf.uri to pdf.pageCount
        }
    }

    fun startScan() {
        val activity = context.findActivity() ?: return
        GmsDocumentScanning.getClient(scannerOptions())
            .getStartScanIntent(activity)
            .addOnSuccessListener { sender -> scannerLauncher.launch(IntentSenderRequest.Builder(sender).build()) }
            .addOnFailureListener { say("The scanner isn't available on this device. It needs Google Play services.") }
    }

    fun openMoreTools() = context.startActivity(ToolsActivity.home(context))

    fun open(item: ScanItem) {
        val intent = Intent(Intent.ACTION_VIEW).setDataAndType(repo.shareUri(item), "application/pdf").addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        try { context.startActivity(intent) } catch (e: ActivityNotFoundException) { say("No PDF viewer installed. Try Share instead.") }
    }

    fun share(item: ScanItem) {
        val send = Intent(Intent.ACTION_SEND).setType("application/pdf").putExtra(Intent.EXTRA_STREAM, repo.shareUri(item)).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        context.startActivity(Intent.createChooser(send, "Share scan"))
    }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        topBar = {
            TopAppBar(
                title = { Text("My scans") },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.background),
                actions = { TextButton(onClick = ::openMoreTools) { Text("Tools") } },
            )
        },
        snackbarHost = { SnackbarHost(snackbar) },
        floatingActionButton = {
            ExtendedFloatingActionButton(onClick = ::startScan, icon = { Icon(Icons.Default.Add, contentDescription = null) }, text = { Text("Scan") })
        },
    ) { padding ->
        if (scans.isEmpty()) {
            EmptyState(Modifier.padding(padding), onMoreTools = ::openMoreTools)
        } else {
            LazyColumn(Modifier.padding(padding).fillMaxSize(), verticalArrangement = Arrangement.spacedBy(8.dp), contentPadding = androidx.compose.foundation.layout.PaddingValues(16.dp, 8.dp, 16.dp, 96.dp)) {
                items(scans, key = { it.file.path }) { item ->
                    ScanRow(item, onOpen = { open(item) }, onShare = { share(item) }, onEdit = { editing = item }, onRename = { renaming = item }, onDelete = { deleting = item })
                }
            }
        }
    }

    pendingScan?.let { (uri, pages) ->
        var text by remember(uri) { mutableStateOf(Names.title(Names.scanFileName(LocalDateTime.now()))) }
        AlertDialog(
            onDismissRequest = {},
            properties = DialogProperties(dismissOnBackPress = false, dismissOnClickOutside = false),
            title = { Text("Name your scan") },
            text = {
                Column {
                    Text("$pages page${if (pages == 1) "" else "s"} scanned.", style = MaterialTheme.typography.bodyMedium)
                    OutlinedTextField(value = text, onValueChange = { text = it }, singleLine = true, label = { Text("Name") }, modifier = Modifier.padding(top = 12.dp))
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    pendingScan = null
                    scope.launch {
                        runCatching { repo.import(uri, text) }
                            .onSuccess { scans = repo.list(); snackbar.showSnackbar("Saved ${it.title}") }
                            .onFailure { snackbar.showSnackbar("Could not save the scan. Please try again.") }
                    }
                }) { Text("Save") }
            },
            dismissButton = { TextButton(onClick = { pendingScan = null }) { Text("Discard", color = MaterialTheme.colorScheme.error) } },
        )
    }

    editing?.let { item ->
        AlertDialog(
            onDismissRequest = { editing = null },
            title = { Text("Edit \"${item.title}\"") },
            text = {
                LazyColumn {
                    items(PDF_TOOLS, key = { it.slug }) { tool ->
                        Column(Modifier.fillMaxWidth().clip(RoundedCornerShape(8.dp)).clickable { editing = null; context.startActivity(ToolsActivity.intent(context, "tools/${tool.slug}/", item.name)) }.padding(vertical = 8.dp, horizontal = 4.dp)) {
                            Text(tool.title, style = MaterialTheme.typography.titleMedium)
                            Text(tool.hint, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }
                }
            },
            confirmButton = { TextButton(onClick = { editing = null }) { Text("Cancel") } },
        )
    }

    renaming?.let { item ->
        var text by remember(item) { mutableStateOf(item.title) }
        AlertDialog(
            onDismissRequest = { renaming = null },
            title = { Text("Rename scan") },
            text = { OutlinedTextField(value = text, onValueChange = { text = it }, singleLine = true, label = { Text("Name") }) },
            confirmButton = {
                TextButton(onClick = {
                    renaming = null
                    scope.launch { runCatching { repo.rename(item, text) }.onSuccess { scans = repo.list() }.onFailure { snackbar.showSnackbar("Could not rename the file.") } }
                }) { Text("Rename") }
            },
            dismissButton = { TextButton(onClick = { renaming = null }) { Text("Cancel") } },
        )
    }

    deleting?.let { item ->
        AlertDialog(
            onDismissRequest = { deleting = null },
            title = { Text("Delete this scan?") },
            text = { Text("\"${item.title}\" will be permanently deleted from this device.") },
            confirmButton = {
                TextButton(onClick = {
                    deleting = null
                    scope.launch { if (repo.delete(item)) refresh() else snackbar.showSnackbar("Could not delete the file.") }
                }) { Text("Delete", color = MaterialTheme.colorScheme.error) }
            },
            dismissButton = { TextButton(onClick = { deleting = null }) { Text("Cancel") } },
        )
    }
}

@Composable
private fun EmptyState(modifier: Modifier, onMoreTools: () -> Unit) {
    Column(modifier.fillMaxSize().padding(32.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
        Text("No scans yet", style = MaterialTheme.typography.headlineSmall)
        Text(
            "Tap Scan to capture a document. Edges are found automatically, and you can crop, clean up and save pages as a PDF. Then reorder, crop or delete pages, sign, compress and more with All tools. Everything stays on your phone.",
            style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant, modifier = Modifier.padding(top = 8.dp, bottom = 16.dp),
        )
        OutlinedButton(onClick = onMoreTools) { Text("Back to tools") }
    }
}

@Composable
private fun ScanRow(item: ScanItem, onOpen: () -> Unit, onShare: () -> Unit, onEdit: () -> Unit, onRename: () -> Unit, onDelete: () -> Unit) {
    var menu by remember { mutableStateOf(false) }
    var thumb by remember(item.file.path, item.modified) { mutableStateOf<android.graphics.Bitmap?>(null) }
    LaunchedEffect(item.file.path, item.modified) { thumb = renderThumbnail(item.file) }
    Row(
        Modifier.fillMaxWidth().clip(RoundedCornerShape(12.dp)).background(MaterialTheme.colorScheme.surface).padding(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Box(Modifier.size(56.dp, 72.dp).clip(RoundedCornerShape(6.dp)).background(MaterialTheme.colorScheme.surfaceVariant)) {
            thumb?.let { Image(it.asImageBitmap(), contentDescription = null, contentScale = ContentScale.Crop, modifier = Modifier.fillMaxSize()) }
        }
        Column(Modifier.weight(1f).padding(horizontal = 12.dp)) {
            Text(item.title, maxLines = 1, overflow = TextOverflow.Ellipsis, style = MaterialTheme.typography.titleMedium)
            Text(
                "${DateUtils.getRelativeTimeSpanString(item.modified, System.currentTimeMillis(), DateUtils.MINUTE_IN_MILLIS)} · ${Names.formatSize(item.size)}",
                style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Row(Modifier.height(36.dp), verticalAlignment = Alignment.CenterVertically) {
                TextButton(onClick = onOpen) { Text("Open") }
                TextButton(onClick = onShare) { Text("Share") }
                TextButton(onClick = onEdit) { Text("Edit…") }
            }
        }
        Box {
            IconButton(onClick = { menu = true }) { Icon(Icons.Default.MoreVert, contentDescription = "More actions for ${item.title}") }
            DropdownMenu(expanded = menu, onDismissRequest = { menu = false }) {
                DropdownMenuItem(text = { Text("Rename") }, onClick = { menu = false; onRename() })
                DropdownMenuItem(text = { Text("Delete") }, onClick = { menu = false; onDelete() })
            }
        }
    }
}
