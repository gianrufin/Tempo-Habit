import React, { useState } from 'react';
import { UserPreferences, AppReleaseInfo } from '../../types';
import { playSound, playCelebrationSound } from '../../audio/soundPlayer';
import { StorageService } from '../../data/storage';
import { UpdaterService, CheckUpdateResult, CURRENT_APP_VERSION, DEFAULT_GITHUB_REPO } from '../../domain/updaterService';
import {
  X,
  Volume2,
  Play,
  Download,
  Upload,
  Trash2,
  Check,
  Sparkles,
  User,
  Sliders,
  RefreshCw,
  DownloadCloud,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  GitBranch,
  ArrowRight,
  ShieldCheck,
  FileCode,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userPrefs: UserPreferences;
  onSavePreferences: (prefs: UserPreferences) => void;
  onDataImported: () => void;
  onOpenReadme?: () => void;
}

const SOUND_OPTIONS: UserPreferences['soundChoice'][] = [
  'Golden Hour',
  'Aura Ping',
  'Crystal Fizz',
  'Velvet Pop',
  'Cloud Drift',
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  userPrefs,
  onSavePreferences,
  onDataImported,
  onOpenReadme,
}) => {
  if (!isOpen) return null;

  const [displayName, setDisplayName] = useState(userPrefs.displayName || '');
  const [soundChoice, setSoundChoice] = useState<UserPreferences['soundChoice']>(
    userPrefs.soundChoice || 'Golden Hour'
  );
  const [soundEnabled, setSoundEnabled] = useState(userPrefs.soundEnabled ?? true);
  const [focusDuration, setFocusDuration] = useState(userPrefs.focusDurationMinutes || 25);
  const [shortBreak, setShortBreak] = useState(userPrefs.shortBreakMinutes || 5);
  const [longBreak, setLongBreak] = useState(userPrefs.longBreakMinutes || 15);
  const [pomodorosUntilLong, setPomodorosUntilLong] = useState(userPrefs.pomodorosUntilLongBreak || 4);
  const [autoStartBreaks, setAutoStartBreaks] = useState(userPrefs.autoStartBreaks ?? true);
  const [theme, setTheme] = useState(userPrefs.theme || 'amoled');
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // App Updates state
  const [currentAppVersion, setCurrentAppVersion] = useState<string>(
    userPrefs.appVersion || CURRENT_APP_VERSION
  );
  const [githubRepo, setGithubRepo] = useState<string>(
    userPrefs.githubRepo || DEFAULT_GITHUB_REPO
  );
  const [autoCheckUpdates, setAutoCheckUpdates] = useState<boolean>(
    userPrefs.autoCheckUpdates ?? true
  );
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckUpdateResult | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    percent: number;
    downloadedMb: number;
    totalMb: number;
    speed: string;
  }>({
    percent: 0,
    downloadedMb: 0,
    totalMb: 15.0,
    speed: '0.0 MB/s',
  });
  const [installSuccessMessage, setInstallSuccessMessage] = useState<string | null>(null);
  const [showRepoConfig, setShowRepoConfig] = useState(false);

  const handleTestSound = (snd: UserPreferences['soundChoice']) => {
    playSound(snd, 0.7);
  };

  const handleSave = () => {
    const updated: UserPreferences = {
      displayName: displayName.trim() || 'Friend',
      soundChoice,
      soundEnabled,
      vibrationEnabled: userPrefs.vibrationEnabled ?? true,
      focusDurationMinutes: Number(focusDuration) || 25,
      shortBreakMinutes: Number(shortBreak) || 5,
      longBreakMinutes: Number(longBreak) || 15,
      pomodorosUntilLongBreak: Number(pomodorosUntilLong) || 4,
      autoStartBreaks,
      theme,
      appVersion: currentAppVersion,
      githubRepo: githubRepo.trim() || DEFAULT_GITHUB_REPO,
      autoCheckUpdates,
      lastUpdateCheckedAt: new Date().toISOString(),
    };
    onSavePreferences(updated);
    onClose();
  };

  const handleCheckForUpdates = async () => {
    setIsCheckingUpdate(true);
    setUpdateError(null);
    setCheckResult(null);
    setInstallSuccessMessage(null);

    try {
      const result = await UpdaterService.checkGitHubRelease(currentAppVersion, githubRepo);
      setCheckResult(result);
      if (!result.hasUpdate) {
        setInstallSuccessMessage(`You're up to date! Tempo is running the latest build (v${currentAppVersion}).`);
      }
    } catch (err: any) {
      setUpdateError(err?.message || 'Unable to connect to GitHub releases.');
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  const handleDownloadAndInstall = async (releaseToInstall?: AppReleaseInfo) => {
    const targetRelease = releaseToInstall || checkResult?.release;
    if (!targetRelease) return;

    setIsDownloading(true);
    setInstallSuccessMessage(null);
    setUpdateError(null);

    try {
      const res = await UpdaterService.downloadAndInstallUpdate(
        targetRelease,
        (percent, downloadedMb, totalMb, speed) => {
          setDownloadProgress({ percent, downloadedMb, totalMb, speed });
        }
      );

      if (res.success) {
        setCurrentAppVersion(res.newVersion);
        setInstallSuccessMessage(`Updated to v${res.newVersion}! Successfully installed in-app.`);
        playCelebrationSound();
        setCheckResult(null);

        // Persist updated version in storage
        const updatedPrefs: UserPreferences = {
          ...userPrefs,
          appVersion: res.newVersion,
          lastUpdateCheckedAt: new Date().toISOString(),
        };
        onSavePreferences(updatedPrefs);
      }
    } catch (err: any) {
      setUpdateError(err?.message || 'Error occurred while installing update package.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleExportJson = () => {
    const jsonStr = StorageService.exportFullBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tempo_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const csvStr = StorageService.exportHabitsCsv();
    const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tempo_habits_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const text = event.target?.result as string;
        const success = StorageService.importFullBackupJson(text);
        if (success) {
          setImportStatus('Backup restored successfully!');
          setTimeout(() => {
            onDataImported();
            onClose();
          }, 1000);
        } else {
          setImportStatus('Failed to parse backup JSON.');
        }
      } catch {
        setImportStatus('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all habits, tasks, and data to default demo state?')) {
      StorageService.resetToDefaults();
      onDataImported();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-xl max-h-[90vh] bg-[#140e24] border border-purple-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 bg-[#18112b]">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">App Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-sm text-zinc-200">
          {/* User Profile */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-purple-400" />
              Your Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="e.g. Alex, Pioneer..."
              className="w-full px-4 py-2.5 bg-[#1a1230] border border-purple-500/20 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400"
            />
          </div>

          {/* GitHub Android App Updates Section */}
          <div className="space-y-3 p-4 bg-[#18112d] border border-purple-500/30 rounded-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-purple-900/60 border border-purple-400/30 text-amber-300">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    Android & GitHub Updates
                    <span className="text-[10px] font-mono font-normal text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-500/30">
                      v{currentAppVersion}
                    </span>
                  </h3>
                  <p className="text-[11px] text-zinc-400">OTA direct package download & in-app installation</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowRepoConfig(!showRepoConfig)}
                className="text-[11px] text-purple-300 hover:text-purple-200 flex items-center gap-1 font-medium underline transition-colors"
              >
                <GitBranch className="w-3 h-3" />
                {showRepoConfig ? 'Hide Repo' : 'GitHub Repo'}
              </button>
            </div>

            {/* Custom GitHub Repository Config */}
            {showRepoConfig && (
              <div className="pt-2 border-t border-white/5 space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-400">GitHub Repository (owner/repo)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={githubRepo}
                    onChange={e => setGithubRepo(e.target.value)}
                    placeholder="gianrufin/Tempo-Habit"
                    className="flex-1 px-3 py-1.5 bg-[#120b22] border border-purple-500/20 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-purple-400"
                  />
                </div>
              </div>
            )}

            {/* Primary Action Button: Check for Updates */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                id="btn-check-updates"
                disabled={isCheckingUpdate || isDownloading}
                onClick={handleCheckForUpdates}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-purple-950/50 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdate ? 'animate-spin' : ''}`} />
                <span>{isCheckingUpdate ? 'Checking GitHub Releases...' : 'Check for Updates'}</span>
              </button>
            </div>

            {/* In-App Download Progress Display */}
            {isDownloading && (
              <div className="p-3.5 bg-[#120b22] border border-amber-500/30 rounded-xl space-y-2 animate-fade-in">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <DownloadCloud className="w-4 h-4 animate-bounce" />
                    Downloading Update Package in App...
                  </span>
                  <span className="font-mono text-white font-bold">{downloadProgress.percent}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/10 p-[1px]">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 via-amber-400 to-emerald-400 rounded-full transition-all duration-200"
                    style={{ width: `${downloadProgress.percent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
                  <span>
                    {downloadProgress.downloadedMb} MB / {downloadProgress.totalMb} MB
                  </span>
                  <span className="text-amber-400/90">{downloadProgress.speed}</span>
                  <span className="text-emerald-400 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Verifying SHA-256
                  </span>
                </div>
              </div>
            )}

            {/* Update Found Card */}
            {checkResult?.hasUpdate && checkResult.release && !isDownloading && (
              <div className="p-3.5 bg-purple-950/40 border border-amber-400/40 rounded-xl space-y-2.5 animate-fade-in">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/30">
                      New Release Available
                    </span>
                    <h4 className="text-sm font-bold text-white mt-1">{checkResult.release.name}</h4>
                    <p className="text-[11px] text-zinc-400">
                      Tag: <code className="text-amber-300 font-mono">{checkResult.release.tagName}</code> • Size: ~{checkResult.release.apkSizeMb} MB
                    </p>
                  </div>
                </div>

                {/* Release Body / Changelog */}
                <div className="p-2.5 bg-black/40 rounded-lg text-xs text-zinc-300 space-y-1 font-sans border border-white/5 max-h-28 overflow-y-auto">
                  <p className="text-[11px] font-semibold text-zinc-400">Release Notes:</p>
                  <pre className="text-[11px] whitespace-pre-wrap font-sans text-zinc-300 leading-relaxed">
                    {checkResult.release.body}
                  </pre>
                </div>

                {/* Direct In-App Install Button */}
                <button
                  type="button"
                  id="btn-install-update"
                  onClick={() => handleDownloadAndInstall()}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Download & Install v{checkResult.release.version} In-App</span>
                </button>
              </div>
            )}

            {/* Success Notification */}
            {installSuccessMessage && (
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{installSuccessMessage}</span>
              </div>
            )}

            {/* Error Message */}
            {updateError && (
              <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{updateError}</span>
              </div>
            )}

            {/* Readme & APK Direct Download Link */}
            {onOpenReadme && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenReadme();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-purple-950/50 hover:bg-purple-900/60 border border-purple-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>View Project README & Direct APK Download</span>
                </button>
              </div>
            )}
          </div>

          {/* Sound & Tone Synthesizer Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                Celebration & Timer Sound
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-400">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={e => setSoundEnabled(e.target.checked)}
                  className="rounded border-zinc-700 text-purple-600 focus:ring-purple-500"
                />
                Enable Audio
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SOUND_OPTIONS.map(snd => (
                <div
                  key={snd}
                  onClick={() => setSoundChoice(snd)}
                  className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                    soundChoice === snd
                      ? 'bg-purple-950/60 border-amber-400 text-amber-300 shadow-md shadow-purple-950/50'
                      : 'bg-[#18112b] border-white/5 text-zinc-300 hover:border-purple-500/30'
                  }`}
                >
                  <span className="text-xs font-semibold">{snd}</span>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      handleTestSound(snd);
                    }}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-amber-400"
                    title="Play Preview"
                  >
                    <Play className="w-3 h-3 fill-current" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Focus Timer Presets */}
          <div className="space-y-3 pt-2 border-t border-white/5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Focus Chamber Durations (Minutes)
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <span className="text-[11px] text-zinc-400">Focus Sprint</span>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={focusDuration}
                  onChange={e => setFocusDuration(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-[#1a1230] border border-purple-500/20 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <span className="text-[11px] text-zinc-400">Short Break</span>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={shortBreak}
                  onChange={e => setShortBreak(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-[#1a1230] border border-purple-500/20 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-purple-400"
                />
              </div>

              <div>
                <span className="text-[11px] text-zinc-400">Long Break</span>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={longBreak}
                  onChange={e => setLongBreak(Number(e.target.value))}
                  className="w-full mt-1 px-3 py-2 bg-[#1a1230] border border-purple-500/20 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-purple-400"
                />
              </div>
            </div>
          </div>

          {/* Data Backup & Migration */}
          <div className="space-y-3 pt-3 border-t border-white/5">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Data Portability & Backups
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExportJson}
                className="p-3 rounded-2xl bg-[#18112b] hover:bg-[#231840] border border-purple-500/20 text-xs font-semibold text-zinc-200 flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4 text-amber-400" />
                Export Full Backup (JSON)
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="p-3 rounded-2xl bg-[#18112b] hover:bg-[#231840] border border-purple-500/20 text-xs font-semibold text-zinc-200 flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4 text-purple-400" />
                Export Habits (CSV)
              </button>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex-1 p-3 rounded-2xl bg-[#18112b] hover:bg-[#231840] border border-purple-500/20 text-xs font-semibold text-zinc-200 flex items-center justify-center gap-2 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Restore from JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {importStatus && (
              <p className="text-xs text-amber-300 text-center font-medium">{importStatus}</p>
            )}
          </div>

          {/* Factory Reset */}
          <div className="pt-3 border-t border-white/5">
            <button
              type="button"
              onClick={handleReset}
              className="w-full p-3 rounded-2xl bg-rose-950/30 hover:bg-rose-950/60 border border-rose-500/30 text-xs font-bold text-rose-300 flex items-center justify-center gap-2 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Reset All Data to Demo Defaults
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-[#18112b] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white text-xs font-bold shadow-lg shadow-purple-900/30"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

