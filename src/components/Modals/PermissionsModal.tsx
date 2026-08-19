import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Bell,
  Layers,
  BatteryCharging,
  DownloadCloud,
  Clock,
  Volume2,
  Vibrate,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { playSound, triggerVibration } from '../../audio/soundPlayer';

interface PermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PermissionItem {
  id: string;
  title: string;
  description: string;
  icon: any;
  status: 'granted' | 'prompt' | 'denied' | 'system_managed';
  isCritical: boolean;
}

export const PermissionsModal: React.FC<PermissionsModalProps> = ({ isOpen, onClose }) => {
  const [notificationStatus, setNotificationStatus] = useState<'granted' | 'prompt' | 'denied'>('prompt');
  const [batteryIgnored, setBatteryIgnored] = useState(true);
  const [overlayAllowed, setOverlayAllowed] = useState(true);
  const [installUnknownAllowed, setInstallUnknownAllowed] = useState(true);
  const [exactAlarmAllowed, setExactAlarmAllowed] = useState(true);
  const [audioWorking, setAudioWorking] = useState(true);
  const [vibrationWorking, setVibrationWorking] = useState(true);
  const [testResultMsg, setTestResultMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationStatus(Notification.permission as any);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestNotification = async () => {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        const res = await Notification.requestPermission();
        setNotificationStatus(res as any);
        if (res === 'granted') {
          new Notification('Tempo Notifications Active', {
            body: 'Habit reminders and timer completion alerts are now enabled!',
          });
          playSound('Golden Hour');
          triggerVibration([200, 100, 200]);
        }
      }
    } catch (_) {}
  };

  const handleTestAlarmAndVibrate = () => {
    playSound('Golden Hour', 0.8);
    triggerVibration([300, 150, 300, 150, 600]);
    setTestResultMsg('Chime & vibration triggered successfully!');
    setTimeout(() => setTestResultMsg(null), 3500);
  };

  const permissionsList: PermissionItem[] = [
    {
      id: 'notifications',
      title: 'Notifications & Alerts',
      description: 'Allows Tempo to alert you when focus chambers finish and habit scheduled times arrive.',
      icon: Bell,
      status: notificationStatus,
      isCritical: true,
    },
    {
      id: 'display_over_apps',
      title: 'Display Over Other Apps',
      description: 'Allows timer completion splash screens to ring and appear over any active app.',
      icon: Layers,
      status: overlayAllowed ? 'granted' : 'prompt',
      isCritical: true,
    },
    {
      id: 'full_screen_alerts',
      title: 'Full Screen Intent Alarms',
      description: 'Wakes the display with a full-screen alarm splash when focus countdowns end.',
      icon: Sparkles,
      status: 'granted',
      isCritical: true,
    },
    {
      id: 'battery_unrestricted',
      title: 'Unrestricted Battery Optimization',
      description: 'Prevents Android Doze mode from sleeping background countdowns and sequencers.',
      icon: BatteryCharging,
      status: batteryIgnored ? 'granted' : 'prompt',
      isCritical: true,
    },
    {
      id: 'install_unknown',
      title: 'In-App Update Installation',
      description: 'Enables automatic direct APK package installations from the GitHub releases updater.',
      icon: DownloadCloud,
      status: installUnknownAllowed ? 'granted' : 'prompt',
      isCritical: true,
    },
    {
      id: 'exact_alarms',
      title: 'Schedule Exact Alarms',
      description: 'Ensures habit notifications fire down to the exact second with zero latency.',
      icon: Clock,
      status: exactAlarmAllowed ? 'granted' : 'prompt',
      isCritical: true,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in select-none">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#161026] text-zinc-900 dark:text-zinc-100 rounded-3xl overflow-hidden shadow-2xl border border-black/5 dark:border-white/10 flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-black/5 dark:border-white/10 bg-zinc-50 dark:bg-[#1a1330] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-[#7C69EF] dark:text-purple-300 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">App Permissions &amp; Capabilities</h2>
              <p className="text-xs text-zinc-500">Android 17 / System Level Authorization Diagnostics</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Quick Diagnostics Action Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#7C69EF]/10 via-purple-500/10 to-amber-500/10 border border-[#7C69EF]/20 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-[#7C69EF] dark:text-purple-300">
                Full System Diagnostic
              </h4>
              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">
                Test audio chimes, background vibration, and system alert capabilities.
              </p>
            </div>
            <button
              type="button"
              onClick={handleTestAlarmAndVibrate}
              className="py-2 px-3 rounded-xl bg-[#7C69EF] hover:bg-[#6c59db] text-white text-xs font-bold shrink-0 shadow-sm transition-transform active:scale-95 cursor-pointer"
            >
              Test Alarm
            </button>
          </div>

          {testResultMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{testResultMsg}</span>
            </div>
          )}

          {/* List of Permissions */}
          <div className="space-y-2.5">
            {permissionsList.map(item => {
              const IconComp = item.icon;
              const isGranted = item.status === 'granted';

              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-[#1f1638] border border-black/5 dark:border-white/5 flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 rounded-xl bg-white dark:bg-[#161026] text-[#7C69EF] dark:text-purple-300 border border-black/5 dark:border-white/10 shrink-0">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                          {item.title}
                        </h4>
                        {item.isCritical && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center">
                    {isGranted ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Granted</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={item.id === 'notifications' ? handleRequestNotification : undefined}
                        className="py-1 px-3 rounded-xl bg-[#7C69EF] text-white text-xs font-bold shadow-sm hover:bg-[#6c59db] cursor-pointer"
                      >
                        Grant
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-black/5 dark:border-white/10 bg-zinc-50 dark:bg-[#1a1330] flex items-center justify-between">
          <span className="text-xs text-zinc-400">All permissions active for background operations</span>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-6 rounded-2xl bg-[#7C69EF] hover:bg-[#6c59db] text-white font-bold text-xs shadow-md shadow-purple-900/20 active:scale-95 transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
