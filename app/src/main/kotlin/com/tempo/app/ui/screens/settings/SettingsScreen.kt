package com.tempo.app.ui.screens.settings

import android.Manifest
import android.content.Intent
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.CloudDownload
import androidx.compose.material.icons.filled.CloudUpload
import androidx.compose.material.icons.filled.FileDownload
import androidx.compose.material.icons.filled.FileUpload
import androidx.compose.material.icons.filled.MusicNote
import androidx.compose.material.icons.filled.NotificationsActive
import androidx.compose.material.icons.filled.Send
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material.icons.filled.SystemUpdate
import androidx.compose.material.icons.filled.VolumeUp
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TimePicker
import androidx.compose.material3.rememberTimePickerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import com.tempo.app.BuildConfig
import com.tempo.app.alarm.AlarmSoundPlayer
import com.tempo.app.alarm.BundledAlarmSounds
import com.tempo.app.data.preferences.UserPreferences
import com.tempo.app.data.update.UpdateChecker
import com.tempo.app.data.update.UpdateDownloadState
import com.tempo.app.domain.model.ThemeMode
import com.tempo.app.ui.components.restartApp
import com.tempo.app.ui.components.shareCsv
import com.tempo.app.ui.theme.TempoExtraShapes
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle

@Composable
fun SettingsScreen(modifier: Modifier = Modifier, viewModel: SettingsViewModel = hiltViewModel()) {
    val prefs by viewModel.preferences.collectAsState()
    val updateState by viewModel.updateCheckState.collectAsState()
    val context = LocalContext.current
    val uriHandler = LocalUriHandler.current
    val scope = rememberCoroutineScope()

    var nameField by remember(prefs.displayName) { mutableStateOf(prefs.displayName) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .statusBarsPadding()
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
            .padding(bottom = 96.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp),
    ) {
        Text(text = "Settings", style = MaterialTheme.typography.headlineSmall)

        SettingsSection(title = "Profile") {
            OutlinedTextField(
                value = nameField,
                onValueChange = {
                    nameField = it
                    viewModel.onDisplayNameChange(it)
                },
                label = { Text("Your name") },
                shape = TempoExtraShapes.card,
                modifier = Modifier.fillMaxWidth(),
            )
        }

        SettingsSection(title = "Appearance") {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    ThemeMode.entries.forEach { mode ->
                        FilterChip(
                            selected = prefs.themeMode == mode,
                            onClick = { viewModel.onThemeModeChange(mode) },
                            label = { Text(mode.label) },
                            shape = TempoExtraShapes.pill,
                        )
                    }
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Text("Dynamic color (Material You)", style = MaterialTheme.typography.bodyLarge)
                    Switch(checked = prefs.dynamicColorEnabled, onCheckedChange = viewModel::onDynamicColorChange)
                }
            }
        }

        SettingsSection(title = "Data") {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedButton(
                    onClick = {
                        scope.launch {
                            val csv = viewModel.exportCsv()
                            shareCsv(context, csv)
                        }
                    },
                    shape = TempoExtraShapes.pill,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Icon(Icons.Filled.FileDownload, contentDescription = null)
                    Text("  Export history as CSV")
                }
                HabitImportSection(viewModel = viewModel)
            }
        }

        SettingsSection(title = "Alarm reliability") {
            AlarmReliabilitySection(viewModel = viewModel)
        }

        SettingsSection(title = "Notifications") {
            NotificationTestSection(viewModel = viewModel)
        }

        SettingsSection(title = "Notification sound") {
            NotificationSoundSection(viewModel = viewModel, prefs = prefs)
        }

        SettingsSection(title = "Alarms") {
            AlarmSoundSection(viewModel = viewModel, prefs = prefs)
        }

        SettingsSection(title = "Focus mode") {
            FocusDndSection(viewModel = viewModel, prefs = prefs)
        }

        SettingsSection(title = "Backup") {
            BackupSection(viewModel = viewModel, prefs = prefs)
        }

        SettingsSection(title = "Updates") {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Button(
                    onClick = viewModel::checkForUpdate,
                    enabled = !updateState.isChecking,
                    shape = TempoExtraShapes.pill,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    if (updateState.isChecking) {
                        CircularProgressIndicator(modifier = Modifier.padding(end = 8.dp), color = MaterialTheme.colorScheme.onPrimary)
                    } else {
                        Icon(Icons.Filled.SystemUpdate, contentDescription = null)
                    }
                    Text("  Check for updates")
                }

                updateState.result?.let { result ->
                    Surface(shape = TempoExtraShapes.card, color = MaterialTheme.colorScheme.surfaceVariant) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                Icon(
                                    imageVector = if (result.upToDate) Icons.Filled.CheckCircle else Icons.Filled.Warning,
                                    contentDescription = null,
                                    tint = if (result.upToDate) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
                                )
                                Text(
                                    text = if (result.upToDate) "You're on the latest build" else "A newer build is available",
                                    style = MaterialTheme.typography.titleMedium,
                                )
                            }
                            Text(
                                text = "Installed: ${result.currentSha}" +
                                    (result.latestSha?.let { " · Latest: ${it.take(12)}" } ?: ""),
                                style = MaterialTheme.typography.bodySmall,
                            )
                            result.error?.let {
                                Text("Couldn't check: $it", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error)
                            }
                            if (!result.upToDate) {
                                InAppUpdateSection(viewModel = viewModel)
                                TextButton(onClick = { uriHandler.openUri(UpdateChecker.RELEASES_URL) }) {
                                    Text("Or view the release on GitHub")
                                }
                            }
                        }
                    }
                }
            }
        }

        SettingsSection(title = "About") {
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text("Tempo ${BuildConfig.VERSION_NAME}", style = MaterialTheme.typography.bodyLarge)
                Text("Build ${BuildConfig.GIT_SHA}", style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}

@Composable
private fun SettingsSection(title: String, content: @Composable () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(text = title, style = MaterialTheme.typography.titleMedium)
        content()
    }
}

