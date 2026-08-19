package com.tempo.app.data.local

import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

/**
 * Every schema change up to now has only ever added new tables (Tasks, Mood, Goals) — never
 * touched an existing one — so each step here is a plain CREATE TABLE, preserving every habit,
 * routine, and completion already on the device. Before this, schema bumps relied on
 * [androidx.room.RoomDatabase.Builder.fallbackToDestructiveMigration], which silently drops and
 * recreates every table on a version mismatch: fine for development, but it means anyone updating
 * across one of these version bumps lost all their locally saved habits with no warning. That
 * must never happen again on a schema bump — hence explicit migrations instead of destructive
 * fallback from here on.
 */
object Migrations {

    val MIGRATION_2_3 = object : Migration(2, 3) {
        override fun migrate(db: SupportSQLiteDatabase) {
            db.execSQL(
                """
                CREATE TABLE IF NOT EXISTS `tasks` (
                    `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                    `title` TEXT NOT NULL,
                    `notes` TEXT NOT NULL,
                    `isRecurring` INTEGER NOT NULL,
                    `recurrenceRule` TEXT,
                    `dueDate` INTEGER,
                    `reminderTime` INTEGER,
                    `priority` TEXT NOT NULL,
                    `createdAt` INTEGER NOT NULL,
                    `archived` INTEGER NOT NULL,
                    `completedAt` INTEGER
                )
                """.trimIndent(),
            )
            db.execSQL(
                """
                CREATE TABLE IF NOT EXISTS `task_completions` (
                    `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                    `taskId` INTEGER NOT NULL,
                    `date` INTEGER NOT NULL,
                    `completedAt` INTEGER NOT NULL,
                    FOREIGN KEY(`taskId`) REFERENCES `tasks`(`id`) ON DELETE CASCADE
                )
                """.trimIndent(),
            )
            db.execSQL(
                "CREATE UNIQUE INDEX IF NOT EXISTS `index_task_completions_taskId_date` " +
                    "ON `task_completions` (`taskId`, `date`)",
            )
        }
    }

    val MIGRATION_3_4 = object : Migration(3, 4) {
        override fun migrate(db: SupportSQLiteDatabase) {
            db.execSQL(
                """
                CREATE TABLE IF NOT EXISTS `mood_entries` (
                    `date` INTEGER PRIMARY KEY NOT NULL,
                    `mood` TEXT NOT NULL,
                    `note` TEXT NOT NULL
                )
                """.trimIndent(),
            )
        }
    }

    val MIGRATION_4_5 = object : Migration(4, 5) {
        override fun migrate(db: SupportSQLiteDatabase) {
            db.execSQL(
                """
                CREATE TABLE IF NOT EXISTS `goals` (
                    `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                    `title` TEXT NOT NULL,
                    `linkedHabitId` INTEGER NOT NULL,
                    `targetCompletions` INTEGER NOT NULL,
                    `startDate` INTEGER NOT NULL,
                    `deadline` INTEGER,
                    `archived` INTEGER NOT NULL
                )
                """.trimIndent(),
            )
        }
    }

    val MIGRATION_5_6 = object : Migration(5, 6) {
        override fun migrate(db: SupportSQLiteDatabase) {
            db.execSQL("ALTER TABLE `habits` ADD COLUMN `pausedUntil` INTEGER DEFAULT NULL")
            db.execSQL(
                """
                CREATE TABLE IF NOT EXISTS `task_checklist_items` (
                    `id` INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
                    `taskId` INTEGER NOT NULL,
                    `label` TEXT NOT NULL,
                    `done` INTEGER NOT NULL,
                    `sortOrder` INTEGER NOT NULL,
                    FOREIGN KEY(`taskId`) REFERENCES `tasks`(`id`) ON DELETE CASCADE
                )
                """.trimIndent(),
            )
            db.execSQL(
                "CREATE INDEX IF NOT EXISTS `index_task_checklist_items_taskId` " +
                    "ON `task_checklist_items` (`taskId`)",
            )
        }
    }

    val ALL = arrayOf(MIGRATION_2_3, MIGRATION_3_4, MIGRATION_4_5, MIGRATION_5_6)
}
