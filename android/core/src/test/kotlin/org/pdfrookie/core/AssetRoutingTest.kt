package org.pdfrookie.core

import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class AssetRoutingTest {
    private data class Case(val kind: String, val input: String, val expected: String?)

    private fun cases(): List<Case> {
        val text = javaClass.getResourceAsStream("/asset_routing_cases.tsv")!!.bufferedReader().readText()
        return text.lines().filter { it.isNotBlank() && !it.startsWith("#") }.map {
            val (kind, input, expected) = it.split('\t')
            Case(kind, if (input == "(empty)") "" else input, if (expected == "-") null else expected)
        }
    }

    @Test fun sharedTable_isNotEmpty() = assertTrue(cases().size > 20)

    @Test fun resolve_matchesSharedTable() {
        for (c in cases().filter { it.kind == "resolve" }) assertEquals(c.expected, AssetRouting.resolve(c.input), "resolve('${c.input}')")
    }

    @Test fun mime_matchesSharedTable() {
        for (c in cases().filter { it.kind == "mime" }) assertEquals(c.expected, AssetRouting.mimeFor(c.input), "mimeFor('${c.input}')")
    }

    @Test fun resolve_neverEscapesTheSiteFolder() {
        for (evil in listOf("..", "../", "../../etc/passwd", "a/../..", "x/../../y", "./a", "a/.", "\u0000", "a\\..\\b")) {
            assertEquals(null, AssetRouting.resolve(evil), "should refuse '$evil'")
        }
    }
}