@Composable
private fun InAppUpdateSection(viewModel: SettingsViewModel) {
    var permissionRefreshTick by remember { mutableStateOf(0) }
    val canInstall = remember(permissionRefreshTick) { viewModel.canInstallPackages() }
    val downloadState by viewModel.updateDownloadState.collectAsState()

    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        if (!canInstall) {
            Text(
                "Tempo needs permission to install updates it downloads itself — this opens a " +
                    "system settings screen, just for this app.",
                style = MaterialTheme.typography.bodySmall,
            )
            OutlinedButton(
                onClick = { viewModel.requestInstallPackagesPermission(); permissionRefreshTick++ },
                shape = TempoExtraShapes.pill,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Allow installing updates")
            }
        } else {
            when (val state = downloadState) {
                is UpdateDownloadState.Idle -> {
                    Button(
                        onClick = { viewModel.downloadUpdate() },
                        shape = TempoExtraShapes.pill,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Icon(Icons.Filled.FileDownload, contentDescription = null)
                        Text("  Download & install update")
                    }
                }
                is UpdateDownloadState.Downloading -> {
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        LinearProgressIndicator(
                            progress = { state.progressPercent / 100f },
                            modifier = Modifier.fillMaxWidth(),
                        )
                        Text("Downloading… ${state.progressPercent}%", style = MaterialTheme.typography.bodySmall)
                    }
                }
                is UpdateDownloadState.ReadyToInstall -> {
                    Button(
                        onClick = { viewModel.promptInstallUpdate() },
                        shape = TempoExtraShapes.pill,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("Install now")
                    }
                    Text(
                        "Android will ask you to confirm the install — that system prompt can't be skipped.",
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
                is UpdateDownloadState.Failed -> {
                    Text(
                        "Download failed: ${state.message}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.error,
                    )
                    OutlinedButton(
                        onClick = { viewModel.resetUpdateDownload() },
                        shape = TempoExtraShapes.pill,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("Try again")
                    }
                }
            }
        }
    }
}

