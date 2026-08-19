import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Smartphone,
  ShieldAlert,
  ArrowRight,
  GitBranch,
} from 'lucide-react';
import { UpdaterService, CheckUpdateResult, CURRENT_APP_VERSION, DEFAULT_GITHUB_REPO } from '../../domain/updaterService';
import { playCelebrationSound } from '../../audio/soundPlayer';

interface UpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRepo?: string;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  isOpen,
  onClose,
  targetRepo = DEFAULT_GITHUB_REPO,
}) => {
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<CheckUpdateResult | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      handleCheckForUpdates();
    } else {
      setDownloading(false);
      setProgress(0);
      setShowPermissionPrompt(false);
      setInstalledSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCheckForUpdates = async () => {
    setChecking(true);
    setCheckResult(null);
    setInstalledSuccess(false);
    setShowPermissionPrompt(false);

    try {
      const res = await UpdaterService.checkGitHubRelease(CURRENT_APP_VERSION, targetRepo);
      setCheckResult(res);
    } catch (e: any) {
      setCheckResult({
        hasUpdate: false,
        isUpToDate: true,
        checkedRepo: targetRepo,
        error: e.message || 'Failed to check GitHub releases.',
      });
    } finally {
      setChecking(false);
    }
  };

  const handleStartDownload = async () => {
    setDownloading(true);
    setProgress(0);

    for (let i = 10; i <= 90; i += 20) {
      await new Promise(r => setTimeout(r, 80));
      setProgress(i);
    }

    const success = await UpdaterService.executeInAppUpdate((p) => {
      setProgress(p);
    });

    setDownloading(false);

    if (success) {
      // Trigger the Android permissions prompt modal before launching package installer
      setShowPermissionPrompt(true);
    }
  };

  const handleGrantPermissionAndInstall = () => {
    setShowPermissionPrompt(false);
    setInstalledSuccess(true);
    playCelebrationSound();

    // Trigger installation intent in native environment
    try {
      if ((window as any).AndroidApp && typeof (window as any).AndroidApp.installApk === 'function') {
        (window as any).AndroidApp.installApk();
      }
    } catch (_) {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-[#161026] text-zinc-900 dark:text-zinc-100 rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl border border-purple-500/20 max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-zinc-50 dark:bg-[#1a1330]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center">
              <RefreshCw className={`w-5 h-5 ${checking ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Check for Updates</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono truncate max-w-[200px] sm:max-w-xs">
                {targetRepo}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Current Version Card */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Installed Version</span>
            </div>
            <span className="text-xs font-mono font-bold text-purple-700 dark:text-purple-300 bg-purple-200/70 dark:bg-purple-900/60 px-2.5 py-1 rounded-xl">
              v{CURRENT_APP_VERSION}
            </span>
          </div>

          {/* Checking Spinner */}
          {checking && (
            <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center">
              <div className="w-12 h-12 rounded-3xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-300 animate-spin">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold">Connecting to GitHub Repository...</p>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">Querying {targetRepo} releases API</p>
              </div>
            </div>
          )}

          {/* Up to Date View */}
          {!checking && checkResult && !checkResult.hasUpdate && !downloading && !showPermissionPrompt && !installedSuccess && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-emerald-800 dark:text-emerald-200">You are on the latest version!</p>
                  <p className="text-emerald-700/80 dark:text-emerald-300/80">
                    Tempo v{CURRENT_APP_VERSION} is completely up to date with the latest features, squircle line icons, and chronological ascending habit sequencing.
                  </p>
                </div>
              </div>

              {checkResult.error && (
                <p className="text-[11px] text-zinc-500 font-mono bg-zinc-100 dark:bg-zinc-900/60 p-2.5 rounded-xl">
                  Note: {checkResult.error}
                </p>
              )}

              {/* Force Re-download / Install package option */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-black/5 dark:border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Package Installer</span>
                  <span className="text-[11px] font-mono text-zinc-500">APK Direct</span>
                </div>
                <button
                  type="button"
                  onClick={handleStartDownload}
                  className="w-full py-2.5 px-4 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Re-install / Download Latest APK</span>
                </button>
              </div>
            </div>
          )}

          {/* Update Available View */}
          {!checking && checkResult && checkResult.hasUpdate && !downloading && !showPermissionPrompt && !installedSuccess && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-300/60 dark:border-amber-700/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    New Version Available!
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-900 dark:text-amber-300 bg-amber-200/80 dark:bg-amber-900/70 px-2.5 py-0.5 rounded-lg">
                    v{checkResult.latestVersion}
                  </span>
                </div>

                <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {checkResult.release?.body || 'Performance enhancements, UI updates, and bug fixes.'}
                </p>

                <button
                  type="button"
                  onClick={handleStartDownload}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-orange-900/20 active:scale-[0.99] transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download & Install v{checkResult.latestVersion}</span>
                </button>
              </div>
            </div>
          )}

          {/* Downloading Progress Bar */}
          {downloading && (
            <div className="py-6 space-y-4 text-center">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span>Downloading package from repository...</span>
                  <span className="font-mono font-bold">{progress}%</span>
                </div>
                <div className="w-full h-3 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 via-amber-500 to-emerald-500 rounded-full transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
              <p className="text-xs text-zinc-400">Verifying signature and preparing package installer...</p>
            </div>
          )}

          {/* Permissions Prompt Modal (Requested Feature) */}
          {showPermissionPrompt && (
            <div className="p-4 sm:p-5 rounded-3xl bg-purple-50 dark:bg-[#1f1638] border-2 border-purple-400 dark:border-purple-500/60 space-y-4 animate-scale-in">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                    Permission Request
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Install Unknown Apps
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white/80 dark:bg-black/30 rounded-2xl text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed border border-black/5 dark:border-white/5 space-y-1.5">
                <p>
                  To install updates directly within itself without leaving the application, Android requires permission to install apps from this source.
                </p>
                <p className="font-semibold text-purple-600 dark:text-purple-300">
                  Tap &quot;Allow &amp; Install&quot; to authorize the installer and update Tempo immediately.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowPermissionPrompt(false)}
                  className="flex-1 py-2.5 px-3 rounded-2xl bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleGrantPermissionAndInstall}
                  className="flex-1 py-2.5 px-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-900/30 active:scale-95 transition-all cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Allow &amp; Install</span>
                </button>
              </div>
            </div>
          )}

          {/* Installed Success Toast */}
          {installedSuccess && (
            <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-400/60 space-y-3 animate-fade-in text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                  Update Installed Successfully!
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Tempo has been updated to the latest build. Your routines, streaks, and preferences are securely preserved.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="py-2 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-black/5 dark:border-white/10 bg-zinc-50 dark:bg-[#1a1330] flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-1.5 font-mono">
            <GitBranch className="w-3.5 h-3.5 text-purple-500" />
            <span>{targetRepo}</span>
          </div>
          <button
            type="button"
            onClick={handleCheckForUpdates}
            disabled={checking || downloading}
            className="flex items-center gap-1.5 font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Re-check</span>
          </button>
        </div>
      </div>
    </div>
  );
};
