package com.tempo.app.ui.theme

import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.dp

/**
 * Tempo leans into the M3 Expressive "pill" language: corners are rounded far
 * enough that most components read as capsules. Buttons, chips, and the nav
 * bar use [CircleShape] (fully round on the short axis); cards use a large
 * fixed radius so they stay pill-like without clipping long content oddly.
 */
val TempoShapes = Shapes(
    extraSmall = RoundedCornerShape(12.dp),
    small = RoundedCornerShape(16.dp),
    medium = RoundedCornerShape(24.dp),
    large = RoundedCornerShape(28.dp),
    extraLarge = CircleShape,
)

/** Extra pill shapes for components outside the default M3 shape scale. */
object TempoExtraShapes {
    val pill = CircleShape
    val card = RoundedCornerShape(28.dp)
    val habitRow = RoundedCornerShape(999.dp)
}
