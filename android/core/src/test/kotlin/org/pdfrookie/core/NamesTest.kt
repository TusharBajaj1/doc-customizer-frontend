package org.pdfrookie.core

import java.time.LocalDateTime
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class NamesTest {
    private val fallback = "Scan_fallback.pdf"

    @Test fun scanFileName_isTimestamped() {
        assertEquals("Scan_2026-11-15_09-30-05.pdf", Names.scanFileName(LocalDateTime.of(2026, 11, 15, 9, 30, 5)))
    }

    @Test fun sanitize_addsExtensionOnce() {
        assertEquals("Invoice.pdf", Names.sanitize("Invoice", fallback))
        assertEquals("Invoice.pdf", Names.sanitize("Invoice.pdf", fallback))
        assertEquals("Invoice.pdf", Names.sanitize("Invoice.PDF", fallback))
    }

    @Test fun sanitize_blocksPathTraversal() {
        for (evil in listOf("../../etc/passwd", "..\\..\\windows\\system32", "/abs/path", "a/../../b", "....//x")) {
            val out = Names.sanitize(evil, fallback)
            assertFalse(out.contains('/') || out.contains('\\'), "separator survived in '$out'")
            assertFalse(out.startsWith("."), "leading dot survived in '$out'")
            assertTrue(out.endsWith(".pdf"))
        }
    }

    @Test fun sanitize_removesIllegalAndControlCharacters() {
        assertEquals("a_b_c_d.pdf", Names.sanitize("a:b*c?d", fallback))
        assertEquals("ab.pdf", Names.sanitize("a\u0000b\u0007", fallback))
        assertEquals("a b.pdf", Names.sanitize("a   \t b", fallback))
    }

    @Test fun sanitize_fallsBackWhenNothingUsable() {
        for (blank in listOf("", "   ", "...", "///", ".pdf", " . ")) assertEquals("Scan_fallback.pdf", Names.sanitize(blank, fallback), "for '$blank'")
    }

    @Test fun sanitize_limitsLength() {
        val out = Names.sanitize("x".repeat(500), fallback)
        assertEquals(80 + 4, out.length)
        assertTrue(out.endsWith(".pdf"))
    }

    @Test fun sanitize_keepsUnicode() {
        assertEquals("रसीद 2026.pdf", Names.sanitize("रसीद 2026", fallback))
        assertEquals("Café menu.pdf", Names.sanitize("Café menu", fallback))
    }

    @Test fun unique_returnsDesiredWhenFree() {
        assertEquals("A.pdf", Names.unique("A.pdf", listOf("B.pdf")))
    }

    @Test fun unique_numbersDuplicatesCaseInsensitively() {
        assertEquals("A (2).pdf", Names.unique("A.pdf", listOf("a.PDF")))
        assertEquals("A (3).pdf", Names.unique("A.pdf", listOf("A.pdf", "A (2).pdf")))
    }

    @Test fun formatSize_picksUnit() {
        assertEquals("812 B", Names.formatSize(812))
        assertEquals("1.0 KB", Names.formatSize(1024))
        assertEquals("1.5 MB", Names.formatSize(1_572_864))
    }

    @Test fun title_dropsExtension() {
        assertEquals("Invoice", Names.title("Invoice.pdf"))
        assertEquals("Invoice", Names.title("Invoice.PDF"))
        assertEquals("No extension", Names.title("No extension"))
    }
}