@Composable
private fun AlarmReliabilitySection(viewModel: SettingsViewModel) {
    var refreshTick by remember { mutableStateOf(0) }
    val canScheduleExactAlarms = remember(refreshTick) { viewModel.canScheduleExactAlarms() }
    val ignoringBatteryOptimizations = remember(refreshTick) { viewModel.isIgnoringBatteryOptimizations() }

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(
            "If reminders or timer alarms don't fire when the app isn't open, the two settings " +
                "below are the most common fix — some phone makers kill background alarms unless " +
                "both are granted, even though Tempo schedules them the same way a system alarm clock does.",
            style = MaterialTheme.typography.bodySmall,
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("Alarms & reminders access", style = MaterialTheme.typography.bodyLarge)
            Icon(
                if (canScheduleExactAlarms) Icons.Filled.CheckCircle else Icons.Filled.Warning,
                contentDescription = null,
                tint = if (canScheduleExactAlarms) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
            )
        }
        if (!canScheduleExactAlarms) {
            OutlinedButton(
                onClick = { viewModel.openExactAlarmSettings(); refreshTick++ },
                shape = TempoExtraShapes.pill,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Grant alarms & reminders access")
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("Unrestricted battery usage", style = MaterialTheme.typography.bodyLarge)
            Icon(
                if (ignoringBatteryOptimizations) Icons.Filled.CheckCircle else Icons.Filled.Warning,
                contentDescription = null,
                tint = if (ignoringBatteryOptimizations) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
            )
        }
        if (!ignoringBatteryOptimizations) {
            OutlinedButton(
                onClick = { viewModel.requestIgnoreBatteryOptimizations(); refreshTick++ },
                shape = TempoExtraShapes.pill,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Allow unrestricted battery usage")
            }
            Text(
                "On some phones (Xiaomi, Oppo, Vivo, some Samsung models) you may also need to " +
                    "enable \"Autostart\" or set battery usage to \"No restrictions\" for Tempo in " +
                    "the phone's own battery/app management settings — this screen only covers the " +
                    "standard Android setting.",
                style = MaterialTheme.typography.bodySmall,
            )
        }
    }
}

@Composable
private fun NotificationTestSection(viewModel: SettingsViewModel) {
    val context = LocalContext.current
    val testState by viewModel.notificationTestState.collectAsState()
    var permissionRefreshTick by remember { mutableStateOf(0) }
    val notificationsEnabled = remember(permissionRefreshTick) { viewModel.areNotificationsEnabled() }

    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {
        permissionRefreshTick++
    }

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text(
                if (notificationsEnabled) "Notifications are enabled" else "Notifications are blocked",
                style = MaterialTheme.typography.bodyLarge,
            )
            Icon(
                Icons.Filled.NotificationsActive,
                contentDescription = null,
                tint = if (notificationsEnabled) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.error,
            )
        }

        if (!notificationsEnabled) {
            OutlinedButton(
                onClick = {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
                        ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) !=
                        android.content.pm.PackageManager.PERMISSION_GRANTED
                    ) {
                        permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
                    } else {
                        // Permission already denied once (or notifications disabled at the app
                        // level below API 33) — Android won't show the dialog again, so send the
                        // user straight to the system screen where they can flip it back on.
                        context.startActivity(
                            Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                                .putExtra(Settings.EXTRA_APP_PACKAGE, context.packageName),
                        )
                    }
                },
                shape = TempoExtraShapes.pill,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text("Enable notifications")
            }
        }

        OutlinedButton(
            onClick = { viewModel.sendTestNotificationNow() },
            shape = TempoExtraShapes.pill,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Icon(Icons.Filled.Send, contentDescription = null)
            Text("  Send test notification now")
        }
        testState.testNotificationMessage?.let {
            Text(it, style = MaterialTheme.typography.bodySmall)
        }

        OutlinedButton(
            onClick = { viewModel.scheduleTestAlarm() },
            shape = TempoExtraShapes.pill,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Test alarm in 10 seconds")
        }
        if (testState.testAlarmScheduled) {
            Text(
                "Scheduled — lock or leave the app now; a notification should appear in ~10s.",
                style = MaterialTheme.typography.bodySmall,
            )
        }
        testState.testAlarmScheduleError?.let {
            Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error)
        }

        OutlinedButton(
            onClick = { viewModel.refreshLastAlarmReceivedSummary() },
            shape = TempoExtraShapes.pill,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text("Check if the test alarm arrived")
        }
        testState.lastAlarmReceivedSummary?.let {
            Text(it, style = MaterialTheme.typography.bodySmall)
        }
    }
}

