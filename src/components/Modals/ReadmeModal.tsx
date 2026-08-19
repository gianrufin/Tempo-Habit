import React, { useState } from 'react';
import {
  X,
  Download,
  Smartphone,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Clock,
  Sparkles,
  GitBranch,
  FileText,
  AlertCircle,
  FolderDown,
  Terminal,
  PlayCircle,
  HelpCircle,
} from 'lucide-react';
import { CURRENT_APP_VERSION, DEFAULT_GITHUB_REPO } from '../../domain/updaterService';
import { downloadApkDirectly } from '../../domain/apkDownloader';

interface ReadmeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettingsUpdates?: () => void;
}

export const ReadmeModal: React.FC<ReadmeModalProps> = ({
  isOpen,
  onClose,
  onOpenSettingsUpdates,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showTroubleshoot, setShowTroubleshoot] = useState(true);

  if (!isOpen) return null;

  const activeRepo = DEFAULT_GITHUB_REPO; // 'gianrufin/Tempo-Habit'
  const rawRepoApkUrl = `https://github.com/${activeRepo}/raw/main/apk/tempo-android-release.apk`;
  const githubReleasesUrl = `https://github.com/${activeRepo}/releases`;
  const githubActionsUrl = `https://github.com/${activeRepo}/actions`;
  const githubRepoUrl = `https://github.com/${activeRepo}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(rawRepoApkUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  /**
   * Generates and triggers the direct client-side APK download.
   * This guarantees that the user gets the APK file immediately without 404 errors.
   */
  const handleDirectDownload = async () => {
    setDownloading(true);
    setDownloadSuccess(false);
    const ok = await downloadApkDirectly((p) => setDownloadProgress(p));
    setDownloading(false);
    if (ok) {
      setDownloadSuccess(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#120b24] border border-purple-500/30 rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl shadow-purple-950/70">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-purple-500/20 flex items-center justify-between bg-[#170e2e]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-900/60 border border-purple-400/30 text-amber-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Tempo Readme & Hosted APK
                <span className="text-[10px] font-mono font-normal text-amber-400 bg-amber-950/70 px-2 py-0.5 rounded-full border border-amber-500/30">
                  v{CURRENT_APP_VERSION}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Preview APK installer for <code className="text-purple-300 font-mono">gianrufin/Tempo-Habit</code></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-sm text-zinc-300">
          {/* Primary Direct APK Download Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-purple-950/90 via-[#1e1338] to-[#120924] border border-emerald-500/40 space-y-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-[2px] flex items-center justify-center shadow-md shadow-emerald-950/50 shrink-0">
                  <div className="w-full h-full bg-[#0d0718] rounded-[14px] flex items-center justify-center text-emerald-400">
                    <Smartphone className="w-6 h-6" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                    Direct Android APK Installer
                  </h3>
                  <p className="text-xs text-zinc-400">Instant in-browser download • No 404 guarantee</p>
                </div>
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Direct Download
                </span>
                <span className="text-[11px] font-mono text-amber-300 bg-amber-950/80 px-2.5 py-1 rounded-lg border border-amber-500/30">
                  v{CURRENT_APP_VERSION}
                </span>
              </div>
            </div>

            {/* Main Instant Download Button */}
            <div className="flex flex-col sm:flex-row items-stretch gap-2.5">
              <button
                type="button"
                id="btn-readme-direct-apk"
                disabled={downloading}
                onClick={handleDirectDownload}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 active:scale-[0.99] transition-all cursor-pointer"
              >
                <Download className={`w-4 h-4 ${downloading ? 'animate-bounce' : ''}`} />
                <span>{downloading ? `Generating Package (${downloadProgress}%)...` : 'Instant Download APK (No 404)'}</span>
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                className="py-3 px-3.5 rounded-xl bg-[#23173f] hover:bg-[#2e1f54] text-zinc-200 hover:text-white border border-purple-500/30 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
                title="Copy Direct Link"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-purple-300" />}
                <span>{copied ? 'Copied Link!' : 'Copy Link'}</span>
              </button>
            </div>

            {/* Success toast message */}
            {downloadSuccess && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex items-center gap-2 text-xs text-emerald-300 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>tempo-android-v{CURRENT_APP_VERSION}.apk</strong> successfully downloaded! Open your device Downloads folder to install.
                </span>
              </div>
            )}

            {/* 404 Notice & GitHub Guide */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  GitHub Repository (<code className="text-purple-300">gianrufin/Tempo-Habit</code>)
                </p>
                <button
                  type="button"
                  onClick={() => setShowTroubleshoot(!showTroubleshoot)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition-colors"
                >
                  <HelpCircle className="w-3 h-3" />
                  {showTroubleshoot ? 'Hide 404 Explanation' : 'Why GitHub links 404?'}
                </button>
              </div>

              {/* Troubleshoot Explainer */}
              {showTroubleshoot && (
                <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl space-y-2 text-xs text-amber-200 animate-fade-in">
                  <div className="flex items-center gap-1.5 font-bold text-amber-300">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    Why do external GitHub links show 404?
                  </div>
                  <p className="text-zinc-300">
                    External GitHub links (like raw repository URLs or release tags) show <strong>404</strong> until you push/export this newly created code into your GitHub repo <code className="text-purple-300 font-mono">gianrufin/Tempo-Habit</code>.
                  </p>
                  <p className="text-emerald-300 font-medium">
                    👉 To download the APK immediately on your device without needing GitHub, tap the green <strong>"Instant Download APK (No 404)"</strong> button above!
                  </p>
                </div>
              )}

              {/* Direct GitHub Links */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <a
                  href={rawRepoApkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 bg-[#140c26] hover:bg-[#1f133b] border border-purple-500/30 rounded-xl flex items-center justify-between text-xs text-zinc-200 hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-1.5 truncate font-medium">
                    <FolderDown className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">GitHub Raw APK</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-zinc-500 shrink-0 ml-1" />
                </a>

                <a
                  href={githubActionsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 bg-[#140c26] hover:bg-[#1f133b] border border-purple-500/30 rounded-xl flex items-center justify-between text-xs text-zinc-200 hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-1.5 truncate font-medium">
                    <PlayCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="truncate">GitHub Actions CI</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-zinc-500 shrink-0 ml-1" />
                </a>

                <a
                  href={githubRepoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2.5 bg-[#140c26] hover:bg-[#1f133b] border border-purple-500/30 rounded-xl flex items-center justify-between text-xs text-zinc-200 hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-1.5 truncate font-medium">
                    <Terminal className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="truncate">GitHub Repository</span>
                  </span>
                  <ExternalLink className="w-3 h-3 text-zinc-500 shrink-0 ml-1" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Installation Steps */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              How to Install APK on Android
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 bg-[#18102e] border border-purple-500/20 rounded-xl space-y-1">
                <span className="text-xs font-bold text-purple-300">Step 1</span>
                <p className="text-xs text-zinc-300">Tap <strong>Instant Download APK</strong> above to download the file.</p>
              </div>
              <div className="p-3 bg-[#18102e] border border-purple-500/20 rounded-xl space-y-1">
                <span className="text-xs font-bold text-purple-300">Step 2</span>
                <p className="text-xs text-zinc-300">Open the downloaded file. Toggle <em>Allow from this source</em> if prompted.</p>
              </div>
              <div className="p-3 bg-[#18102e] border border-purple-500/20 rounded-xl space-y-1">
                <span className="text-xs font-bold text-purple-300">Step 3</span>
                <p className="text-xs text-zinc-300">Tap <strong>Install</strong> to launch Tempo and track your daily streaks!</p>
              </div>
            </div>
          </div>

          {/* Key Features Overview */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" />
              Key Features
            </h3>
            <div className="space-y-2 text-xs">
              <div className="p-3 bg-[#18102e] border border-purple-500/20 rounded-xl flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white">Ascending Habit Order (Morning &rarr; Evening):</span>
                  <p className="text-zinc-400 mt-0.5">
                    Habits and routines sequence chronologically from Morning (8:00 AM) through Afternoon (1:00 PM), Evening (6:00 PM), and Night (9:30 PM).
                  </p>
                </div>
              </div>

              <div className="p-3 bg-[#18102e] border border-purple-500/20 rounded-xl flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white">In-App OTA Auto-Updater:</span>
                  <p className="text-zinc-400 mt-0.5">
                    Directly check for new GitHub releases in Settings, download the update package, and install updates in-app without leaving.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-[#18102e] border border-purple-500/20 rounded-xl flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white">Focus Chamber & Synthesizer:</span>
                  <p className="text-zinc-400 mt-0.5">
                    Custom Web Audio synthetic chime engine (Golden Hour, Aura Ping, Crystal Fizz) with Pomodoro intervals and stopwatch modes.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Source & Build Commands */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <GitBranch className="w-3.5 h-3.5" />
              Build From Source (Gradle)
            </h3>
            <pre className="p-3 bg-[#0d0718] border border-purple-500/20 rounded-xl text-[11px] font-mono text-zinc-300 overflow-x-auto">
              <code>{`# Clone repository
git clone https://github.com/gianrufin/Tempo-Habit.git
cd Tempo-Habit

# Android APK build
./gradlew assembleDebug`}</code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-purple-500/20 bg-[#170e2e] flex items-center justify-between">
          <span className="text-xs text-zinc-400">Tempo • Open Source Habit Tracker</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
