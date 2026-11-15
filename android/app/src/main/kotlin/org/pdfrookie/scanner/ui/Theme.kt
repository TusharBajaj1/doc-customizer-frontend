package org.pdfrookie.scanner.ui

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val Vermilion = Color(0xFFE0431A)
private val Ink = Color(0xFF1C1814)
private val Paper = Color(0xFFFAF6EE)

private val Light = lightColorScheme(
    primary = Vermilion, onPrimary = Color.White,
    background = Paper, onBackground = Ink,
    surface = Color.White, onSurface = Ink,
    surfaceVariant = Color(0xFFF2ECDF), onSurfaceVariant = Color(0xFF5C5445),
    error = Color(0xFFB83312),
)

private val Dark = darkColorScheme(
    primary = Color(0xFFFF7A52), onPrimary = Ink,
    background = Color(0xFF14110E), onBackground = Paper,
    surface = Color(0xFF1C1814), onSurface = Paper,
    surfaceVariant = Color(0xFF2B2620), onSurfaceVariant = Color(0xFFCFC5AF),
    error = Color(0xFFFFB4A1),
)

@Composable
fun PdfRookieTheme(content: @Composable () -> Unit) {
    MaterialTheme(colorScheme = if (isSystemInDarkTheme()) Dark else Light, content = content)
}