@Composable
private fun HabitImportSection(viewModel: SettingsViewModel) {
    val importState by viewModel.habitImportState.collectAsState()
    val importPicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) viewModel.importHabits(uri)
    }

    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        OutlinedButton(
            onClick = { importPicker.launch(arrayOf("*/*")) },
            enabled = !importState.isRunning,
            shape = TempoExtraShapes.pill,
            modifier = Modifier.fillMaxWidth(),
        ) {
            if (importState.isRunning) {
                CircularProgressIndicator(modifier = Modifier.padding(end = 8.dp))
            } else {
                Icon(Icons.Filled.FileUpload, contentDescription = null)
            }
            Text("  Import habits from CSV/JSON")
        }
        importState.resultMessage?.let {
            Text(it, style = MaterialTheme.typography.bodySmall)
        }
    }
}

@Composable
private fun FocusDndSection(viewModel: SettingsViewModel, prefs: UserPreferences) {
    var permissionRefreshTick by remember { mutableStateOf(0) }
    val hasAccess = remember(permissionRefreshTick) { viewModel.hasDndAccess() }

    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Text("Silence notifications during Pomodoro focus", style = MaterialTheme.typography.bodyLarge)
            Switch(
                checked = prefs.autoDndDuringFocus && hasAccess,
                onCheckedChange = { enabled ->
                    if (enabled && !hasAccess) {
                        viewModel.openDndAccessSettings()
                    } else {
                        viewModel.onAutoDndDuringFocusChange(enabled)
                    }
                    permissionRefreshTick++
                },
            )
        }
        if (!hasAccess) {
            Text(
                "Needs \"Do Not Disturb access\" — toggling this will open system settings to grant it.",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun NotificationSoundSection(viewModel: SettingsViewModel, prefs: UserPreferences) {
    val context = LocalContext.current

    val soundPicker = rememberLauncherForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val uri = result.data?.getParcelableExtra<Uri>(RingtoneManager.EXTRA_RINGTONE_PICKED_URI)
        val label = uri?.let { runCatching { RingtoneManager.getRingtone(context, it)?.getTitle(context) }.getOrNull() }
            ?: "Default notification sound"
        viewModel.onNotificationSoundSelected(uri, label)
    }

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(
            "Plays once when a habit or task reminder notification arrives.",
            style = MaterialTheme.typography.bodySmall,
        )

        Text("Tempo sounds", style = MaterialTheme.typography.titleSmall)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            BundledAlarmSounds.ALL.forEach { sound ->
                val uriString = BundledAlarmSounds.uriStringFor(context.packageName, sound.rawResourceName)
                FilterChip(
                    selected = prefs.notificationSoundUri == uriString,
                    onClick = { viewModel.onNotificationSoundSelected(Uri.parse(uriString), sound.label) },
                    label = { Text(sound.label) },
                    shape = TempoExtraShapes.pill,
                )
            }
        }

        Text("Or a system sound", style = MaterialTheme.typography.titleSmall)
        OutlinedButton(
            onClick = {
                val intent = Intent(RingtoneManager.ACTION_RINGTONE_PICKER).apply {
                    putExtra(RingtoneManager.EXTRA_RINGTONE_TYPE, RingtoneManager.TYPE_NOTIFICATION)
                    putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_DEFAULT, true)
                    putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_SILENT, false)
                    putExtra(
                        RingtoneManager.EXTRA_RINGTONE_EXISTING_URI,
                        prefs.notificationSoundUri?.let { Uri.parse(it) }
                            ?: RingtoneManager.getActualDefaultRingtoneUri(context, RingtoneManager.TYPE_NOTIFICATION),
                    )
                }
                soundPicker.launch(intent)
            },
            shape = TempoExtraShapes.pill,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Icon(Icons.Filled.MusicNote, contentDescription = null)
            Text("  ${prefs.notificationSoundLabel}")
        }

        Text(
            "Changing this the first time after an update may take a moment to take effect — " +
                "Android locks a notification's sound to the channel it was created with.",
            style = MaterialTheme.typography.bodySmall,
        )
    }
}

