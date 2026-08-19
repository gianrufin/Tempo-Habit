package com.tempo.app.data.preferences

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.stringPreferencesKey
import com.tempo.app.domain.model.ThemeMode
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import javax.inject.Inject

private object PreferenceKeys {
    val DISPLAY_NAME = stringPreferencesKey("display_name")
    val THEME_MODE = stringPreferencesKey("theme_mode")
    val DYNAMIC_COLOR_ENABLED = booleanPreferencesKey("dynamic_color_enabled")
    val BACKUP_FOLDER_URI = stringPreferencesKey("backup_folder_uri")
    val BACKUP_DAILY_ENABLED = booleanPreferencesKey("backup_daily_enabled")
    val BACKUP_HOUR = intPreferencesKey("backup_hour")
    val BACKUP_MINUTE = intPreferencesKey("backup_minute")
    val LAST_BACKUP_AT_MILLIS = longPreferencesKey("last_backup_at_millis")
    val ALARM_SOUND_URI = stringPreferencesKey("alarm_sound_uri")
    val ALARM_SOUND_LABEL = stringPreferencesKey("alarm_sound_label")
    val NOTIFICATION_SOUND_URI = stringPreferencesKey("notification_sound_uri")
    val NOTIFICATION_SOUND_LABEL = stringPreferencesKey("notification_sound_label")
    val AUTO_DND_DURING_FOCUS = booleanPreferencesKey("auto_dnd_during_focus")
}

class PreferencesRepository @Inject constructor(
    private val dataStore: DataStore<Preferences>,
) {
    val userPreferences: Flow<UserPreferences> = dataStore.data.map { prefs ->
        UserPreferences(
            displayName = prefs[PreferenceKeys.DISPLAY_NAME] ?: "",
            themeMode = prefs[PreferenceKeys.THEME_MODE]?.let { runCatching { ThemeMode.valueOf(it) }.getOrNull() }
                ?: ThemeMode.SYSTEM,
            dynamicColorEnabled = prefs[PreferenceKeys.DYNAMIC_COLOR_ENABLED] ?: true,
            backupFolderUri = prefs[PreferenceKeys.BACKUP_FOLDER_URI],
            backupDailyEnabled = prefs[PreferenceKeys.BACKUP_DAILY_ENABLED] ?: false,
            backupHour = prefs[PreferenceKeys.BACKUP_HOUR] ?: 21,
            backupMinute = prefs[PreferenceKeys.BACKUP_MINUTE] ?: 0,
            lastBackupAtMillis = prefs[PreferenceKeys.LAST_BACKUP_AT_MILLIS],
            alarmSoundUri = prefs[PreferenceKeys.ALARM_SOUND_URI],
            alarmSoundLabel = prefs[PreferenceKeys.ALARM_SOUND_LABEL] ?: "Default alarm sound",
            notificationSoundUri = prefs[PreferenceKeys.NOTIFICATION_SOUND_URI],
            notificationSoundLabel = prefs[PreferenceKeys.NOTIFICATION_SOUND_LABEL] ?: "Default notification sound",
            autoDndDuringFocus = prefs[PreferenceKeys.AUTO_DND_DURING_FOCUS] ?: false,
        )
    }

    suspend fun setDisplayName(name: String) {
        dataStore.edit { it[PreferenceKeys.DISPLAY_NAME] = name }
    }

    suspend fun setThemeMode(mode: ThemeMode) {
        dataStore.edit { it[PreferenceKeys.THEME_MODE] = mode.name }
    }

    suspend fun setDynamicColorEnabled(enabled: Boolean) {
        dataStore.edit { it[PreferenceKeys.DYNAMIC_COLOR_ENABLED] = enabled }
    }

    suspend fun setBackupFolderUri(uri: String?) {
        dataStore.edit {
            if (uri == null) it.remove(PreferenceKeys.BACKUP_FOLDER_URI) else it[PreferenceKeys.BACKUP_FOLDER_URI] = uri
        }
    }

    suspend fun setBackupDailyEnabled(enabled: Boolean) {
        dataStore.edit { it[PreferenceKeys.BACKUP_DAILY_ENABLED] = enabled }
    }

    suspend fun setBackupTime(hour: Int, minute: Int) {
        dataStore.edit {
            it[PreferenceKeys.BACKUP_HOUR] = hour
            it[PreferenceKeys.BACKUP_MINUTE] = minute
        }
    }

    suspend fun setLastBackupAtMillis(millis: Long) {
        dataStore.edit { it[PreferenceKeys.LAST_BACKUP_AT_MILLIS] = millis }
    }

    suspend fun setAlarmSound(uri: String?, label: String) {
        dataStore.edit {
            if (uri == null) it.remove(PreferenceKeys.ALARM_SOUND_URI) else it[PreferenceKeys.ALARM_SOUND_URI] = uri
            it[PreferenceKeys.ALARM_SOUND_LABEL] = label
        }
    }

    suspend fun setNotificationSound(uri: String?, label: String) {
        dataStore.edit {
            if (uri == null) it.remove(PreferenceKeys.NOTIFICATION_SOUND_URI) else it[PreferenceKeys.NOTIFICATION_SOUND_URI] = uri
            it[PreferenceKeys.NOTIFICATION_SOUND_LABEL] = label
        }
    }

    suspend fun setAutoDndDuringFocus(enabled: Boolean) {
        dataStore.edit { it[PreferenceKeys.AUTO_DND_DURING_FOCUS] = enabled }
    }
}
