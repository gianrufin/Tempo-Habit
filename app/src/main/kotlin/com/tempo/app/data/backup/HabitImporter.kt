package com.tempo.app.data.backup

import com.tempo.app.data.repository.HabitRepository
import com.tempo.app.domain.model.Habit
import com.tempo.app.domain.model.RecurrenceRule
import com.tempo.app.domain.model.TimeOfDay
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json
import java.time.DayOfWeek
import java.time.LocalDate
import javax.inject.Inject

@Serializable
data class HabitImportDto(
    val name: String,
    val icon: String = "✅",
    val colorArgb: Long = 0xFF6750A4L,
    val category: String? = null,
    /** DAILY | WEEKDAYS:MON,WED | EVERY_N:3 | TIMES_PER_WEEK:3 | MONTHLY:15 */
    val recurrence: String = "DAILY",
    val timeOfDay: String = "MORNING",
)

/**
 * Bulk-creates habits from a user-supplied CSV or JSON file, so switching from another habit
 * tracker (or restoring a hand-edited list) doesn't mean retyping every habit one at a time —
 * complements the full-database backup/restore, which only round-trips Tempo's own backups.
 */
class HabitImporter @Inject constructor(
    private val habitRepository: HabitRepository,
) {
    suspend fun importJson(text: String): Result<Int> = withContext(Dispatchers.Default) {
        runCatching {
            val dtos = Json { ignoreUnknownKeys = true }.decodeFromString<List<HabitImportDto>>(text)
            importDtos(dtos)
        }
    }

    /** Header: name,icon,color,recurrence,timeOfDay — same mini-grammar as [HabitImportDto.recurrence]. */
    suspend fun importCsv(text: String): Result<Int> = withContext(Dispatchers.Default) {
        runCatching {
            val lines = text.lines().map { it.trim() }.filter { it.isNotBlank() }
            val dataLines = if (lines.firstOrNull()?.startsWith("name", ignoreCase = true) == true) lines.drop(1) else lines
            val dtos = dataLines.map { line ->
                val parts = line.split(",").map { it.trim() }
                HabitImportDto(
                    name = parts.getOrNull(0).orEmpty(),
                    icon = parts.getOrNull(1)?.takeIf { it.isNotBlank() } ?: "✅",
                    colorArgb = parts.getOrNull(2)?.toLongOrNull() ?: 0xFF6750A4L,
                    recurrence = parts.getOrNull(3)?.takeIf { it.isNotBlank() } ?: "DAILY",
                    timeOfDay = parts.getOrNull(4)?.takeIf { it.isNotBlank() } ?: "MORNING",
                )
            }.filter { it.name.isNotBlank() }
            importDtos(dtos)
        }
    }

    private suspend fun importDtos(dtos: List<HabitImportDto>): Int {
        var imported = 0
        dtos.forEach { dto ->
            if (dto.name.isBlank()) return@forEach
            habitRepository.addHabit(
                Habit(
                    name = dto.name.trim(),
                    icon = dto.icon,
                    colorArgb = dto.colorArgb,
                    category = dto.category,
                    recurrenceRule = parseRecurrence(dto.recurrence),
                    timeOfDay = runCatching { TimeOfDay.valueOf(dto.timeOfDay.uppercase()) }.getOrDefault(TimeOfDay.MORNING),
                    createdAt = LocalDate.now(),
                ),
            )
            imported++
        }
        return imported
    }

    private fun parseRecurrence(spec: String): RecurrenceRule {
        val (kind, arg) = spec.split(":", limit = 2).let { it[0].trim().uppercase() to it.getOrNull(1)?.trim() }
        return when (kind) {
            "WEEKDAYS" -> {
                val days = arg?.split(",")?.mapNotNull { token ->
                    runCatching { DayOfWeek.valueOf(shortDayToFull(token.trim().uppercase())) }.getOrNull()
                }?.toSet().orEmpty()
                RecurrenceRule.SpecificWeekdays(days.ifEmpty { setOf(DayOfWeek.MONDAY) })
            }
            "EVERY_N" -> RecurrenceRule.EveryNDays(arg?.toIntOrNull() ?: 2, LocalDate.now().toEpochDay())
            "TIMES_PER_WEEK" -> RecurrenceRule.TimesPerWeek(arg?.toIntOrNull() ?: 3)
            "MONTHLY" -> RecurrenceRule.MonthlyByDate(arg?.toIntOrNull() ?: 1)
            else -> RecurrenceRule.Daily
        }
    }

    private fun shortDayToFull(token: String): String = when (token.take(3)) {
        "MON" -> "MONDAY"
        "TUE" -> "TUESDAY"
        "WED" -> "WEDNESDAY"
        "THU" -> "THURSDAY"
        "FRI" -> "FRIDAY"
        "SAT" -> "SATURDAY"
        "SUN" -> "SUNDAY"
        else -> token
    }
}
