package org.pdfrookie.scanner

import android.content.Context
import android.net.Uri
import androidx.core.content.FileProvider
import java.io.File
import java.time.LocalDateTime
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.pdfrookie.core.Names

data class ScanItem(val file: File) {
    val name: String get() = file.name
    val title: String get() = Names.title(file.name)
    val modified: Long get() = file.lastModified()
    val size: Long get() = file.length()
}

/** Stores scans as PDFs in the app's private storage. Nothing is ever uploaded. */
class ScanRepository(private val context: Context) {
    private val dir: File get() = File(context.filesDir, "scans").apply { mkdirs() }

    private fun pdfs(): List<File> =
        dir.listFiles { f -> f.isFile && f.name.endsWith(Names.EXTENSION, ignoreCase = true) }?.toList() ?: emptyList()

    suspend fun list(): List<ScanItem> = withContext(Dispatchers.IO) {
        pdfs().sortedByDescending { it.lastModified() }.map(::ScanItem)
    }

    /** Copies the scanner's temporary PDF into private storage under a timestamped name. */
    suspend fun import(source: Uri): ScanItem = withContext(Dispatchers.IO) {
        val name = Names.unique(Names.scanFileName(LocalDateTime.now()), pdfs().map { it.name })
        val target = File(dir, name)
        val input = context.contentResolver.openInputStream(source) ?: error("Could not read the scan")
        input.use { src -> target.outputStream().use { src.copyTo(it) } }
        ScanItem(target)
    }

    /** Renames a scan. The name is sanitised, made unique, and checked to stay inside the scans folder. */
    suspend fun rename(item: ScanItem, requested: String): ScanItem = withContext(Dispatchers.IO) {
        val others = pdfs().map { it.name }.filter { !it.equals(item.name, ignoreCase = true) }
        val name = Names.unique(Names.sanitize(requested, fallback = item.name), others)
        val target = File(dir, name)
        check(target.canonicalFile.parentFile == dir.canonicalFile) { "Invalid file name" }
        if (target.name != item.file.name) check(item.file.renameTo(target)) { "Could not rename" }
        ScanItem(target)
    }

    suspend fun delete(item: ScanItem): Boolean = withContext(Dispatchers.IO) { item.file.delete() }

    fun shareUri(item: ScanItem): Uri = FileProvider.getUriForFile(context, "${context.packageName}.files", item.file)
}
