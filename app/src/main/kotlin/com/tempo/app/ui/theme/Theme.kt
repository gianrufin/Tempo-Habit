package com.tempo.app.ui.theme

import android.os.Build
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext

private val TempoLightColorScheme = lightColorScheme(
    primary = TempoPrimary,
    onPrimary = TempoOnPrimary,
    primaryContainer = TempoPrimaryContainer,
    onPrimaryContainer = TempoOnPrimaryContainer,
    secondary = TempoSecondary,
    onSecondary = TempoOnSecondary,
    secondaryContainer = TempoSecondaryContainer,
    onSecondaryContainer = TempoOnSecondaryContainer,
    tertiary = TempoTertiary,
    onTertiary = TempoOnTertiary,
    tertiaryContainer = TempoTertiaryContainer,
    onTertiaryContainer = TempoOnTertiaryContainer,
    background = TempoBackground,
    onBackground = TempoOnBackground,
    surface = TempoSurface,
    onSurface = TempoOnSurface,
)

private val TempoDarkColorScheme = darkColorScheme(
    primary = TempoPrimaryDark,
    onPrimary = TempoOnPrimaryDark,
    primaryContainer = TempoPrimaryContainerDark,
    onPrimaryContainer = TempoOnPrimaryContainerDark,
    secondary = TempoSecondaryDark,
    onSecondary = TempoOnSecondaryDark,
    secondaryContainer = TempoSecondaryContainerDark,
    onSecondaryContainer = TempoOnSecondaryContainerDark,
    tertiary = TempoTertiaryDark,
    onTertiary = TempoOnTertiaryDark,
    tertiaryContainer = TempoTertiaryContainerDark,
    onTertiaryContainer = TempoOnTertiaryContainerDark,
    background = TempoBackgroundDark,
    onBackground = TempoOnBackgroundDark,
    surface = TempoSurfaceDark,
    onSurface = TempoOnSurfaceDark,
)

/**
 * Tempo's theme. Uses Material You dynamic color on Android 12+ (wallpaper
 * derived), falling back to the curated Tempo palette on older versions.
 */
@Composable
fun TempoTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit,
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> TempoDarkColorScheme
        else -> TempoLightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = TempoTypography,
        shapes = TempoShapes,
        content = content,
    )
}