@Composable
private fun AlarmSoundSection(viewModel: SettingsViewModel, prefs: UserPreferences) {
    var isTestPlaying by remember { mutableStateOf(false) }
    val context = LocalContext.current

    val soundPicker = rememberLauncherForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        val uri = result.data?.getParcelableExtra<Uri>(RingtoneManager.EXTRA_RINGTONE_PICKED_URI)
        val label = uri?.let { runCatching { RingtoneManager.getRingtone(context, it)?.getTitle(context) }.getOrNull() }
            ?: "Default alarm sound"
        viewModel.onAlarmSoundSelected(uri, label)
    }

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(
            "The loud, looping sound for the Pomodoro/countdown timer alarm — pick something " +
                "insistent enough to notice from across a room.",
            style = MaterialTheme.typography.bodySmall,
        )

        OutlinedButton(
            onClick = {
                val intent = Intent(RingtoneManager.ACTION_RINGTONE_PICKER).apply {
                    putExtra(RingtoneManager.EXTRA_RINGTONE_TYPE, RingtoneManager.TYPE_ALARM)
                    putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_DEFAULT, true)
                    putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_SILENT, false)
                    putExtra(
                        RingtoneManager.EXTRA_RINGTONE_EXISTING_URI,
                        prefs.alarmSoundUri?.let { Uri.parse(it) }
                            ?: RingtoneManager.getActualDefaultRingtoneUri(context, RingtoneManager.TYPE_ALARM),
                    )
                }
                soundPicker.launch(intent)
            },
            shape = TempoExtraShapes.pill,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Icon(Icons.Filled.MusicNote, contentDescription = null)
            Text("  ${prefs.alarmSoundLabel}")
        }

        Button(
            onClick = {
                if (isTestPlaying) {
                    AlarmSoundPlayer.stop()
                    isTestPlaying = false
                } else {
                    AlarmSoundPlayer.start(context, prefs.alarmSoundUri)
                    isTestPlaying = true
                }
            },
            shape = TempoExtraShapes.pill,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Icon(if (isTestPlaying) Icons.Filled.Stop else Icons.Filled.VolumeUp, contentDescription = null)
            Text(if (isTestPlaying) "  Stop test" else "  Test alarm sound")
        }
    }
}

