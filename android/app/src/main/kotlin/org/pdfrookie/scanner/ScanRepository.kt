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

    /** Picks a unique, sanitised file in the scans folder (never outside it). [excluding] is a name that may be overwritten. */
    private fun targetFile(desired: String?, excluding: String? = null): File {
        val fallback = Names.scanFileName(LocalDateTime.now())
        val taken = pdfs().map { it.name }.filter { excluding == null || !it.equals(excluding, ignoreCase = true) }
        val name = Names.unique(if (desired.isNullOrBlank()) fallback else Names.sanitize(desired, fallback), taken)
        val file = File(dir, name)
        check(file.canonicalFile.parentFile == dir.canonicalFile) { "Invalid file name" }
        return file
    }

    /** Copies the scanner's temporary PDF into private storage under the chosen (or a timestamped) name. */
    suspend fun import(source: Uri, desiredName: String? = null): ScanItem = withContext(Dispatchers.IO) {
        val target = targetFile(desiredName)
        val input = context.contentResolver.openInputStream(source) ?: error("Could not read the scan")
        input.use { src -> target.outputStream().use { src.copyTo(it) } }
        ScanItem(target)
    }

    /** Adds a PDF produced elsewhere (for example by a tool) to the scans list. */
    suspend fun addFromFile(file: File, desiredName: String): ScanItem = withContext(Dispatchers.IO) {
        val target = targetFile(desiredName)
        file.copyTo(target)
        ScanItem(target)
    }

    /** Replaces [old] with the contents of [file], under the chosen name. */
    suspend fun replace(old: ScanItem, file: File, desiredName: String): ScanItem = withContext(Dispatchers.IO) {
        val target = targetFile(desiredName, excluding = old.name)
        file.copyTo(target, overwrite = true)
        if (old.file.canonicalPath != target.canonicalPath) old.file.delete()
        ScanItem(target)
    }

    /** Looks up a scan by file name (used to open a scan in a tool). Names come from our own list, but are still checked. */
    fun find(name: String): ScanItem? = pdfs().firstOrNull { it.name == name }?.let(::ScanItem)

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
