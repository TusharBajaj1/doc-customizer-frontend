package org.pdfrookie.scanner

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import org.pdfrookie.scanner.ui.PdfRookieTheme
import org.pdfrookie.scanner.ui.ScanApp

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        val repo = ScanRepository(applicationContext)
        setContent { PdfRookieTheme { ScanApp(repo) } }
    }
}
