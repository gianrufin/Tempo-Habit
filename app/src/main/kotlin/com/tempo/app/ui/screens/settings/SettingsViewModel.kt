package com.tempo.app.ui.screens.settings

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.tempo.app.alarm.AlarmDiagnostics
import com.tempo.app.alarm.AlarmReliabilityChecker
import com.tempo.app.alarm.AlarmRequestCodes
import com.tempo.app.alarm.ExactAlarmScheduler
import com.tempo.app.alarm.ReminderAlarmReceiver
import com.tempo.app.data.backup.BackupManager
import com.tempo.app.data.backup.BackupScheduler
import com.tempo.app.data.backup.HabitImporter
import com.tempo.app.data.preferences.PreferencesRepository
import com.tempo.app.data.preferences.UserPreferences
import com.tempo.app.data.repository.HabitRepository
import com.tempo.app.data.update.AppUpdater
import com.tempo.app.data.update.UpdateCheckResult
import com.tempo.app.data.update.UpdateChecker
import com.tempo.app.domain.model.ThemeMode
import com.tempo.app.reminder.NotificationHelper
import com.tempo.app.timer.FocusDndController
import dagger.hilt.android.lifecycle.HiltViewModel
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import javax.inject.Inject

data class UpdateCheckUiState(
    val isChecking: Boolean = false,
    val result: UpdateCheckResult? = null,
)

data class BackupUiState(
    val isRunning: Boolean = false,
    val lastResultMessage: String? = null,
)

data class RestoreUiState(
    val isRunning: Boolean = false,
    val restoredSuccessfully: Boolean = false,
    val errorMessage: String? = null,
)

data class HabitImportUiState(
    val isRunning: Boolean = false,
    val resultMessage: String? = null,
)

