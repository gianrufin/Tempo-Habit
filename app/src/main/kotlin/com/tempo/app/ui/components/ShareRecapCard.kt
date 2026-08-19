package com.tempo.app.ui.components

import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Shader
import androidx.core.content.FileProvider
import com.tempo.app.domain.model.InsightsSummary
import java.io.File
import java.io.FileOutputStream

/**
 * Renders the weekly recap as a shareable square image (gradient card, overall rate, top streaks)
 * instead of only ever landing as a silent notification — drawn with plain [Canvas]/[Paint] rather
 * than capturing a Composable, since that needs no extra rendering machinery to share reliably.
 */
fun shareWeeklyRecapCard(context: Context, summary: InsightsSummary) {
    val bitmap = renderRecapCard(summary)
    val exportsDir = File(context.cacheDir, "exports").apply { mkdirs() }
    val file = File(exportsDir, "tempo_weekly_recap.png")
    FileOutputStream(file).use { out -> bitmap.compress(Bitmap.CompressFormat.PNG, 100, out) }

    val uri = FileProvider.getUriForFile(context, "${context.packageName}.fileprovider", file)
    val intent = Intent(Intent.ACTION_SEND).apply {
        type = "image/png"
        putExtra(Intent.EXTRA_STREAM, uri)
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
    }
    context.startActivity(Intent.createChooser(intent, "Share weekly recap"))
}

private fun renderRecapCard(summary: InsightsSummary): Bitmap {
    val size = 1080
    val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)

    val backgroundPaint = Paint().apply {
        shader = LinearGradient(
            0f, 0f, size.toFloat(), size.toFloat(),
            intArrayOf(0xFF6750A4.toInt(), 0xFF386A20.toInt()),
            null,
            Shader.TileMode.CLAMP,
        )
    }
    canvas.drawRect(0f, 0f, size.toFloat(), size.toFloat(), backgroundPaint)

    val whitePaint = Paint().apply { color = 0xFFFFFFFF.toInt(); isAntiAlias = true }

    val titlePaint = Paint(whitePaint).apply { textSize = 56f; isFakeBoldText = true }
    canvas.drawText("Tempo", 72f, 140f, titlePaint)

    val subtitlePaint = Paint(whitePaint).apply { textSize = 36f; alpha = 200 }
    canvas.drawText("Weekly recap", 72f, 190f, subtitlePaint)

    val bigNumberPaint = Paint(whitePaint).apply { textSize = 220f; isFakeBoldText = true }
    canvas.drawText("${summary.overallRatePercent}%", 72f, 460f, bigNumberPaint)

    val labelPaint = Paint(whitePaint).apply { textSize = 40f; alpha = 220 }
    canvas.drawText("of scheduled habits completed", 72f, 520f, labelPaint)

    var y = 640f
    val topHabits = summary.habitInsights
        .sortedByDescending { it.doneCount + it.excusedCount }
        .take(5)
    val rowLabelPaint = Paint(whitePaint).apply { textSize = 40f }
    topHabits.forEach { insight ->
        val rate = if (insight.scheduledCount == 0) 0 else ((insight.doneCount + insight.excusedCount) * 100) / insight.scheduledCount
        canvas.drawText("${insight.habit.icon}  ${insight.habit.name} — $rate%", 72f, y, rowLabelPaint)
        y += 64f
    }

    return bitmap
}
