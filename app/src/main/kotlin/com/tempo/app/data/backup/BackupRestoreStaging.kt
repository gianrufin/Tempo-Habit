package com.tempo.app.data.backup

import android.content.Context
import com.tempo.app.data.local.TempoDatabase
import java.io.File

/**
 * Restoring by copying straight over the live database file (while Room is open and other screens
 * have active Flow collectors querying it) crashes: closing the shared Room connection out from
 * under in-flight queries throws on whatever coroutine is mid-query, not on the caller of restore.
 *
 * Instead, a picked backup file is staged to app-private storage, and applied here — plain file
 * I/O, no Hilt, no Room — as the very first thing [com.tempo.app.TempoApplication.onCreate] does,
 * before anything in the app has requested a [TempoDatabase] instance and before Room has ever
 * opened a connection to the (about to be overwritten) file.
 */
object BackupRestoreStaging {
    private const val PENDING_RESTORE_FILE_NAME = "pending_restore.db"

    private fun pendingFile(context: Context) = File(context.filesDir, PENDING_RESTORE_FILE_NAME)

    /** Copies the picked backup file into app-private storage, to be applied on next app start. */
    fun stage(context: Context, sourceInputStreamProvider: () -> java.io.InputStream?): Result<Unit> = runCatching {
        val input = sourceInputStreamProvider() ?: error("Can't read the selected backup file")
        input.use { stream ->
            pendingFile(context).outputStream().use { output -> stream.copyTo(output) }
        }
    }

    fun hasPendingRestore(context: Context): Boolean = pendingFile(context).exists()

    /** Call before anything touches Room. No-ops if nothing is staged. */
    fun applyIfNeeded(context: Context) {
        val staged = pendingFile(context)
        if (!staged.exists()) return

        val dbFile = context.getDatabasePath(TempoDatabase.DATABASE_NAME)
        staged.copyTo(dbFile, overwrite = true)
        File(dbFile.path + "-wal").delete()
        File(dbFile.path + "-shm").delete()
        staged.delete()
    }
}
