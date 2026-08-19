package com.tempo.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.tempo.app.ui.theme.TempoExtraShapes

data class FloatingNavItem(
    val label: String,
    val icon: ImageVector,
    val selected: Boolean,
    val onClick: () -> Unit,
)

/** A pill-shaped, floating bottom navigation bar rather than a full-width Material NavigationBar. */
@Composable
fun FloatingBottomNav(items: List<FloatingNavItem>, modifier: Modifier = Modifier) {
    Surface(
        modifier = modifier.padding(horizontal = 24.dp, vertical = 16.dp),
        shape = TempoExtraShapes.pill,
        color = MaterialTheme.colorScheme.surfaceContainerHighest,
        tonalElevation = 6.dp,
        shadowElevation = 8.dp,
    ) {
        androidx.compose.foundation.layout.Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(4.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            items.forEach { item ->
                FloatingNavButton(item)
            }
        }
    }
}

@Composable
private fun FloatingNavButton(item: FloatingNavItem) {
    val background = if (item.selected) MaterialTheme.colorScheme.primary else androidx.compose.ui.graphics.Color.Transparent
    val contentColor = if (item.selected) {
        MaterialTheme.colorScheme.onPrimary
    } else {
        MaterialTheme.colorScheme.onSurfaceVariant
    }
    Surface(
        modifier = Modifier
            .background(background, CircleShape)
            .padding(2.dp),
        shape = CircleShape,
        color = androidx.compose.ui.graphics.Color.Transparent,
        onClick = item.onClick,
    ) {
        androidx.compose.foundation.layout.Column(
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 8.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(2.dp),
        ) {
            Icon(imageVector = item.icon, contentDescription = item.label, tint = contentColor)
            if (item.selected) {
                Text(text = item.label, style = MaterialTheme.typography.labelSmall, color = contentColor)
            }
        }
    }
}
