import React, { useState, useEffect } from 'react';
import { Clock, Check, X, Sparkles, Sun, Moon } from 'lucide-react';

interface MaterialTimePickerProps {
  isOpen: boolean;
  initialTime?: string; // "08:30" (24h format)
  title?: string;
  onClose: () => void;
  onSelectTime: (timeString: string) => void; // returns "08:30"
}

export const MaterialTimePicker: React.FC<MaterialTimePickerProps> = ({
  isOpen,
  initialTime = '08:00',
  title = 'Select Reminder Time',
  onClose,
  onSelectTime,
}) => {
  const [activeSegment, setActiveSegment] = useState<'hour' | 'minute'>('hour');
  const [viewMode, setViewMode] = useState<'dial' | 'digital'>('dial');

  // Parse initial 24h string into 12h + AM/PM
  const parseTime = (tStr: string) => {
    const parts = (tStr || '08:00').split(':');
    let h = parseInt(parts[0], 10);
    const m = parseInt(parts[1] || '00', 10);
    if (isNaN(h)) h = 8;
    const isPm = h >= 12;
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return {
      hour: h12,
      minute: isNaN(m) ? 0 : m,
      period: (isPm ? 'PM' : 'AM') as 'AM' | 'PM',
    };
  };

  const [timeState, setTimeState] = useState(() => parseTime(initialTime));

  useEffect(() => {
    if (isOpen) {
      setTimeState(parseTime(initialTime));
      setActiveSegment('hour');
    }
  }, [isOpen, initialTime]);

  if (!isOpen) return null;

  const handleHourSelect = (h: number) => {
    setTimeState(prev => ({ ...prev, hour: h }));
    // Auto advance to minute in Material design flow
    setActiveSegment('minute');
  };

  const handleMinuteSelect = (m: number) => {
    setTimeState(prev => ({ ...prev, minute: m }));
  };

  const handleSave = () => {
    let h24 = timeState.hour % 12;
    if (timeState.period === 'PM') h24 += 12;
    const hFormatted = String(h24).padStart(2, '0');
    const mFormatted = String(timeState.minute).padStart(2, '0');
    onSelectTime(`${hFormatted}:${mFormatted}`);
    onClose();
  };

  const PRESETS = [
    { label: '07:00 AM', hour: 7, minute: 0, period: 'AM' as const },
    { label: '08:30 AM', hour: 8, minute: 30, period: 'AM' as const },
    { label: '12:30 PM', hour: 12, minute: 30, period: 'PM' as const },
    { label: '06:00 PM', hour: 6, minute: 0, period: 'PM' as const },
    { label: '09:30 PM', hour: 9, minute: 30, period: 'PM' as const },
  ];

  // Radial dial calculation
  const HOURS = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const MINUTES = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in select-none">
      <div
        className="w-full max-w-sm bg-white dark:bg-[#161026] text-zinc-900 dark:text-zinc-100 rounded-[32px] p-6 shadow-2xl border border-black/5 dark:border-white/10 flex flex-col space-y-5"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[#7C69EF]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Material 3 Digital Display Header & AM/PM Switcher */}
        <div className="flex items-center justify-center gap-3 py-2">
          {/* Hour & Minute Boxes */}
          <div className="flex items-center gap-2">
            {/* Hour Box */}
            <button
              type="button"
              onClick={() => setActiveSegment('hour')}
              className={`w-20 h-18 rounded-2xl flex items-center justify-center text-4xl font-extrabold transition-all cursor-pointer ${
                activeSegment === 'hour'
                  ? 'bg-purple-100 dark:bg-purple-900/50 text-[#7C69EF] dark:text-purple-300 ring-2 ring-[#7C69EF]'
                  : 'bg-zinc-100 dark:bg-[#1f1638] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
              }`}
            >
              {String(timeState.hour).padStart(2, '0')}
            </button>

            <span className="text-3xl font-extrabold text-zinc-400 animate-pulse">:</span>

            {/* Minute Box */}
            <button
              type="button"
              onClick={() => setActiveSegment('minute')}
              className={`w-20 h-18 rounded-2xl flex items-center justify-center text-4xl font-extrabold transition-all cursor-pointer ${
                activeSegment === 'minute'
                  ? 'bg-purple-100 dark:bg-purple-900/50 text-[#7C69EF] dark:text-purple-300 ring-2 ring-[#7C69EF]'
                  : 'bg-zinc-100 dark:bg-[#1f1638] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
              }`}
            >
              {String(timeState.minute).padStart(2, '0')}
            </button>
          </div>

          {/* AM / PM Segmented Control */}
          <div className="flex flex-col rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden bg-zinc-50 dark:bg-[#1f1638]">
            <button
              type="button"
              onClick={() => setTimeState(prev => ({ ...prev, period: 'AM' }))}
              className={`px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${
                timeState.period === 'AM'
                  ? 'bg-[#7C69EF] text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => setTimeState(prev => ({ ...prev, period: 'PM' }))}
              className={`px-3 py-2 text-xs font-bold transition-colors cursor-pointer ${
                timeState.period === 'PM'
                  ? 'bg-[#7C69EF] text-white shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              PM
            </button>
          </div>
        </div>

        {/* Mode Toggle Pills (Dial vs Keypad) */}
        <div className="flex items-center justify-between border-b border-black/5 dark:border-white/5 pb-2">
          <span className="text-[11px] font-semibold text-zinc-400">
            {activeSegment === 'hour' ? 'Select Hour (1-12)' : 'Select Minute (0-59)'}
          </span>
          <button
            type="button"
            onClick={() => setViewMode(v => (v === 'dial' ? 'digital' : 'dial'))}
            className="text-[11px] font-bold text-[#7C69EF] hover:underline"
          >
            {viewMode === 'dial' ? 'Quick Grid Mode' : 'Clock Dial Mode'}
          </button>
        </div>

        {/* Interactive Radial Clock Face */}
        {viewMode === 'dial' ? (
          <div className="relative w-56 h-56 mx-auto rounded-full bg-zinc-100 dark:bg-[#1b1330] flex items-center justify-center p-3 shadow-inner">
            {/* Center Pivot Point */}
            <div className="w-3 h-3 rounded-full bg-[#7C69EF] z-20" />

            {/* Dial Numbers */}
            {(activeSegment === 'hour' ? HOURS : MINUTES).map((val, idx) => {
              const angleDeg = idx * 30 - 90; // 12 is at -90 deg (top)
              const angleRad = (angleDeg * Math.PI) / 180;
              const radius = 86; // px distance from center
              const x = Math.round(radius * Math.cos(angleRad));
              const y = Math.round(radius * Math.sin(angleRad));

              const isSelected = activeSegment === 'hour' ? timeState.hour === val : timeState.minute === val;

              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => (activeSegment === 'hour' ? handleHourSelect(val) : handleMinuteSelect(val))}
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                  }}
                  className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#7C69EF] text-white shadow-md scale-110 z-10'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10'
                  }`}
                >
                  {val === 0 ? '00' : val}
                </button>
              );
            })}
          </div>
        ) : (
          /* Quick Grid Mode */
          <div className="grid grid-cols-4 gap-2 py-2 max-h-48 overflow-y-auto no-scrollbar">
            {(activeSegment === 'hour' ? HOURS : MINUTES).map(val => {
              const isSelected = activeSegment === 'hour' ? timeState.hour === val : timeState.minute === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => (activeSegment === 'hour' ? handleHourSelect(val) : handleMinuteSelect(val))}
                  className={`py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#7C69EF] text-white shadow-md'
                      : 'bg-zinc-100 dark:bg-[#1f1638] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200'
                  }`}
                >
                  {val === 0 ? '00' : String(val).padStart(2, '0')}
                </button>
              );
            })}
          </div>
        )}

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {PRESETS.map(p => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setTimeState({ hour: p.hour, minute: p.minute, period: p.period });
              }}
              className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-zinc-100 dark:bg-[#1f1638] hover:bg-purple-100 dark:hover:bg-purple-950 text-zinc-600 dark:text-zinc-400 hover:text-[#7C69EF] transition-colors shrink-0"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5 dark:border-white/5">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-2xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="py-2.5 px-6 rounded-2xl bg-[#7C69EF] hover:bg-[#6c59db] text-white text-xs font-bold shadow-md shadow-purple-900/20 active:scale-95 transition-all cursor-pointer"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