data class NotificationTestUiState(
    val testNotificationMessage: String? = null,
    val testAlarmScheduled: Boolean = false,
    val testAlarmScheduleError: String? = null,
    val lastAlarmReceivedSummary: String? = null,
)

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val preferencesRepository: PreferencesRepository,
    private val habitRepository: HabitRepository,
    private val updateChecker: UpdateChecker,
    private val appUpdater: AppUpdater,
    private val backupManager: BackupManager,
    private val backupScheduler: BackupScheduler,
    private val habitImporter: HabitImporter,
    private val notificationHelper: NotificationHelper,
    private val exactAlarmScheduler: ExactAlarmScheduler,
    private val focusDndController: FocusDndController,
    private val alarmReliabilityChecker: AlarmReliabilityChecker,
    @ApplicationContext private val appContext: Context,
) : ViewModel() {

    val preferences: StateFlow<UserPreferences> = preferencesRepository.userPreferences
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5_000), UserPreferences())

    private val _updateCheckState = MutableStateFlow(UpdateCheckUiState())
    val updateCheckState = _updateCheckState.asStateFlow()

    private val _backupState = MutableStateFlow(BackupUiState())
    val backupState = _backupState.asStateFlow()

    private val _restoreState = MutableStateFlow(RestoreUiState())
    val restoreState = _restoreState.asStateFlow()

    private val _habitImportState = MutableStateFlow(HabitImportUiState())
    val habitImportState = _habitImportState.asStateFlow()

    private val _notificationTestState = MutableStateFlow(NotificationTestUiState())
    val notificationTestState = _notificationTestState.asStateFlow()

    fun areNotificationsEnabled(): Boolean = notificationHelper.areNotificationsEnabled()

    fun sendTestNotificationNow() {
        viewModelScope.launch {
            val posted = notificationHelper.showTestNotificationNow()
            _notificationTestState.value = NotificationTestUiState(
                testNotificationMessage = if (posted) {
                    "Sent — check your notification shade now."
                } else {
                    "Blocked: notification permission isn't granted. Use the button above to fix that."
                },
            )
        }
    }

    fun scheduleTestAlarm() {
        val intent = Intent(appContext, ReminderAlarmReceiver::class.java).apply {
            action = ReminderAlarmReceiver.ACTION_TEST_ALARM
        }
        val result = exactAlarmScheduler.scheduleAlarmClock(
            AlarmRequestCodes.TEST,
            System.currentTimeMillis() + 10_000L,
            intent,
        )
        _notificationTestState.value = if (result.isSuccess) {
            NotificationTestUiState(testAlarmScheduled = true)
        } else {
            NotificationTestUiState(testAlarmScheduleError = "Scheduling failed: ${result.exceptionOrNull()?.message}")
        }
    }

    /** Reads whether the alarm-fired diagnostic marker (written by the receivers themselves,
     * independent of whether notification posting succeeds) has been updated recently — the only
     * way to tell "the alarm never reached the app" apart from "it arrived but showing failed." */
    fun refreshLastAlarmReceivedSummary() {
        val (action, firedAtMillis) = AlarmDiagnostics.lastFired(appContext) ?: run {
            _notificationTestState.value = _notificationTestState.value.copy(
                lastAlarmReceivedSummary = "No alarm has ever reached this app yet.",
            )
            return
        }
        val secondsAgo = (System.currentTimeMillis() - firedAtMillis) / 1000
        _notificationTestState.value = _notificationTestState.value.copy(
            lastAlarmReceivedSummary = "Last alarm reached the app: $action, ${secondsAgo}s ago.",
        )
    }

    fun onDisplayNameChange(name: String) {
        viewModelScope.launch { preferencesRepository.setDisplayName(name) }
    }

    fun onThemeModeChange(mode: ThemeMode) {
        viewModelScope.launch { preferencesRepository.setThemeMode(mode) }
    }

    fun onDynamicColorChange(enabled: Boolean) {
        viewModelScope.launch { preferencesRepository.setDynamicColorEnabled(enabled) }
    }

    fun checkForUpdate() {
        viewModelScope.launch {
            _updateCheckState.value = UpdateCheckUiState(isChecking = true)
            val result = updateChecker.checkForUpdate()
            _updateCheckState.value = UpdateCheckUiState(isChecking = false, result = result)
        }
    }

    val updateDownloadState = appUpdater.downloadState

    fun canInstallPackages(): Boolean = appUpdater.canInstallPackages()
    fun requestInstallPackagesPermission() = appUpdater.requestInstallPackagesPermission()
    fun promptInstallUpdate() = appUpdater.promptInstall()
    fun resetUpdateDownload() = appUpdater.reset()

    fun downloadUpdate() {
        viewModelScope.launch { appUpdater.downloadUpdate() }
    }

    suspend fun exportCsv(): String = habitRepository.exportAllCompletionsCsv()

    fun onBackupFolderSelected(uri: Uri) {
        viewModelScope.launch { preferencesRepository.setBackupFolderUri(uri.toString()) }
    }

    fun onBackupDailyEnabledChange(enabled: Boolean) {
        viewModelScope.launch { preferencesRepository.setBackupDailyEnabled(enabled) }
    }

    fun onBackupTimeChange(hour: Int, minute: Int) {
        viewModelScope.launch { preferencesRepository.setBackupTime(hour, minute) }
        backupScheduler.scheduleDaily(hour, minute)
    }

    fun backupNow() {
        val uriString = preferences.value.backupFolderUri ?: return
        viewModelScope.launch {
            _backupState.value = BackupUiState(isRunning = true)
            val result = backupManager.backupTo(Uri.parse(uriString))
            if (result.isSuccess) {
                preferencesRepository.setLastBackupAtMillis(System.currentTimeMillis())
                _backupState.value = BackupUiState(lastResultMessage = "Backed up as ${result.getOrNull()}")
            } else {
                _backupState.value = BackupUiState(lastResultMessage = "Backup failed: ${result.exceptionOrNull()?.message}")
            }
        }
    }

    fun restoreFrom(uri: Uri) {
        viewModelScope.launch {
            _restoreState.value = RestoreUiState(isRunning = true)
            val result = backupManager.restoreFrom(uri)
            _restoreState.value = if (result.isSuccess) {
                RestoreUiState(restoredSuccessfully = true)
            } else {
                RestoreUiState(errorMessage = "Restore failed: ${result.exceptionOrNull()?.message}")
            }
        }
    }

    fun importHabits(uri: Uri) {
        viewModelScope.launch {
            _habitImportState.value = HabitImportUiState(isRunning = true)
            val text = runCatching {
                appContext.contentResolver.openInputStream(uri)?.bufferedReader()?.use { it.readText() }
            }.getOrNull()
            if (text.isNullOrBlank()) {
                _habitImportState.value = HabitImportUiState(resultMessage = "Couldn't read that file.")
                return@launch
            }
            val result = if (text.trimStart().startsWith("[")) {
                habitImporter.importJson(text)
            } else {
                habitImporter.importCsv(text)
            }
            _habitImportState.value = if (result.isSuccess) {
                HabitImportUiState(resultMessage = "Imported ${result.getOrNull()} habit(s).")
            } else {
                HabitImportUiState(resultMessage = "Import failed: ${result.exceptionOrNull()?.message}")
            }
        }
    }

    fun onAlarmSoundSelected(uri: Uri?, label: String) {
        viewModelScope.launch { preferencesRepository.setAlarmSound(uri?.toString(), label) }
    }

    fun onNotificationSoundSelected(uri: Uri?, label: String) {
        viewModelScope.launch { preferencesRepository.setNotificationSound(uri?.toString(), label) }
    }

    fun canScheduleExactAlarms(): Boolean = alarmReliabilityChecker.canScheduleExactAlarms()
    fun isIgnoringBatteryOptimizations(): Boolean = alarmReliabilityChecker.isIgnoringBatteryOptimizations()
    fun openExactAlarmSettings() = alarmReliabilityChecker.openExactAlarmSettings()
    fun requestIgnoreBatteryOptimizations() = alarmReliabilityChecker.requestIgnoreBatteryOptimizations()

    fun hasDndAccess(): Boolean = focusDndController.hasAccess()

    fun onAutoDndDuringFocusChange(enabled: Boolean) {
        viewModelScope.launch { preferencesRepository.setAutoDndDuringFocus(enabled) }
    }

    fun openDndAccessSettings() {
        appContext.startActivity(
            Intent(android.provider.Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            },
        )
    }
}
