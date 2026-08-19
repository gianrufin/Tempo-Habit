package com.tempo.app.data.backup

import android.content.Context
import android.net.Uri
import androidx.documentfile.provider.DocumentFile
import com.tempo.app.data.local.TempoDatabase
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import javax.inject.Inject

/**
 * Backs up the Room database file to a user-chosen SAF tree (a local folder or, since Google Drive
 * registers itself as a DocumentsProvider, a Drive folder) — no Firebase/Supabase project or
 * OAuth client needed, since the user picks the destination through Android's own file picker.
 */
class BackupManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val database: TempoDatabase,
) {
    suspend fun backupTo(treeUri: Uri): Result<String> = withContext(Dispatchers.IO) {
        runCatching {
            // Room uses WAL journal mode, so recently written rows (on a lightly-used app, this
            // can mean *all* of them, including the very tables themselves) live in the
            // `tempo.db-wal` sidecar file until a checkpoint merges them into the main file that
            // gets copied below. Android's SQLite cursor is lazy — it doesn't actually run the
            // query until something reads from it — so `.close()` alone without ever consuming
            // the cursor may never execute the checkpoint at all. TRUNCATE (rather than FULL)
            // additionally empties the WAL file afterward, so there's no ambiguity about whether
            // the merge actually happened.
            database.query("PRAGMA wal_checkpoint(TRUNCATE)", null).use { it.moveToFirst() }

            val treeDoc = DocumentFile.fromTreeUri(context, treeUri)
                ?: error("Can't access the selected folder")
            val fileName = "tempo_backup_${LocalDateTime.now().format(FILE_TIMESTAMP_FORMAT)}.db"

            treeDoc.findFile(fileName)?.delete()
            val newDoc = treeDoc.createFile("application/octet-stream", fileName)
                ?: error("Can't create the backup file")

            context.contentResolver.openOutputStream(newDoc.uri)?.use { out ->
                context.getDatabasePath(TempoDatabase.DATABASE_NAME).inputStream().use { it.copyTo(out) }
            } ?: error("Can't open the backup file for writing")

            fileName
        }
    }

    /**
     * Stages [fileUri]'s contents to be swapped in for the live database the next time the app
     * starts — see [BackupRestoreStaging] for why it isn't applied immediately.
     */
    suspend fun restoreFrom(fileUri: Uri): Result<Unit> = withContext(Dispatchers.IO) {
        BackupRestoreStaging.stage(context) { context.contentResolver.openInputStream(fileUri) }
    }

    companion object {
        private val FILE_TIMESTAMP_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd_HHmm")
    }
}
