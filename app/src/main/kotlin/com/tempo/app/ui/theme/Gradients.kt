package com.tempo.app.ui.theme

import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color

/**
 * AMOLED-friendly gradient identities: mostly true black with a faint tonal shift, rather than a
 * fully saturated hero gradient. Each one leans on the same gold-to-purple duotone as the landing
 * page and marketing (gold top-left, purple bottom-right) instead of unrelated near-black hues,
 * just mixed subtly enough to stay AMOLED-friendly and keep text/content readable on top.
 */
object TempoGradients {
    val home = Brush.linearGradient(
        colors = listOf(Color(0xFF160D02), Color(0xFF0A0612), Color(0xFF10081E)),
    )

    val reflect = Brush.linearGradient(
        colors = listOf(Color(0xFF1A0F02), Color(0xFF0C0710), Color(0xFF0A0518)),
    )

    val detail = Brush.linearGradient(
        colors = listOf(Color(0xFF0C0714), Color(0xFF0A0612), Color(0xFF000000)),
    )

    val calm = Brush.linearGradient(
        colors = listOf(Color(0xFF120A02), Color(0xFF0E081A), Color(0xFF07040F)),
    )
}

/** Translucent-white surface tones for content that sits on top of a full-bleed gradient. */
object OnGradient {
    val textPrimary = Color.White
    val textSecondary = Color.White.copy(alpha = 0.7f)
    val surface = Color.White.copy(alpha = 0.08f)
    val surfaceStrong = Color.White.copy(alpha = 0.16f)
    val outline = Color.White.copy(alpha = 0.25f)
}