@Composable
private fun BackupSection(viewModel: SettingsViewModel, prefs: UserPreferences) {
    val backupState by viewModel.backupState.collectAsState()
    val restoreState by viewModel.restoreState.collectAsState()
    var showTimePicker by remember { mutableStateOf(false) }
    var pendingRestoreUri by remember { mutableStateOf<android.net.Uri?>(null) }
    val timeFormatter = remember { DateTimeFormatter.ofLocalizedTime(FormatStyle.SHORT) }
    val context = LocalContext.current

    val folderPicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocumentTree()) { uri ->
        if (uri != null) {
            context.contentResolver.takePersistableUriPermission(
                uri,
                Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_GRANT_WRITE_URI_PERMISSION,
            )
            viewModel.onBackupFolderSelected(uri)
        }
    }

    val restoreFilePicker = rememberLauncherForActivityResult(ActivityResultContracts.OpenDocument()) { uri ->
        if (uri != null) pendingRestoreUri = uri
    }

    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text(
            "Back up to a local folder or a Google Drive folder — Drive shows up as a normal " +
                "destination in the picker below, no sign-in setup needed here.",
            style = MaterialTheme.typography.bodySmall,
        )
        OutlinedButton(
            onClick = { folderPicker.launch(null) },
            shape = TempoExtraShapes.pill,
            modifier = Modifier.fillMaxWidth(),
        ) {
            Text(if (prefs.backupFolderUri != null) "Change backup folder" else "Choose backup folder")
        }

        if (prefs.backupFolderUri != null) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text("Daily automatic backup", style = MaterialTheme.typography.bodyLarge)
                Switch(checked = prefs.backupDailyEnabled, onCheckedChange = viewModel::onBackupDailyEnabledChange)
            }

            if (prefs.backupDailyEnabled) {
                OutlinedButton(onClick = { showTimePicker = true }, shape = TempoExtraShapes.pill) {
                    val time = java.time.LocalTime.of(prefs.backupHour, prefs.backupMinute)
                    Text("Backup time: ${time.format(timeFormatter)}")
                }
            }

            Button(
                onClick = viewModel::backupNow,
                enabled = !backupState.isRunning,
                shape = TempoExtraShapes.pill,
                modifier = Modifier.fillMaxWidth(),
            ) {
                if (backupState.isRunning) {
                    CircularProgressIndicator(modifier = Modifier.padding(end = 8.dp), color = MaterialTheme.colorScheme.onPrimary)
                } else {
                    Icon(Icons.Filled.CloudUpload, contentDescription = null)
                }
                Text("  Back up now")
            }

            prefs.lastBackupAtMillis?.let { millis ->
                val lastBackup = Instant.ofEpochMilli(millis).atZone(ZoneId.systemDefault())
                Text(
                    "Last backup: ${lastBackup.toLocalDate()} ${lastBackup.toLocalTime().format(timeFormatter)}",
                    style = MaterialTheme.typography.bodySmall,
                )
            }
            backupState.lastResultMessage?.let {
                Text(it, style = MaterialTheme.typography.bodySmall)
            }
        }

        OutlinedButton(
            onClick = { restoreFilePicker.launch(arrayOf("*/*")) },
            enabled = !restoreState.isRunning,
            shape = TempoExtraShapes.pill,
            modifier = Modifier.fillMaxWidth(),
        ) {
            if (restoreState.isRunning) {
                CircularProgressIndicator(modifier = Modifier.padding(end = 8.dp))
            } else {
                Icon(Icons.Filled.CloudDownload, contentDescription = null)
            }
            Text("  Restore from backup file")
        }
        restoreState.errorMessage?.let {
            Text(it, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.error)
        }
    }

    pendingRestoreUri?.let { uri ->
        RestoreConfirmDialog(
            onDismiss = { pendingRestoreUri = null },
            onConfirm = {
                pendingRestoreUri = null
                viewModel.restoreFrom(uri)
            },
        )
    }

    if (restoreState.restoredSuccessfully) {
        RestoreCompleteDialog(onRestart = { restartApp(context) })
    }

    if (showTimePicker) {
        BackupTimePickerDialog(
            initialHour = prefs.backupHour,
            initialMinute = prefs.backupMinute,
            onDismiss = { showTimePicker = false },
            onConfirm = { hour, minute ->
                viewModel.onBackupTimeChange(hour, minute)
                showTimePicker = false
            },
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun BackupTimePickerDialog(
    initialHour: Int,
    initialMinute: Int,
    onDismiss: () -> Unit,
    onConfirm: (Int, Int) -> Unit,
) {
    val state = rememberTimePickerState(initialHour = initialHour, initialMinute = initialMinute, is24Hour = false)
    Dialog(onDismissRequest = onDismiss) {
        Surface(shape = TempoExtraShapes.card, color = MaterialTheme.colorScheme.surface) {
            Column(
                modifier = Modifier.padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(16.dp),
            ) {
                TimePicker(state = state)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    TextButton(onClick = onDismiss) { Text("Cancel") }
                    Button(onClick = { onConfirm(state.hour, state.minute) }, shape = TempoExtraShapes.pill) { Text("Set") }
                }
            }
        }
    }
}

@Composable
private fun RestoreConfirmDialog(onDismiss: () -> Unit, onConfirm: () -> Unit) {
    Dialog(onDismissRequest = onDismiss) {
        Surface(shape = TempoExtraShapes.card, color = MaterialTheme.colorScheme.surface) {
            Column(modifier = Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Text("Restore from backup?", style = MaterialTheme.typography.titleMedium)
                Text(
                    "This replaces every habit, task, routine, mood entry, and goal currently in " +
                        "Tempo with what's in the backup file. This can't be undone.",
                    style = MaterialTheme.typography.bodyMedium,
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    TextButton(onClick = onDismiss) { Text("Cancel") }
                    Button(onClick = onConfirm, shape = TempoExtraShapes.pill) { Text("Restore") }
                }
            }
        }
    }
}

@Composable
private fun RestoreCompleteDialog(onRestart: () -> Unit) {
    Dialog(onDismissRequest = {}) {
        Surface(shape = TempoExtraShapes.card, color = MaterialTheme.colorScheme.surface) {
            Column(modifier = Modifier.padding(24.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                Text("Backup restored", style = MaterialTheme.typography.titleMedium)
                Text(
                    "Tempo needs to restart to load the restored data.",
                    style = MaterialTheme.typography.bodyMedium,
                )
                Button(onClick = onRestart, shape = TempoExtraShapes.pill, modifier = Modifier.fillMaxWidth()) {
                    Text("Restart now")
                }
            }
        }
    }
}
